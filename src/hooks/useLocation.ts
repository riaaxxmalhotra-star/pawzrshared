import { useState, useEffect, useRef, useCallback } from 'react';
import { Linking } from 'react-native';
import * as Location from 'expo-location';
import { locationApi } from '../lib/api';
import logger from '../lib/logger';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export type LocationPermissionState =
  | 'undetermined'   // never asked — safe to prompt once
  | 'granted'
  | 'denied'         // denied but can ask again (show in-app rationale + button)
  | 'blocked'        // permanently denied — must go through system Settings
  | 'servicesOff';   // OS location services disabled

export interface UseLocationResult {
  location: LocationCoords | null;
  error: string | null;
  loading: boolean;
  permission: LocationPermissionState;
  permissionGranted: boolean;
  requestPermission: () => Promise<boolean>;
  openSettings: () => void;
}

// Upload at most once per 5 minutes unless the user moved 100m+.
const UPLOAD_MIN_INTERVAL_MS = 5 * 60 * 1000;
const UPLOAD_MIN_DISTANCE_M = 100;

function distanceMeters(a: LocationCoords, b: LocationCoords): number {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLng = (b.longitude - a.longitude) * rad;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(s));
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<LocationPermissionState>('undetermined');
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);
  const lastUpload = useRef<{ coords: LocationCoords; at: number } | null>(null);
  const mounted = useRef(true);

  const maybeUpload = useCallback(async (coords: LocationCoords, force = false) => {
    const prev = lastUpload.current;
    if (!force && prev) {
      const moved = distanceMeters(prev.coords, coords);
      const elapsed = Date.now() - prev.at;
      if (moved < UPLOAD_MIN_DISTANCE_M && elapsed < UPLOAD_MIN_INTERVAL_MS) return;
    }
    lastUpload.current = { coords, at: Date.now() };
    try {
      await locationApi.updateLocation(coords.latitude, coords.longitude);
    } catch (err) {
      // Server sync is best-effort; the local fix is what the UI needs.
      logger.log('Failed to update location on server');
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const current = await Location.getForegroundPermissionsAsync();
      if (current.status === 'granted') {
        setPermission('granted');
        setError(null);
        return true;
      }
      if (!current.canAskAgain) {
        setPermission('blocked');
        setError('Location access is blocked. Enable it in Settings to see nearby pets.');
        setLoading(false);
        return false;
      }
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermission('granted');
        setError(null);
        return true;
      }
      setPermission(canAskAgain ? 'denied' : 'blocked');
      setError(
        canAskAgain
          ? 'Location permission denied. Allow access to see nearby pets.'
          : 'Location access is blocked. Enable it in Settings to see nearby pets.'
      );
      setLoading(false);
      return false;
    } catch (err) {
      setError('Failed to request location permission');
      setLoading(false);
      return false;
    }
  }, []);

  const openSettings = useCallback(() => {
    Linking.openSettings().catch(() => {
      logger.log('Could not open system settings');
    });
  }, []);

  const startWatching = useCallback(async () => {
    try {
      // OS-level location services (notably Android) can be off entirely.
      const servicesOn = await Location.hasServicesEnabledAsync();
      if (!servicesOn) {
        if (mounted.current) {
          setPermission('servicesOff');
          setError('Location services are turned off. Enable them to see nearby pets.');
          setLoading(false);
        }
        return;
      }

      // Fast path: reuse the last known fix, then refine with a fresh one.
      try {
        const last = await Location.getLastKnownPositionAsync();
        if (last && mounted.current) {
          const coords = { latitude: last.coords.latitude, longitude: last.coords.longitude };
          setLocation(coords);
          setLoading(false);
          void maybeUpload(coords);
        }
      } catch {
        // No cached fix — fall through to a fresh request.
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!mounted.current) return;

      const coords: LocationCoords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      setLocation(coords);
      setLoading(false);
      await maybeUpload(coords, true);

      watchSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000,
          distanceInterval: UPLOAD_MIN_DISTANCE_M,
        },
        (newLocation) => {
          if (!mounted.current) return;
          const newCoords: LocationCoords = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };
          setLocation(newCoords);
          void maybeUpload(newCoords);
        }
      );
    } catch (err) {
      if (mounted.current) {
        setError('Failed to get location');
        setLoading(false);
      }
    }
  }, [maybeUpload]);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;

    const init = async () => {
      // Pre-check before prompting: never auto-prompt a blocked user.
      const current = await Location.getForegroundPermissionsAsync().catch(() => null);
      if (cancelled || !mounted.current) return;

      if (current?.status === 'granted') {
        setPermission('granted');
        await startWatching();
        return;
      }
      if (current && !current.canAskAgain && current.status !== 'undetermined') {
        setPermission('blocked');
        setError('Location access is blocked. Enable it in Settings to see nearby pets.');
        setLoading(false);
        return;
      }
      const granted = await requestPermission();
      if (granted && !cancelled && mounted.current) {
        await startWatching();
      }
    };

    init();

    return () => {
      cancelled = true;
      mounted.current = false;
      watchSubscription.current?.remove();
      watchSubscription.current = null;
    };
  }, [requestPermission, startWatching]);

  return {
    location,
    error,
    loading,
    permission,
    permissionGranted: permission === 'granted',
    requestPermission,
    openSettings,
  };
}
