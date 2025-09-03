import Fuse from 'fuse.js';
import airportsData from '@/data/airports.json';
import { Airport } from './calculations';

// Type assertion for imported JSON
const airports: Airport[] = airportsData as Airport[];

// Create Fuse search instance for fuzzy searching
const fuseOptions = {
  keys: [
    { name: 'name', weight: 0.3 },
    { name: 'municipality', weight: 0.2 },
    { name: 'ident', weight: 0.25 },
    { name: 'iata_code', weight: 0.25 },
  ],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2,
};

const fuse = new Fuse(airports, fuseOptions);

// Get default airport (Carlsbad)
export function getDefaultAirport(): Airport {
  const carlsbad = airports.find(a => a.ident === 'KCRQ');
  if (!carlsbad) {
    // Fallback to first airport if Carlsbad not found (shouldn't happen)
    return airports[0];
  }
  return carlsbad;
}

// Search airports by query
export function searchAirports(query: string, limit: number = 10): Airport[] {
  if (!query || query.length < 2) {
    return [];
  }
  
  // First try exact match on ICAO/IATA codes
  const upperQuery = query.toUpperCase();
  const exactMatch = airports.filter(a => 
    a.ident === upperQuery || 
    a.iata_code === upperQuery
  );
  
  if (exactMatch.length > 0) {
    return exactMatch.slice(0, limit);
  }
  
  // Use fuzzy search
  const results = fuse.search(query, { limit });
  return results.map(result => result.item);
}

// Get airport by identifier
export function getAirportByIdent(ident: string): Airport | null {
  return airports.find(a => 
    a.ident === ident || 
    a.iata_code === ident
  ) || null;
}

// Get nearby airports
export function getNearbyAirports(
  latitude: number,
  longitude: number,
  maxDistanceNm: number = 100,
  limit: number = 10
): Airport[] {
  const nearbyAirports = airports
    .map(airport => {
      const dlat = airport.latitude - latitude;
      const dlon = airport.longitude - longitude;
      // Quick distance approximation (not exact but fast for sorting)
      const distanceApprox = Math.sqrt(dlat * dlat + dlon * dlon) * 60;
      return { airport, distance: distanceApprox };
    })
    .filter(item => item.distance <= maxDistanceNm)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(item => item.airport);
  
  return nearbyAirports;
}

// Get airports by country
export function getAirportsByCountry(countryCode: string): Airport[] {
  return airports.filter(a => a.iso_country === countryCode);
}

// Get airports by safety level
export function getAirportsBySafetyLevel(level: string): Airport[] {
  return airports.filter(a => a.safety_level === level);
}

// Get popular destinations (major international airports)
export function getPopularDestinations(): Airport[] {
  const popularCodes = [
    'KJFK', 'KLAX', 'KORD', 'KATL', 'KDFW', // US majors
    'EGLL', 'LFPG', 'EDDF', 'EHAM', 'LEMD', // Europe
    'OMDB', 'OERK', 'OEJN', // Middle East
    'RJTT', 'RKSI', 'ZBAA', 'VHHH', 'WSSS', // Asia
    'YSSY', 'YMML', // Australia
    'SBGR', 'MMMX', // Latin America
  ];
  
  return popularCodes
    .map(code => getAirportByIdent(code))
    .filter((a): a is Airport => a !== null);
}

// Get airport statistics
export function getAirportStats() {
  const stats = {
    total: airports.length,
    byCountry: {} as Record<string, number>,
    bySafetyLevel: {} as Record<string, number>,
    byType: {} as Record<string, number>,
  };
  
  airports.forEach(airport => {
    // By country
    stats.byCountry[airport.iso_country] = 
      (stats.byCountry[airport.iso_country] || 0) + 1;
    
    // By safety level
    stats.bySafetyLevel[airport.safety_level] = 
      (stats.bySafetyLevel[airport.safety_level] || 0) + 1;
    
    // By type
    stats.byType[airport.type] = 
      (stats.byType[airport.type] || 0) + 1;
  });
  
  return stats;
}

// Export all airports for direct access if needed
export { airports };