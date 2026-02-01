import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { locationApi } from '../lib/api';
import logger from '../lib/logger';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface UseLocationResult {
  location: LocationCoords | null;
  error: string | null;
  loading: boolean;
  permissionGranted: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);

      if (!granted) {
        setError('Location permission denied');
        setLoading(false);
      }

      return granted;
    } catch (err) {
      setError('Failed to request location permission');
      setLoading(false);
      return false;
    }
  };

  const startWatching = async () => {
    try {
      // Get initial location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: LocationCoords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setLocation(coords);
      setLoading(false);

      // Update backend with location
      try {
        await locationApi.updateLocation(coords.latitude, coords.longitude);
      } catch (err) {
        logger.log('Failed to update location on server');
      }

      // Watch for location changes
      watchSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // Update every 30 seconds
          distanceInterval: 100, // Or when moved 100 meters
        },
        async (newLocation) => {
          const newCoords: LocationCoords = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };
          setLocation(newCoords);

          // Update backend
          try {
            await locationApi.updateLocation(newCoords.latitude, newCoords.longitude);
          } catch (err) {
            logger.log('Failed to update location on server');
          }
        }
      );
    } catch (err) {
      setError('Failed to get location');
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const granted = await requestPermission();
      if (granted && mounted) {
        await startWatching();
      }
    };

    init();

    return () => {
      mounted = false;
      if (watchSubscription.current) {
        watchSubscription.current.remove();
      }
    };
  }, []);

  return {
    location,
    error,
    loading,
    permissionGranted,
    requestPermission,
  };
}
