export interface Airport {
  id: string;
  ident: string;
  type: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation_ft: number;
  continent: string;
  iso_country: string;
  iso_region: string;
  municipality: string;
  iata_code: string;
  local_code: string;
  longest_runway_ft: number;
  runways: number;
  safety_level: 'excellent' | 'good' | 'adequate' | 'marginal';
  is_default?: boolean;
  keywords?: string;
}

export interface FlightData {
  departure: Airport;
  destination: Airport;
  distance_nm: number;
  distance_km: number;
  distance_mi: number;
  flight_time_hours: number;
  flight_time_formatted: string;
  fuel_gallons: number;
  fuel_cost_usd: number;
  bearing: number;
  is_within_range: boolean;
  runway_safety: {
    departure: 'safe' | 'marginal' | 'critical';
    destination: 'safe' | 'marginal' | 'critical';
  };
}

// G550 specifications
export const G550_SPECS = {
  cruise_speed_knots: 460, // Mach 0.80
  max_speed_knots: 575, // Mach 0.89
  range_nm: 6750,
  fuel_capacity_gallons: 6856,
  fuel_consumption_gph: 377, // Average
  min_runway_takeoff_ft: 5910,
  min_runway_landing_ft: 2770,
  service_ceiling_ft: 51000,
  passenger_capacity: 19,
};

// Earth radius in nautical miles
const EARTH_RADIUS_NM = 3440.065;
const EARTH_RADIUS_KM = 6371;
const EARTH_RADIUS_MI = 3958.8;

// Convert degrees to radians
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Convert radians to degrees
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

// Calculate great circle distance using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { nm: number; km: number; mi: number } {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return {
    nm: EARTH_RADIUS_NM * c,
    km: EARTH_RADIUS_KM * c,
    mi: EARTH_RADIUS_MI * c,
  };
}

// Calculate bearing between two points
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  const bearing = toDegrees(Math.atan2(y, x));
  
  // Normalize to 0-360
  return (bearing + 360) % 360;
}

// Calculate flight time based on distance and cruise speed
export function calculateFlightTime(
  distance_nm: number,
  cruiseSpeed: number = G550_SPECS.cruise_speed_knots
): { hours: number; formatted: string } {
  const hours = distance_nm / cruiseSpeed;
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  let formatted = '';
  if (wholeHours > 0) {
    formatted += `${wholeHours}h `;
  }
  formatted += `${minutes}m`;
  
  return {
    hours,
    formatted: formatted.trim(),
  };
}

// Estimate fuel consumption
export function calculateFuelConsumption(
  flightTimeHours: number,
  consumptionRate: number = G550_SPECS.fuel_consumption_gph
): number {
  // Add 10% for taxi, climb, descent, and reserves
  return flightTimeHours * consumptionRate * 1.1;
}

// Calculate fuel cost (average Jet-A price)
export function calculateFuelCost(
  gallons: number,
  pricePerGallon: number = 6.50 // Average Jet-A price
): number {
  return gallons * pricePerGallon;
}

// Check runway safety
export function checkRunwaySafety(
  runwayLength: number,
  isDestination: boolean = false
): 'safe' | 'marginal' | 'critical' {
  const minRequired = isDestination 
    ? G550_SPECS.min_runway_landing_ft 
    : G550_SPECS.min_runway_takeoff_ft;
  
  const safetyMargin = 1.25; // 25% safety margin
  const criticalMargin = 1.1; // 10% margin is critical
  
  if (runwayLength >= minRequired * safetyMargin) {
    return 'safe';
  } else if (runwayLength >= minRequired * criticalMargin) {
    return 'marginal';
  } else {
    return 'critical';
  }
}

// Calculate complete flight data
export function calculateFlightData(
  departure: Airport,
  destination: Airport
): FlightData {
  const distance = calculateDistance(
    departure.latitude,
    departure.longitude,
    destination.latitude,
    destination.longitude
  );
  
  const bearing = calculateBearing(
    departure.latitude,
    departure.longitude,
    destination.latitude,
    destination.longitude
  );
  
  const flightTime = calculateFlightTime(distance.nm);
  const fuelNeeded = calculateFuelConsumption(flightTime.hours);
  const fuelCost = calculateFuelCost(fuelNeeded);
  
  return {
    departure,
    destination,
    distance_nm: distance.nm,
    distance_km: distance.km,
    distance_mi: distance.mi,
    flight_time_hours: flightTime.hours,
    flight_time_formatted: flightTime.formatted,
    fuel_gallons: Math.round(fuelNeeded),
    fuel_cost_usd: Math.round(fuelCost),
    bearing: Math.round(bearing),
    is_within_range: distance.nm <= G550_SPECS.range_nm,
    runway_safety: {
      departure: checkRunwaySafety(departure.longest_runway_ft, false),
      destination: checkRunwaySafety(destination.longest_runway_ft, true),
    },
  };
}

// Format bearing as compass direction
export function formatBearing(bearing: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                     'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return `${Math.round(bearing)}° ${directions[index]}`;
}

// Format distance with units
export function formatDistance(distance: number, unit: 'nm' | 'km' | 'mi'): string {
  const rounded = Math.round(distance);
  const formatted = rounded.toLocaleString();
  
  switch (unit) {
    case 'nm':
      return `${formatted} nm`;
    case 'km':
      return `${formatted} km`;
    case 'mi':
      return `${formatted} mi`;
    default:
      return formatted;
  }
}