import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

// Define interfaces for API responses
interface AuthResponse {
  data: {
    access_token: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class WeatherServiceService {
  private clientId = 'ti5EIU0BJUuZPmsNnTfdsu5KePbIRgtL'; // Replace with your actual Client ID
  private clientSecret = '3gzCHFoUdCk-OsOMMSn8O19qfVi4zkcJsF6OkTjs7lD9femzdzZc8O3HxdhmacHp'; // Replace with your actual Client Secret
  private audience = 'https://weather.api.dtn.com/conditions';
  private audience1 = 'https://weather.api.dtn.com/observations';
  private audience2 = 'https://map.api.dtn.com';
  private authUrl = 'https://api.auth.dtn.com/v1/tokens/authorize';
  private conditionsApiUrl = 'https://weather.api.dtn.com/v2/conditions';
  private observationsApiUrl = 'https://obs.api.dtn.com/v2/observations'; // New Observations API URL
private catlogApiUrl ='https://map.api.dtn.com/v2/catalog'
private apiUrl = 'https://map.api.dtn.com/v2/timestamps';

  constructor(private http: HttpClient) { }

  // Method to get the access token
  getAccessToken(): Observable<string> {
    const body = {
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      audience: this.audience2
    };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post<AuthResponse>(this.authUrl, body, { headers }).pipe(
      map(response => response.data.access_token) // Use 'access_token' from the response
    );
  }

  // Method to fetch weather conditions data
  getWeatherData(lat: number, lon: number, accessToken: string): Observable<any> {
    const currentTime = new Date().toISOString(); // Get current time in ISO 8601 format
    const endTime = '2024-11-08T09:00:00Z'; // Example static end time

    // Construct query parameters with start and end time
    const queryParams = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      startTime: currentTime,
      endTime: endTime
    }).toString();

    const url = `${this.conditionsApiUrl}?${queryParams}`;
    console.log(url)
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });

    return this.http.get(url, { headers }).pipe(
      catchError(error => {
        console.error(`Error fetching weather data for ${lat}, ${lon}:`, error);
        return of(null); // Return null in case of error
      })
    );
  }

  // Method to fetch observations data
  getObservationsData(minLat: number, maxLat: number, minLon: number, maxLon: number, accessToken: string): Observable<any> {
    const queryParams = new URLSearchParams({
      by: 'boundingBox',
      minLat: minLat.toString(),
      maxLat: maxLat.toString(),
      minLon: minLon.toString(),
      maxLon: maxLon.toString(),
      obsTypes: 'SYNOP' // Specify observation type
    }).toString();
  
    const url = `${this.observationsApiUrl}/stations?${queryParams}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });
  
    return this.http.get(url, { headers }).pipe(
      catchError(error => {
        console.error(`Error fetching observations data for bounding box:`, error);
        return of(null); // Return null in case of error
      })
    );
  }

  // Method to fetch Catalog data
  getCatalogData(accessToken: string): Observable<any> {
    const url = `${this.catlogApiUrl}`;
    console.log(url)
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });
    return this.http.get<any>(this.catlogApiUrl, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching catalog data:', error);
        return of(null);  
      })
    );
  }

  getTileSetId(layerId: string, accessToken: string): Observable<any> {
    const url = `${this.apiUrl}/${layerId}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });
  
    // console.log('Requesting Tile Set ID for Layer:', url);
    return this.http.get<any>(url, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching Tile Set ID:', error);
        return of({ error: true, message: error.message });
      })
    );
  }
  
}
