/**
 * Subject: Temporal Assessment of Water Quality Using Copernicus Sentinel-2
 * AUTHOR: Jismi Joy
 * COURSE: The Copernicus Green Revolution for Sustainable Development
 * * OBJECTIVE: 
 * Comparative spatio-temporal analysis of water quality using Sentinel-2 
 * Level-2A (Surface Reflectance) Harmonized data.
 */

ui.root.clear();
var map = ui.Map();
map.setOptions('SATELLITE');
ui.root.add(map);

// 1. UI SIDEBAR 
var panel = ui.Panel({style: {width: '460px', padding: '15px', border: '1px solid #ccc'}});
ui.root.insert(0, panel);

panel.add(ui.Label('Water Quality Assessment', {fontSize: '22px', fontWeight: 'bold', color: '#2c3e50'}));

var infoBox = ui.Panel({
  style: {backgroundColor: '#f8f9fa', padding: '8px', border: '1px solid #dee2e6', margin: '10px 0'}
});
infoBox.add(ui.Label('Scientific Interpretation:', {fontWeight: 'bold', fontSize: '12px'}));
infoBox.add(ui.Label('• NDCI: High values (>0.1) suggest algae/chlorophyll.\n• NDTI: High values (>0.05) indicate turbidity/sediment.\n• CDOM: Ratio reflects organic dissolved matter.', {fontSize: '11px', whiteSpace: 'pre'}));
panel.add(infoBox);

var startDate = ui.Textbox({value: '2025-01-01', style: {width: '100px'}});
var endDate   = ui.Textbox({value: '2026-01-01', style: {width: '100px'}});

panel.add(ui.Label('Analysis Start (T1):')); panel.add(startDate);
panel.add(ui.Label('Analysis End (T2):')); panel.add(endDate);

var drawingTools = map.drawingTools();
var output = ui.Panel();
panel.add(output);

// 2.  LEGEND BUILDER
var palettes = {
  chl: ['#0000FF', '#00FF00', '#FFFF00', '#FF0000'],
  turb: ['#f9f7f7', '#f39c12', '#8e44ad'],
  cdom: ['#ffffff', '#3498db', '#2c3e50'],
  change: ['#0571b0', '#f7f7f7', '#ca0020']
};

function createLegend(title, palette, min, max) {
  var legendPanel = ui.Panel({style: {padding: '5px', margin: '5px 0', border: '1px solid #eee'}});
  var legendTitle = ui.Label({value: title, style: {fontWeight: 'bold', fontSize: '12px'}});
  var lon = ee.Image.pixelLonLat().select('longitude');
  var gradient = lon.multiply((max-min)/100).add(min);
  var legendImage = gradient.visualize({min: min, max: max, palette: palette});
  var thumbnail = ui.Thumbnail({image: legendImage, params: {bbox:'0,0,100,10', dimensions:'200x12'}});
  var labels = ui.Panel([ui.Label(min), ui.Label(max, {textAlign: 'right', stretch: 'horizontal'})], ui.Panel.Layout.flow('horizontal'));
  return legendPanel.add(legendTitle).add(thumbnail).add(labels);
}

// 3. IMAGE PROCESSING FUNCTIONS
function preprocess(image) {
  var qa = image.select('QA60');
  var mask = qa.bitwiseAnd(1 << 10).eq(0).and(qa.bitwiseAnd(1 << 11).eq(0));
  return image.updateMask(mask).divide(10000).copyProperties(image, ['system:time_start']);
}

function addIndices(image) {
  var ndwi = image.normalizedDifference(['B3', 'B8']).rename('NDWI');
  var ndci = image.normalizedDifference(['B5', 'B4']).rename('NDCI'); 
  var ndti = image.normalizedDifference(['B4', 'B3']).rename('NDTI'); 
  var cdom = image.select('B3').divide(image.select('B4')).rename('CDOM'); 
  return image.addBands([ndwi, ndci, ndti, cdom]);
}


