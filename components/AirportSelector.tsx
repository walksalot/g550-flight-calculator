'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  PaperAirplaneIcon,
  CheckCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/solid';
import { searchAirports } from '@/lib/airports';
import { Airport } from '@/lib/calculations';
import { cn } from '@/lib/utils';

interface AirportSelectorProps {
  label: string;
  value: Airport | null;
  onChange: (airport: Airport) => void;
  defaultAirport?: Airport;
  placeholder?: string;
  className?: string;
}

export default function AirportSelector({
  label,
  value,
  onChange,
  defaultAirport,
  placeholder = "Try: KCRQ / CLD / 'McClellan-Palomar'",
  className,
}: AirportSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Airport[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const results = searchAirports(searchQuery, 8);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSelect = (airport: Airport) => {
    onChange(airport);
    setSearchQuery('');
    setIsOpen(false);
    setSearchResults([]);
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (!value && defaultAirport) {
      setSearchResults([defaultAirport]);
    }
  };

  const getSafetyIcon = (level: string) => {
    switch (level) {
      case 'excellent':
        return <CheckCircleIcon className="h-5 w-5 text-emerald-400" />;
      case 'good':
        return <ShieldCheckIcon className="h-5 w-5 text-blue-400" />;
      case 'adequate':
        return <ShieldCheckIcon className="h-5 w-5 text-yellow-400" />;
      case 'marginal':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-400" />;
      default:
        return null;
    }
  };

  const getSafetyBadge = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-400/40 font-semibold';
      case 'good':
        return 'bg-blue-500/20 text-blue-400 border-blue-400/40 font-semibold';
      case 'adequate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/40 font-semibold';
      case 'marginal':
        return 'bg-orange-500/20 text-orange-400 border-orange-400/40 font-semibold';
      default:
        return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  return (
    <motion.div 
      ref={containerRef} 
      className={cn('relative', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <label className="block text-sm font-semibold text-white mb-2">
        {label === 'Departure Airport' ? 'Departure' : 'Destination'}
        <span className="text-sm font-normal text-white/70 ml-1">
          (Airport / IATA / ICAO)
        </span>
      </label>
      
      <div className="relative">
        <motion.div 
          className="relative"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/80 h-5 w-5" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleFocus}
            placeholder={value ? `${value.name} (${value.ident})` : "Try: KCRQ / CLD / 'McClellan-Palomar'"}
            aria-label={label}
            aria-autocomplete="list"
            role="combobox"
            className="w-full pl-12 pr-12 py-4 glass-dark rounded-xl text-white placeholder-white/70 
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus:bg-white/10
                     transition-all duration-300 font-medium border border-white/20"
          />
          {value && (
            <motion.div 
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
            >
              <PaperAirplaneIcon className="h-5 w-5 text-accent" />
            </motion.div>
          )}
        </motion.div>

        <AnimatePresence>
          {value && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 overflow-hidden"
            >
              <div className="glass-dark rounded-xl p-4 border border-white/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-white text-lg">{value.name}</div>
                    <div className="text-sm text-white/80 mt-1">
                      <span className="inline-flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4" />
                        {value.municipality || value.iso_region}, {value.iso_country}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="glass-dark px-3 py-1 rounded-full text-xs font-mono text-white border border-white/20">
                        {value.ident}
                      </span>
                      {value.iata_code && (
                        <span className="glass-dark px-3 py-1 rounded-full text-xs font-mono text-yellow-400 border border-yellow-400/20">
                          {value.iata_code}
                        </span>
                      )}
                      <span className="text-xs text-white/70 font-medium">
                        {value.longest_runway_ft.toLocaleString()} ft runway
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={cn(
                        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md',
                        getSafetyBadge(value.safety_level)
                      )}
                    >
                      {getSafetyIcon(value.safety_level)}
                      <span className="capitalize">{value.safety_level}</span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOpen && (searchResults.length > 0 || isSearching) && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 z-50 mt-2 glass-dark border border-white/20 rounded-xl shadow-xl max-h-96 overflow-y-auto"
            >
              {isSearching ? (
                <div className="p-6 text-center">
                  <motion.div 
                    className="inline-flex items-center gap-3 text-white/70"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium">Searching airports...</span>
                  </motion.div>
                </div>
              ) : (
                <div className="py-1">
                  {searchResults.map((airport, index) => (
                    <motion.button
                      key={airport.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      onClick={() => handleSelect(airport)}
                      className="w-full px-5 py-4 transition-all text-left border-b border-white/10 last:border-0
                               hover:bg-white/10 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-white">
                            {airport.name}
                          </div>
                          <div className="text-sm text-white/70 mt-1">
                            <span className="inline-flex items-center gap-1">
                              <MapPinIcon className="h-4 w-4" />
                              {airport.municipality || airport.iso_region}, {airport.iso_country}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-xs font-mono glass-dark px-2 py-0.5 rounded-full text-white border border-white/20">
                              {airport.ident}
                            </span>
                            {airport.iata_code && (
                              <span className="text-xs font-mono glass-dark px-2 py-0.5 rounded-full text-yellow-400 border border-yellow-400/20">
                                {airport.iata_code}
                              </span>
                            )}
                            <span className="text-xs text-white/70 font-medium">
                              {airport.longest_runway_ft.toLocaleString()} ft
                            </span>
                          </div>
                        </div>
                        <div className="ml-3 mt-1">
                          {getSafetyIcon(airport.safety_level)}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}