# Temporal-Assessment-of-Water-Quality-Using-Copernicus-Sentinel-2
A Google Earth Engine Based Analytical Dashboard utilizing Copernicus Sentinel-2 MSI Data
## Overview
This repository hosts a cloud-native analytical dashboard built on **Google Earth Engine (GEE)**. It leverages the **Copernicus Sentinel-2** constellation to provide a high-frequency, multi-parametric assessment of inland and coastal water bodies. 

The project addresses the "Invisible Water Crisis" by democratizing access to environmental engineering tools, enabling local agencies and NGOs to perform professional-grade monitoring without local hardware infrastructure.

##  Key Features
- **Multi-Parametric Monitoring:** Automated calculation of Chlorophyll-a (NDCI), Turbidity (NDTI), and Colored Dissolved Organic Matter (CDOM).
- **Temporal Change Detection:** Compares two user-defined periods ($T_1$ vs $T_2$) to visualize ecological trends and degradation.
- **Vulnerability Hotspots:** Automated flagging system for areas showing significant water quality decline.


| Index | Name | Focus | Formula |
| :--- | :--- | :--- | :--- |
| **NDCI** | Normalized Difference Chlorophyll Index | Algae/Phytoplankton | $(B5 - B4) / (B5 + B4)$ |
| **NDTI** | Normalized Difference Turbidity Index | Suspended Sediment | $(B4 - B3) / (B4 + B3)$ |
| **CDOM** | Organic Proxy | Dissolved Organics | $B3 / B4$ |
| **NDWI** | Water Mask | Aquatic Extraction | $(B3 - B8) / (B3 + B8)$ |

## Usage
1. **Access:** Copy the script in `src/water_quality_gee.js` into your [GEE Code Editor](https://code.earthengine.google.com/).
2. **Select Area:** Use the geometry tools to draw a polygon over your study area (e.g., Valle Bertuzzi, Italy).
3. **Configure Dates:** Adjust the start and end dates for your Reference ($T_1$) and Comparison ($T_2$) periods in the UI panel.
4. **Analyze:** Run the script to generate interactive layers, change maps, and dynamic time-series charts.

## 🌍 Impact: Democratizing Environmental Engineering
Our solution democratizes environmental monitoring by removing infrastructure barriers. Using open Sentinel data, organizations and consultancies in any region can now perform water quality assessments for their specific study areas and timelines. 


## Academic Context
Developed as part of the course **Copernicus Green Revolution (2025/2026)** at **Politecnico di Milano**.

---
**Author:** Jismi Joy 
**Contact:** jismi0099@gamil.com