function run() {
  output.clear();
  map.layers().reset();
  
  if (drawingTools.layers().length() === 0) {
    output.add(ui.Label('⚠️ Please draw a polygon first!', {color: 'red'})); return;
  }

  var aoi = drawingTools.layers().get(0).getEeObject();
  var region = aoi.buffer(500);
  map.centerObject(aoi, 13);

  var s2Col = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(region)
    .filterDate(startDate.getValue(), endDate.getValue())
    .map(preprocess)
    .map(addIndices);

  var t1 = s2Col.filterDate(startDate.getValue(), ee.Date(startDate.getValue()).advance(1, 'month')).median().clip(region);
  var t2 = s2Col.filterDate(ee.Date(endDate.getValue()).advance(-1, 'month'), endDate.getValue()).median().clip(region);

  var check = t1.bandNames().size().getInfo();
  if (check === 0) {
    output.add(ui.Label('❌ NO DATA FOUND. Change dates.', {color: 'red'})); return;
  }

  var waterMask = t1.select('NDWI').gt(0.1);
  t1 = t1.updateMask(waterMask); t2 = t2.updateMask(waterMask);

  // MAP LAYERS
  map.addLayer(t1.select('NDCI'), {min: -0.1, max: 0.2, palette: palettes.chl}, '1. Chlorophyll (T1)', false);
  map.addLayer(t2.select('NDCI'), {min: -0.1, max: 0.2, palette: palettes.chl}, '1. Chlorophyll (T2)', true);
  map.addLayer(t2.select('NDCI').subtract(t1.select('NDCI')), {min: -0.1, max: 0.1, palette: palettes.change}, '1. Chlorophyll Change', false);

  map.addLayer(t1.select('NDTI'), {min: -0.1, max: 0.1, palette: palettes.turb}, '2. Turbidity (T1)', false);
  map.addLayer(t2.select('NDTI'), {min: -0.1, max: 0.1, palette: palettes.turb}, '2. Turbidity (T2)', true);
  map.addLayer(t2.select('NDTI').subtract(t1.select('NDTI')), {min: -0.1, max: 0.1, palette: palettes.change}, '2. Turbidity Change', false);

  map.addLayer(t1.select('CDOM'), {min: 0.8, max: 1.5, palette: palettes.cdom}, '3. CDOM (T1)', false);
  map.addLayer(t2.select('CDOM'), {min: 0.8, max: 1.5, palette: palettes.cdom}, '3. CDOM (T2)', true);
  map.addLayer(t2.select('CDOM').subtract(t1.select('CDOM')), {min: -0.2, max: 0.2, palette: palettes.change}, '3. CDOM Change', false);

  var vuln = t2.select('NDCI').subtract(t1.select('NDCI')).gt(0.05).selfMask();
  map.addLayer(vuln, {palette: ['#FF0000']}, '⚠️ VULNERABILITY HOTSPOT');

  // OUTPUTS: LEGENDS
  output.add(ui.Label('1. DATA LEGENDS', {fontWeight: 'bold', margin: '10px 0 5px 0'}));
  output.add(createLegend('Chlorophyll (Normalized Difference Chlorophyll Index)', palettes.chl, -0.1, 0.2));
  output.add(createLegend('Turbidity  (Normalized Difference Turbidity Index)', palettes.turb, -0.1, 0.1));
  output.add(createLegend('CDOM Proxy (Colored Dissolved Organic Matter)', palettes.cdom, 0.8, 1.5));
  output.add(createLegend('Temporal Difference Graph', palettes.change, -0.1, 0.1));

  // OUTPUTS: CHARTS
  output.add(ui.Label('2. TEMPORAL TRENDS', {fontWeight: 'bold', margin: '15px 0 5px 0'}));
  
  
  var chartOptions = { 
    hAxis: {
      title: 'Date', 
      viewWindow: {
        min: new Date(startDate.getValue()), 
        max: new Date(endDate.getValue())
      }
    }, 
    vAxis: {title: 'Index Value'}, 
    pointSize: 2 
  };

  output.add(ui.Chart.image.series(s2Col.select('NDCI'), aoi, ee.Reducer.mean(), 50)
    .setOptions({title: 'Chlorophyll Trend', colors:['#2ecc71'], hAxis:chartOptions.hAxis, vAxis:chartOptions.vAxis}));

  output.add(ui.Chart.image.series(s2Col.select('NDTI'), aoi, ee.Reducer.mean(), 50)
    .setOptions({title: 'Turbidity Trend', colors:['#e67e22'], hAxis:chartOptions.hAxis, vAxis:chartOptions.vAxis}));
  
  output.add(ui.Chart.image.series(s2Col.select('CDOM'), aoi, ee.Reducer.mean(), 50)
    .setOptions({title: 'CDOM Trend', colors:['#3498db'], hAxis:chartOptions.hAxis, vAxis:chartOptions.vAxis}));

  output.add(ui.Chart.image.series(s2Col.select(['NDCI', 'NDTI', 'CDOM']), aoi, ee.Reducer.mean(), 50)
    .setOptions({
      title: 'Combined Trends', 
      hAxis:chartOptions.hAxis, 
      series: {0:{color:'#2ecc71'}, 1:{color:'#e67e22'}, 2:{color:'#3498db'}}
    }));
}

var runBtn = ui.Button({label: 'Check water Quality', onClick: run, style: {width: '100%', fontWeight: 'bold', color: '#1a5276'}});
panel.add(runBtn);
