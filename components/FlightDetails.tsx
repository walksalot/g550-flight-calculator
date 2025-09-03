'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClockIcon,
  FireIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  MapPinIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { 
  MapIcon,
  BoltIcon
} from '@heroicons/react/24/solid';
import { FlightData, G550_SPECS, formatDistance, formatBearing } from '@/lib/calculations';
import { cn } from '@/lib/utils';

interface FlightDetailsProps {
  flightData: FlightData | null;
  isCalculating?: boolean;
  hasCalculated?: boolean;
  className?: string;
}

export default function FlightDetails({ flightData, isCalculating, hasCalculated, className }: FlightDetailsProps) {
  // Show skeleton loader while calculating
  if (isCalculating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('luxury-card rounded-3xl p-8', className)}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white/10 animate-pulse" />
            <div className="h-8 w-48 rounded-lg bg-white/10 animate-pulse" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-dark rounded-xl p-4 animate-pulse">
                <div className="h-4 w-20 bg-white/10 rounded mb-2" />
                <div className="h-6 w-32 bg-white/10 rounded" />
              </div>
            ))}
          </div>
          
          <div className="space-y-3">
            <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary/50 rounded-full animate-loading-bar" />
            </div>
          </div>
          
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-white/70 font-medium animate-pulse">Calculating optimal route...</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  if (!flightData) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn('h-full glass rounded-2xl flex items-center justify-center', className)}
      >
        <div className="text-center p-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <MapIcon className="h-16 w-16 mx-auto mb-6 text-white/30" />
          </motion.div>
          <p className="text-xl font-semibold text-white mb-2">Ready for Flight Planning</p>
          <p className="text-sm text-white/60">
            {hasCalculated ? 'Select new airports to calculate another route' : 'Select your departure and destination airports'}
          </p>
        </div>
      </motion.div>
    );
  }

  const getSafetyIcon = (safety: string) => {
    switch (safety) {
      case 'safe':
        return <CheckCircleIcon className="h-5 w-5 text-emerald-400" />;
      case 'marginal':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getSafetyText = (safety: string, isDestination: boolean) => {
    const action = isDestination ? 'landing' : 'takeoff';
    switch (safety) {
      case 'safe':
        return `Safe for ${action}`;
      case 'marginal':
        return `Marginal for ${action}`;
      case 'critical':
        return `Critical for ${action}`;
      default:
        return '';
    }
  };

  const rangePercentage = (flightData.distance_nm / G550_SPECS.range_nm) * 100;
  const fuelPercentage = (flightData.fuel_gallons / G550_SPECS.fuel_capacity_gallons) * 100;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut" as const
      }
    })
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key="flight-details"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ 
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1]
        }}
        className={cn('luxury-card rounded-3xl overflow-hidden', className)}
      >
      <div className="p-6 glass-dark border-b border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 glass rounded-lg">
            <SparklesIcon className="h-6 w-6 text-accent" />
          </div>
          <h3 className="text-2xl font-bold text-white">Flight Analysis</h3>
        </div>
        <div className="flex items-center gap-3 text-white/80">
          <MapPinIcon className="h-5 w-5 text-primary" />
          <span className="font-semibold">{flightData.departure.ident}</span>
          <BoltIcon className="h-4 w-4 text-accent" />
          <span className="font-semibold">{flightData.destination.ident}</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Distance & Time Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ scale: 1.02 }}
            className="glass-dark p-5 rounded-xl transition-all hover:bg-white/5"
          >
            <div className="flex items-center gap-3 mb-3">
              <MapIcon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-white/70">Distance</span>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-white">{formatDistance(flightData.distance_nm, 'nm')}</p>
              <p className="text-sm text-white/50">
                {formatDistance(flightData.distance_mi, 'mi')} • {formatDistance(flightData.distance_km, 'km')}
              </p>
            </div>
          </motion.div>

          <motion.div 
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ scale: 1.02 }}
            className="glass-dark p-5 rounded-xl transition-all hover:bg-white/5"
          >
            <div className="flex items-center gap-3 mb-3">
              <ClockIcon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-white/70">Flight Time</span>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-white">{flightData.flight_time_formatted}</p>
              <p className="text-sm text-white/50">
                At Mach 0.80 cruise
              </p>
            </div>
          </motion.div>
        </div>

        {/* Fuel & Cost */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ scale: 1.02 }}
            className="glass-dark p-5 rounded-xl transition-all hover:bg-white/5"
          >
            <div className="flex items-center gap-3 mb-3">
              <FireIcon className="h-5 w-5 text-orange-400" />
              <span className="text-sm font-medium text-white/70">Fuel Required</span>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-white">{flightData.fuel_gallons.toLocaleString()} gal</p>
              <div className="mt-3">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(fuelPercentage, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn(
                      "h-full",
                      fuelPercentage <= 75 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : 
                      fuelPercentage <= 90 ? "bg-gradient-to-r from-yellow-400 to-yellow-500" : 
                      "bg-gradient-to-r from-red-400 to-red-500"
                    )}
                  />
                </div>
                <p className="text-xs text-white/40 mt-2">
                  {fuelPercentage.toFixed(1)}% of capacity
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ scale: 1.02 }}
            className="glass-dark p-5 rounded-xl transition-all hover:bg-white/5"
          >
            <div className="flex items-center gap-3 mb-3">
              <CurrencyDollarIcon className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium text-white/70">Fuel Cost</span>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold gold-gradient-text">${flightData.fuel_cost_usd.toLocaleString()}</p>
              <p className="text-sm text-white/50">
                At $6.50/gal Jet-A
              </p>
            </div>
          </motion.div>
        </div>

        {/* Bearing & Range */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            custom={4}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ scale: 1.02 }}
            className="glass-dark p-5 rounded-xl transition-all hover:bg-white/5"
          >
            <div className="flex items-center gap-3 mb-3">
              <ArrowTrendingUpIcon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-white/70">Heading</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatBearing(flightData.bearing)}</p>
          </motion.div>

          <motion.div 
            custom={5}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ scale: 1.02 }}
            className="glass-dark p-5 rounded-xl transition-all hover:bg-white/5"
          >
            <div className="flex items-center gap-3 mb-3">
              <ChartBarIcon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-white/70">Range Status</span>
            </div>
            <div className="space-y-2">
              <p className={cn(
                "text-xl font-bold",
                flightData.is_within_range ? "text-emerald-400" : "text-red-400"
              )}>
                {flightData.is_within_range ? "Within Range" : "Exceeds Range"}
              </p>
              <div className="mt-3">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(rangePercentage, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn(
                      "h-full",
                      rangePercentage <= 75 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : 
                      rangePercentage <= 100 ? "bg-gradient-to-r from-yellow-400 to-yellow-500" : 
                      "bg-gradient-to-r from-red-400 to-red-500"
                    )}
                  />
                </div>
                <p className="text-xs text-white/40 mt-2">
                  {rangePercentage.toFixed(1)}% of max range
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Runway Safety */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="border-t border-white/10 pt-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheckIcon className="h-5 w-5 text-accent" />
            <h4 className="text-lg font-semibold text-white">Runway Safety Assessment</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 p-4 glass rounded-xl"
            >
              {getSafetyIcon(flightData.runway_safety.departure)}
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Departure</p>
                <p className="text-xs text-white/60 mt-1">
                  {getSafetyText(flightData.runway_safety.departure, false)}
                </p>
              </div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 p-4 glass rounded-xl"
            >
              {getSafetyIcon(flightData.runway_safety.destination)}
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Destination</p>
                <p className="text-xs text-white/60 mt-1">
                  {getSafetyText(flightData.runway_safety.destination, true)}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Warnings */}
        <AnimatePresence>
          {(!flightData.is_within_range || 
            flightData.runway_safety.departure === 'critical' || 
            flightData.runway_safety.destination === 'critical') && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-white/10 pt-6"
            >
              <div className="space-y-3">
                {!flightData.is_within_range && (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex items-start gap-3 p-4 bg-red-500/10 backdrop-blur-md rounded-xl border border-red-500/20"
                  >
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-400">
                        Flight exceeds G550 range
                      </p>
                      <p className="text-xs text-red-400/70 mt-1">
                        A fuel stop will be required for this journey
                      </p>
                    </div>
                  </motion.div>
                )}
                {flightData.runway_safety.departure === 'critical' && (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-start gap-3 p-4 bg-orange-500/10 backdrop-blur-md rounded-xl border border-orange-500/20"
                  >
                    <ExclamationTriangleIcon className="h-5 w-5 text-orange-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-orange-400">
                        Departure runway below minimum
                      </p>
                      <p className="text-xs text-orange-400/70 mt-1">
                        Reduce takeoff weight or use alternate airport
                      </p>
                    </div>
                  </motion.div>
                )}
                {flightData.runway_safety.destination === 'critical' && (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-start gap-3 p-4 bg-orange-500/10 backdrop-blur-md rounded-xl border border-orange-500/20"
                  >
                    <ExclamationTriangleIcon className="h-5 w-5 text-orange-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-orange-400">
                        Destination runway below minimum
                      </p>
                      <p className="text-xs text-orange-400/70 mt-1">
                        Consider alternate destination with longer runway
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </motion.div>
    </AnimatePresence>
  );
}