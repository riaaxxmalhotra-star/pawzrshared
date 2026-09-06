import { createNavigationContainerRef } from '@react-navigation/native';

// Global navigation handle for use outside React components
// (notification taps, env gates). All helpers are no-ops until the
// NavigationContainer mounts.
export const navigationRef = createNavigationContainerRef<any>();

export function navigate(name: string, params?: Record<string, any>): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

/** Route an incoming push/local notification to the right screen. */
export function navigateFromNotification(data: Record<string, any> | undefined | null): void {
  if (!data || typeof data !== 'object') return;
  switch (data.type) {
    case 'chat':
      navigate('Main', { screen: 'Chat' });
      break;
    case 'booking':
      navigate('Main', { screen: 'Bookings' });
      break;
    case 'match':
      navigate('Main', { screen: 'Chat' });
      break;
    case 'reminder':
      if (data.eventId) {
        navigate('Main', {
          screen: 'Home',
          params: { screen: 'EventDetail', params: { eventId: String(data.eventId) } },
        });
      } else {
        navigate('Main', { screen: 'Events' });
      }
      break;
    default:
      break;
  }
}
