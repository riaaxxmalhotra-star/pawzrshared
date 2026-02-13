// Notifications module - stubbed out for builds without push notification capability
// To enable push notifications, install expo-notifications and restore full implementation

import logger from './logger';

// No-op notification handler
export async function registerForPushNotifications(): Promise<string | null> {
  logger.log('Push notifications are disabled in this build');
  return null;
}

// Schedule a local notification (no-op)
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  trigger?: any
) {
  logger.log('Local notifications are disabled in this build');
}

// Cancel all scheduled notifications (no-op)
export async function cancelAllNotifications() {
  // No-op
}

// Get badge count (returns 0)
export async function getBadgeCount(): Promise<number> {
  return 0;
}

// Set badge count (no-op)
export async function setBadgeCount(count: number) {
  // No-op
}

// Add notification received listener (no-op, returns cleanup function)
export function addNotificationReceivedListener(
  callback: (notification: any) => void
) {
  return { remove: () => {} };
}

// Add notification response listener (no-op, returns cleanup function)
export function addNotificationResponseListener(
  callback: (response: any) => void
) {
  return { remove: () => {} };
}

// Types for notification data
export interface NotificationData {
  type: 'chat' | 'booking' | 'match' | 'reminder' | 'system';
  chatId?: string;
  bookingId?: string;
  matchId?: string;
  userId?: string;
}
