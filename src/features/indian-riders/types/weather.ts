export interface WeatherData {
  control: string;
  condition: 'rain' | 'cloudy' | 'sunny';
  temperature?: number;
  description?: string;
}

export interface Control {
  id: string;
  name: string;
  km: number;
  leg: 'North' | 'South';
}