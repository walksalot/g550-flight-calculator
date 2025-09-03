const fs = require('fs');
const path = require('path');
const https = require('https');

// URLs for OurAirports data
const AIRPORTS_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';
const RUNWAYS_URL = 'https://davidmegginson.github.io/ourairports-data/runways.csv';

// G550 requirements
const MIN_RUNWAY_LENGTH_FT = 6000; // Adding safety margin above 5910ft requirement

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
      // Must be a medium or large airport
      if (!['medium_airport', 'large_airport'].includes(airport.type)) {
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
      const hasLongRunway = airportRunways.some(r => 
        r.length_ft >= MIN_RUNWAY_LENGTH_FT && 
        !r.closed &&
        r.surface !== 'WATER' &&
        r.surface !== 'GRASS' &&
        r.surface !== 'TURF'
      );
      
      return hasLongRunway;
    })
    .map(airport => {
      const airportRunways = runwaysByAirport[airport.id] || [];
      const longestRunway = Math.max(...airportRunways.map(r => r.length_ft));
      
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
        runways: airportRunways.filter(r => !r.closed).length,
        keywords: airport.keywords
      };
    })
    .sort((a, b) => b.longest_runway_ft - a.longest_runway_ft);
  
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
  const byCountry = {};
  suitableAirports.forEach(a => {
    byCountry[a.iso_country] = (byCountry[a.iso_country] || 0) + 1;
  });
  
  const topCountries = Object.entries(byCountry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  console.log('\nTop 10 countries by number of G550-suitable airports:');
  topCountries.forEach(([country, count]) => {
    console.log(`  ${country}: ${count} airports`);
  });
  
  // Find Carlsbad
  const carlsbad = suitableAirports.find(a => 
    a.ident === 'KCRQ' || a.iata_code === 'CLD'
  );
  
  if (carlsbad) {
    console.log('\n✓ Carlsbad (KCRQ) found in dataset');
    console.log(`  Longest runway: ${carlsbad.longest_runway_ft} ft`);
  } else {
    console.log('\n⚠️  Carlsbad (KCRQ) not in filtered dataset - runway too short for safety margin');
  }
}

processAirports().catch(console.error);