import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { WeatherServiceService } from '../Service/weather-service.service';

@Component({
  selector: 'app-weather-map',
  standalone: true,
  imports: [],
  templateUrl: './weather-map.component.html',
  styleUrl: './weather-map.component.scss'
})
export class WeatherMapComponent implements OnInit {
  private map: any;
  private lat = 20.5937; // Default latitude for India
  private lon = 78.9629; // Default longitude for India
  private markers: L.Marker[] = []; // Array to store all markers
  private weatherLayers: any = {};
  private currentLayer: L.ImageOverlay | null = null;
  private layerControl: L.Control.Layers | null = null; 


  constructor(private weatherService: WeatherServiceService) { }

  ngOnInit(): void {
    this.initializeMap();
    this.fetchCatalogData();

  }

  private initializeMap(): void {
    this.map = L.map('map').setView([this.lat, this.lon], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(this.map);

    this.layerControl = L.control.layers({}, {}, { position: 'topleft' }).addTo(this.map);
  }

  fetchWeatherData(): void {
    this.weatherService.getAccessToken().subscribe(
      (tokenResponse: string) => {
        console.log('Token Response:', tokenResponse); // Log the JWT token to check it
        if (tokenResponse) {
          const accessToken = tokenResponse; // Use the tokenResponse directly as the access token
          this.weatherService.getWeatherData(this.lat, this.lon, accessToken).subscribe(
            (weatherData: any) => {
              console.log('Weather Data:', weatherData);
              this.addMarkersForWeatherData(weatherData);
            },
            (error) => {
              console.error('Error fetching weather data:', error);
            }
          );
        } else {
          console.error('Access token is missing or undefined');
        }
      },
      (error) => {
        console.error('Error obtaining access token:', error);
      }
    );
  }

  private addMarkersForWeatherData(weatherData: any): void {
    // Assuming weatherData contains an array of hourly data for different times
    const weatherHourlyData = weatherData.features[0].properties;

    for (let time in weatherHourlyData) {
      const data = weatherHourlyData[time];

      // Create a marker for each hourly data point
      const marker = L.marker([this.lat, this.lon]).addTo(this.map); // You can customize latitude and longitude for each marker

      // Add a popup with weather data
      const popupContent = `
        <strong>Time:</strong> ${time}<br>
        <strong>Temperature:</strong> ${data.airTemp} °C<br>
        <strong>Humidity:</strong> ${data.relativeHumidity ?? 'N/A'} %<br>
        <strong>Wind Speed:</strong> ${data.windSpeed} m/s<br>
        <strong>Visibility:</strong> ${data.visibility ?? 'N/A'} km
      `;

      marker.bindPopup(popupContent).openPopup();
      this.markers.push(marker); // Store the marker if you want to later manipulate or remove them
    }
  }




  fetchObservationsData(): void {
    this.weatherService.getAccessToken().subscribe(
      (tokenResponse: string) => {
        console.log('Token Response:', tokenResponse);
        if (tokenResponse) {
          const accessToken = tokenResponse;
          const minLat = 6.0; // Set minimum latitude for bounding box
          const maxLat = 37.0; // Set maximum latitude for bounding box
          const minLon = 68.0; // Set minimum longitude for bounding box
          const maxLon = 97.0; // Set maximum longitude for bounding box

          this.weatherService.getObservationsData(minLat, maxLat, minLon, maxLon, accessToken).subscribe(
            (observationsData: any) => {
              console.log('Observations Data:', observationsData);
              if (observationsData) {
                this.addMarkersForObservationsData(observationsData);

              }
            },
            (error) => {
              console.error('Error fetching observations data:', error);
            }
          );
        } else {
          console.error('Access token is missing or undefined');
        }
      },
      (error) => {
        console.error('Error obtaining access token:', error);
      }
    );
  }


  private addMarkersForObservationsData(observationsData: any): void {
    observationsData.features.forEach((feature: any) => {
      const [lon, lat] = feature.geometry.coordinates;
      const stationName = feature.properties.tags.name;
      const params = feature.properties.parameters.airTemp;
      const wmoCode = feature.properties.tags.wmo;
      const lastObsTimestamp = feature.properties.lastObsTimestamp;
      const airTemp = feature.properties.parameters.airTemp?.value ?? 'N/A';
      const airTempMax12Hour = feature.properties.parameters?.airTempMax12Hour?.value ?? 'N/A';
      const airTempMin12Hour = feature.properties.parameters?.airTempMin12Hour?.value ?? 'N/A';
      const cloudBase = feature.properties.parameters?.cloudBase?.value ?? 'N/A';
      const cloudCover = feature.properties.parameters?.cloudCover?.value ?? 'N/A';
      const dewPoint = feature.properties.parameters?.dewPoint?.value ?? 'N/A';



      // console.log(`Station: ${stationName}, airTemp: ${airTemp}, airTempMax12Hour: ${airTempMax12Hour}`);

      console.log(params, "hj")

      const customIcon = L.icon({
        iconUrl: 'https://freesvg.org/img/ts-map-pin.png',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [-0, -15]
      });

      const marker = L.marker([lat, lon], { icon: customIcon }).addTo(this.map);

      // Corrected popup content
      const popupContent = `
        <strong>Station:</strong> ${stationName} (${wmoCode})<br>
        <strong>Last Observation:</strong> ${lastObsTimestamp}<br>
        <strong>Elevation:</strong> ${feature.properties.elevation} m<br>
         <strong>Temperature:</strong> ${airTemp} °C<br>
      <strong>Max Temp (12h):</strong> ${airTempMax12Hour} °C<br>
      <strong>Min Temp (12h):</strong> ${airTempMin12Hour} °C<br>
      <strong>Cloud Base:</strong> ${cloudBase} m<br>
      <strong>Cloud Cover:</strong> ${cloudCover} %<br>
      <strong>Dew Point:</strong> ${dewPoint} °C<br>
      `;

      marker.bindPopup(popupContent).openPopup();
      this.markers.push(marker);
    });


  }


  fetchCatalogData(): void {
    this.weatherService.getAccessToken().subscribe(
      (tokenResponse: string) => {
        console.log('Token Response:', tokenResponse);
        if (tokenResponse) {
          const accessToken = tokenResponse;

          this.weatherService.getCatalogData(accessToken).subscribe(
            (catalogData: any) => {
              console.log('Catalog Data:', catalogData);
              this.processCatalogData(catalogData, accessToken);
            },
            (error: any) => {
              console.error('Error fetching catalog data:', error);
            }
          );
        } else {
          console.error('Access token is missing or undefined');
        }
      },
      (error) => {
        console.error('Error obtaining access token:', error);
      }
    );
  }


  private processCatalogData(catalogData: any, accessToken: string): void {
    catalogData.layers.forEach((layerinfo: any) => {
      const layerId = layerinfo.id;
      const layerName = layerinfo.label;
      const z = 0; // Zoom level
      const x = 0; // X coordinate
      const y = 0; // Y coordinate
      const ext = 'png'; // File extension for the image format timestamps

      // Fetch tileSetId from the Timestamps endpoint
      this.weatherService.getTileSetId(layerId, accessToken).subscribe(
        (response) => {
           if (response && response[0] && response[0].timestamps && response[0].timestamps.length > 0)  {
            const timestamps = response[0]?.timestamps;
            if (!timestamps || timestamps.length === 0) {
              console.error('No timestamps found in the response');
              return;
            }
        
            // Assuming you want the first tileSetId from the array (or modify as needed)
            const tileSetId = timestamps[0]?.tileSetId;

            console.log('Tile Set ID:', tileSetId);
            // Construct the Tile Layer URL
            const tileLayerUrl = `https://map.api.dtn.com/v2/tiles/${layerId}/${tileSetId}/${z}/${x}/${y}.${ext}?token=${accessToken}&size=512&scheme=xyz`;
            console.log(tileLayerUrl)
            const imageBounds: L.LatLngBoundsExpression = [[-90, -180], [90, 180]];

          // Create the image overlay layer
          const overlayLayer = L.imageOverlay(tileLayerUrl, imageBounds, {
            opacity: 0.7,
            attribution: 'Weather data &copy; DTN',
          });


          if (overlayLayer ) {
            // Store the overlayLayer and add it to the single layer control
            this.weatherLayers[layerId] = overlayLayer;
            if (this.layerControl) {
              this.layerControl.addOverlay(overlayLayer, layerId);
            }
          } else {
            console.error(`Failed to create overlay layer for ${layerId}`);
          }
        }
      },
      (error: any) => {
        console.error('Error fetching tile set ID:', error);
      }
    );
  });

  // Handle layer selection
  this.map.on('overlayadd', (event: any) => {
    const selectedLayer = event.layer as L.ImageOverlay;

    // Remove the current layer if it exists and is different from the selected one
    if (this.currentLayer && this.currentLayer !== selectedLayer) {
      this.map.removeLayer(this.currentLayer);
    }

    // Set the selected layer as the current layer and add it to the map
    this.currentLayer = selectedLayer;
  });

  this.map.on('overlayremove', () => {
    // Remove the current layer if deselected
    if (this.currentLayer) {
      this.map.removeLayer(this.currentLayer);
      this.currentLayer = null;
    }
  });
  }
    }
  

   

 
  








