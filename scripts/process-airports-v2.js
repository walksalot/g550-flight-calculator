const fs = require('fs');
const path = require('path');
const https = require('https');

// URLs for OurAirports data
const AIRPORTS_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';
const RUNWAYS_URL = 'https://davidmegginson.github.io/ourairports-data/runways.csv';

// G550 requirements
const MIN_RUNWAY_LENGTH_FT = 5000; // Lowered to include more airports (G550 needs 5910ft at MTOW)
const PREFERRED_RUNWAY_LENGTH_FT = 6000; // Preferred for safety

// Special airports to always include
const ALWAYS_INCLUDE = ['KCRQ', 'CLD']; // Carlsbad

// Download file helper
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// Parse CSV
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || '';
    });
    return obj;
  });
}

async function processAirports() {
  console.log('Downloading airports data...');
  
  // Create temp directory
  const tempDir = path.join(__dirname, '..', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const airportsFile = path.join(tempDir, 'airports.csv');
  const runwaysFile = path.join(tempDir, 'runways.csv');
  
  // Download files
  await downloadFile(AIRPORTS_URL, airportsFile);
  console.log('Airports data downloaded');
  
  await downloadFile(RUNWAYS_URL, runwaysFile);
  console.log('Runways data downloaded');
  
  // Parse CSV files
  const airportsContent = fs.readFileSync(airportsFile, 'utf-8');
  const runwaysContent = fs.readFileSync(runwaysFile, 'utf-8');
  
  const airports = parseCSV(airportsContent);
  const runways = parseCSV(runwaysContent);
  
  console.log(`Processing ${airports.length} airports and ${runways.length} runways...`);
  
  // Group runways by airport
  const runwaysByAirport = {};
  runways.forEach(runway => {
    const airportRef = runway.airport_ref;
    const lengthFt = parseFloat(runway.length_ft) || 0;
    
    if (!runwaysByAirport[airportRef]) {
      runwaysByAirport[airportRef] = [];
    }
    
    if (lengthFt > 0) {
      runwaysByAirport[airportRef].push({
        length_ft: lengthFt,
        width_ft: parseFloat(runway.width_ft) || 0,
        surface: runway.surface || 'unknown',
        lighted: runway.lighted === '1',
        closed: runway.closed === '1'
      });
    }
  });
  
  // Filter airports suitable for G550
  const suitableAirports = airports
    .filter(airport => {
      // Check if it's a special airport to always include
      const isSpecial = ALWAYS_INCLUDE.includes(airport.ident) || 
                       ALWAYS_INCLUDE.includes(airport.iata_code);
      
      // Must be a medium or large airport (or special)
      if (!isSpecial && !['medium_airport', 'large_airport'].includes(airport.type)) {
        return false;
      }
      
      // Must have valid coordinates
      const lat = parseFloat(airport.latitude_deg);
      const lon = parseFloat(airport.longitude_deg);
      if (isNaN(lat) || isNaN(lon)) {
        return false;
      }
      
      // Check runway requirements
      const airportRunways = runwaysByAirport[airport.id] || [];
      const longestPavedRunway = Math.max(...airportRunways
        .filter(r => !r.closed && 
                    r.surface !== 'WATER' && 
                    r.surface !== 'GRASS' && 
                    r.surface !== 'TURF' &&
                    r.surface !== 'GRAVEL')
        .map(r => r.length_ft), 0);
      
      // Special airports have lower threshold
      const minLength = isSpecial ? 4500 : MIN_RUNWAY_LENGTH_FT;
      
      return longestPavedRunway >= minLength;
    })
    .map(airport => {
      const airportRunways = runwaysByAirport[airport.id] || [];
      const pavedRunways = airportRunways.filter(r => 
        !r.closed && 
        r.surface !== 'WATER' && 
        r.surface !== 'GRASS' && 
        r.surface !== 'TURF' &&
        r.surface !== 'GRAVEL'
      );
      const longestRunway = Math.max(...pavedRunways.map(r => r.length_ft), 0);
      
      // Determine safety level
      let safetyLevel = 'marginal';
      if (longestRunway >= 7000) {
        safetyLevel = 'excellent';
      } else if (longestRunway >= PREFERRED_RUNWAY_LENGTH_FT) {
        safetyLevel = 'good';
      } else if (longestRunway >= 5500) {
        safetyLevel = 'adequate';
      }
      
      const isSpecial = ALWAYS_INCLUDE.includes(airport.ident) || 
                       ALWAYS_INCLUDE.includes(airport.iata_code);
      
      return {
        id: airport.id,
        ident: airport.ident,
        type: airport.type,
        name: airport.name,
        latitude: parseFloat(airport.latitude_deg),
        longitude: parseFloat(airport.longitude_deg),
        elevation_ft: parseFloat(airport.elevation_ft) || 0,
        continent: airport.continent,
        iso_country: airport.iso_country,
        iso_region: airport.iso_region,
        municipality: airport.municipality,
        iata_code: airport.iata_code,
        local_code: airport.local_code,
        longest_runway_ft: longestRunway,
        runways: pavedRunways.length,
        safety_level: safetyLevel,
        is_default: isSpecial,
        keywords: airport.keywords
      };
    })
    .sort((a, b) => {
      // Default airports first
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      // Then by runway length
      return b.longest_runway_ft - a.longest_runway_ft;
    });
  
  console.log(`Found ${suitableAirports.length} airports suitable for G550`);
  
  // Save processed data
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const outputFile = path.join(dataDir, 'airports.json');
  fs.writeFileSync(outputFile, JSON.stringify(suitableAirports, null, 2));
  
  console.log(`Data saved to ${outputFile}`);
  
  // Clean up temp files
  fs.unlinkSync(airportsFile);
  fs.unlinkSync(runwaysFile);
  fs.rmdirSync(tempDir);
  
  // Print some statistics
  const bySafety = {};
  suitableAirports.forEach(a => {
    bySafety[a.safety_level] = (bySafety[a.safety_level] || 0) + 1;
  });
  
  console.log('\nAirports by safety level:');
  Object.entries(bySafety).forEach(([level, count]) => {
    console.log(`  ${level}: ${count} airports`);
  });
  
  // Find Carlsbad
  const carlsbad = suitableAirports.find(a => 
    a.ident === 'KCRQ' || a.iata_code === 'CLD'
  );
  
  if (carlsbad) {
    console.log('\n✓ Carlsbad (KCRQ) found in dataset');
    console.log(`  Name: ${carlsbad.name}`);
    console.log(`  Longest runway: ${carlsbad.longest_runway_ft} ft`);
    console.log(`  Safety level: ${carlsbad.safety_level}`);
    console.log(`  Position in list: ${suitableAirports.indexOf(carlsbad) + 1}`);
  } else {
    console.log('\n⚠️  Carlsbad (KCRQ) not found');
  }
  
  // Show some nearby airports to Carlsbad
  if (carlsbad) {
    const nearby = suitableAirports
      .filter(a => a.id !== carlsbad.id)
      .map(a => {
        const dlat = a.latitude - carlsbad.latitude;
        const dlon = a.longitude - carlsbad.longitude;
        const dist = Math.sqrt(dlat * dlat + dlon * dlon) * 69; // rough miles
        return { ...a, distance: dist };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
    
    console.log('\nNearest G550-suitable airports to Carlsbad:');
    nearby.forEach(a => {
      console.log(`  ${a.ident} - ${a.name} (${Math.round(a.distance)} mi, ${a.longest_runway_ft} ft runway)`);
    });
  }
}

processAirports().catch(console.error);