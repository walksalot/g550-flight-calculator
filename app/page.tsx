'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { 
  SparklesIcon,
  GlobeAltIcon,
  FireIcon,
  ShieldCheckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { 
  PaperAirplaneIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/solid';
import AirportSelector from '@/components/AirportSelector';
import FlightDetails from '@/components/FlightDetails';
import { getDefaultAirport, getPopularDestinations } from '@/lib/airports';
import { calculateFlightData, Airport, G550_SPECS, FlightData } from '@/lib/calculations';

// Dynamically import FlightMap to avoid SSR issues with Leaflet
const FlightMap = dynamic(() => import('@/components/FlightMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full glass rounded-2xl flex items-center justify-center">
      <div className="text-center">
        <GlobeAltIcon className="h-16 w-16 mx-auto mb-4 text-white/50 animate-pulse" />
        <p className="text-white/70 font-medium">Loading map...</p>
      </div>
    </div>
  ),
});

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  const [departure, setDeparture] = useState<Airport | null>(null);
  const [destination, setDestination] = useState<Airport | null>(null);
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [popularDestinations, setPopularDestinations] = useState<Airport[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  useEffect(() => {
    // Set default departure to Carlsbad
    const carlsbad = getDefaultAirport();
    setDeparture(carlsbad);
    
    // Load popular destinations
    const destinations = getPopularDestinations();
    setPopularDestinations(destinations);

    // Welcome toast
    toast.success('Welcome to G550 Flight Calculator', {
      icon: '✈️',
      style: {
        background: 'rgba(15, 23, 42, 0.9)',
        color: '#fff',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      },
    });
  }, []);

  // Calculate flight data when button is clicked
  const handleCalculateFlight = async () => {
    if (!departure || !destination) return;
    
    setIsCalculating(true);
    setHasCalculated(false);
    
    // Simulate calculation delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const data = calculateFlightData(departure, destination);
    setFlightData(data);
    setIsCalculating(false);
    setHasCalculated(true);
    
    // Show success toast
    toast.success(`Route calculated: ${departure.ident} → ${destination.ident}`, {
      icon: '✈️',
      style: {
        background: 'rgba(15, 23, 42, 0.9)',
        color: '#fff',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      },
    });
    
    // Auto-scroll to results after a brief delay
    setTimeout(() => {
      const resultsSection = document.getElementById('flight-results');
      if (resultsSection) {
        resultsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start'
        });
        
        // Add highlight effect
        resultsSection.classList.add('highlight-pulse');
        setTimeout(() => {
          resultsSection.classList.remove('highlight-pulse');
        }, 2000);
      }
    }, 300);
  };
  
  // Reset calculation when airports change
  useEffect(() => {
    setFlightData(null);
    setHasCalculated(false);
  }, [departure, destination]);

  const handleQuickSelect = (airport: Airport) => {
    setDestination(airport);
  };

  return (
    <>
      <Toaster position="top-right" />
      
      <main className="min-h-screen relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="animated-gradient" />
        
        {/* Noise Overlay */}
        <div className="noise-overlay" />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="relative overflow-hidden z-10"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
              <motion.div 
                variants={stagger}
                initial="initial"
                animate="animate"
                className="text-center"
              >
                <motion.h1 
                  variants={fadeIn}
                  className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-6 text-white drop-shadow-sm"
                >
                  G550 Flight Calculator
                </motion.h1>
                
                <motion.p 
                  variants={fadeIn}
                  className="text-xl sm:text-2xl text-slate-200 md:text-slate-100 max-w-3xl mx-auto mb-8"
                >
                  Experience luxury aviation planning with precision calculations
                  for your Gulfstream G550 across {(4090).toLocaleString()} airports worldwide
                </motion.p>
                
                <motion.div 
                  variants={fadeIn}
                  className="flex flex-wrap items-center justify-center gap-6"
                >
                  <div className="flex items-center gap-2 glass-dark chip border-white/25">
                    <SparklesIcon className="h-5 w-5 text-accent" />
                    <span className="text-white/90 font-medium">Mach 0.80 Cruise</span>
                  </div>
                  <div className="flex items-center gap-2 glass-dark chip border-white/25">
                    <GlobeAltIcon className="h-5 w-5 text-primary" />
                    <span className="text-white/90 font-medium">6,750 nm Range</span>
                  </div>
                  <div className="flex items-center gap-2 glass-dark chip border-white/25">
                    <FireIcon className="h-5 w-5 text-orange-400" />
                    <span className="text-white/90 font-medium">FL510 Ceiling</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            {/* Airport Selection */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="luxury-card rounded-3xl p-8 mb-8"
            >
              <div className="grid lg:grid-cols-2 gap-8">
                <AirportSelector
                  label="Departure Airport"
                  value={departure}
                  onChange={setDeparture}
                  defaultAirport={getDefaultAirport()}
                  placeholder="Search departure airport..."
                />
                <AirportSelector
                  label="Destination Airport"
                  value={destination}
                  onChange={setDestination}
                  placeholder="Search destination airport..."
                />
              </div>

              {/* Calculate Button */}
              {departure && destination && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 flex justify-center"
                >
                  <button 
                    onClick={handleCalculateFlight}
                    disabled={isCalculating}
                    className="btn-primary flex items-center gap-3 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl 
                               hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 
                               disabled:cursor-not-allowed relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    {isCalculating ? (
                      <>
                        <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                        <span className="relative">Calculating Route...</span>
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-6 w-6 relative transition-transform group-hover:translate-x-1" />
                        <span className="relative">Calculate Flight</span>
                        <span className="text-sm font-normal opacity-80 relative">
                          {departure.ident} → {destination.ident}
                        </span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}

              {/* Quick Destinations */}
              {departure && popularDestinations.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 pt-8 border-t border-white/10"
                >
                  <p className="text-sm font-medium text-white/60 mb-4 text-luxury">
                    Popular Destinations
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {popularDestinations.slice(0, 8).map((airport, index) => (
                      <motion.button
                        key={airport.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleQuickSelect(airport)}
                        className="glass px-5 py-2.5 rounded-full transition-all hover:bg-white/20 
                                 hover:shadow-lg hover:shadow-primary/20 group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                                      translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                        <span className="font-semibold text-white relative">
                          {airport.iata_code || airport.ident}
                        </span>
                        <span className="text-white/60 ml-2 group-hover:text-white/80 transition-colors relative">
                          {airport.municipality || airport.name.split(' ')[0]}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Map and Flight Details Grid */}
            <div id="flight-results" className="grid lg:grid-cols-2 gap-8 scroll-mt-20 transition-all duration-500">
              {/* Map */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="h-[440px] md:h-[560px] relative z-0 rounded-xl overflow-hidden"
              >
                <FlightMap
                  departure={departure}
                  destination={destination}
                  className="h-full"
                />
              </motion.div>

              {/* Flight Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <FlightDetails 
                  flightData={flightData} 
                  isCalculating={isCalculating}
                  hasCalculated={hasCalculated}
                />
              </motion.div>
            </div>

            {/* G550 Specifications */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-12"
            >
              <div className="luxury-card rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 glass rounded-lg">
                    <ChartBarIcon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Gulfstream G550 Specifications
                  </h3>
                </div>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Cruise Speed', value: 'Mach 0.80', detail: `${G550_SPECS.cruise_speed_knots} knots`, icon: SparklesIcon },
                    { label: 'Max Range', value: `${G550_SPECS.range_nm.toLocaleString()} nm`, detail: 'NBAA IFR', icon: GlobeAltIcon },
                    { label: 'Fuel Capacity', value: `${G550_SPECS.fuel_capacity_gallons.toLocaleString()} gal`, detail: 'Jet-A', icon: FireIcon },
                    { label: 'Service Ceiling', value: `FL${G550_SPECS.service_ceiling_ft / 100}`, detail: `${G550_SPECS.service_ceiling_ft.toLocaleString()} ft`, icon: ShieldCheckIcon },
                    { label: 'Takeoff Distance', value: `${G550_SPECS.min_runway_takeoff_ft.toLocaleString()} ft`, detail: 'At MTOW', icon: PaperAirplaneIcon },
                    { label: 'Landing Distance', value: `${G550_SPECS.min_runway_landing_ft.toLocaleString()} ft`, detail: 'At MLW', icon: MapPinIcon },
                    { label: 'Passengers', value: `Up to ${G550_SPECS.passenger_capacity}`, detail: 'Plus crew', icon: ShieldCheckIcon },
                    { label: 'Fuel Burn', value: `${G550_SPECS.fuel_consumption_gph} gph`, detail: 'Average cruise', icon: CurrencyDollarIcon },
                  ].map((spec, index) => {
                    const Icon = spec.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + index * 0.05 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="glass-dark p-4 rounded-xl transition-all hover:bg-white/5 hover:shadow-lg 
                                 hover:shadow-primary/10 hover:border-primary/20 group"
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 text-primary mt-1 transition-transform group-hover:scale-110" />
                          <div>
                            <p className="text-xs text-white/60 mb-1 group-hover:text-white/70 transition-colors">
                              {spec.label}
                            </p>
                            <p className="font-bold text-white text-lg group-hover:text-primary transition-colors">
                              {spec.value}
                            </p>
                            <p className="text-xs text-white/40 mt-1 group-hover:text-white/50 transition-colors">
                              {spec.detail}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.footer 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-20 py-8 text-center"
            >
              <div className="glass-dark rounded-2xl p-6 inline-block">
                <p className="text-white/80 font-medium mb-2">
                  Built with AI to demonstrate the power of modern aviation technology
                </p>
                <p className="text-white/60 text-sm">
                  Data sourced from OurAirports • Calculations based on standard conditions
                </p>
              </div>
            </motion.footer>
          </div>
        </div>
      </main>
    </>
  );
}