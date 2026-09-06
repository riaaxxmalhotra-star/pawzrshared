import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import logger from './logger';
import { notificationsApi } from './api';

// Foreground presentation: banner + list + badge, no sound by default.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: 'chat' | 'booking' | 'match' | 'reminder' | 'system';
  chatId?: string;
  bookingId?: string;
  matchId?: string;
  userId?: string;
  eventId?: string;
  cafeId?: string;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Pawzr updates',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  }).catch(() => {});
}

/**
 * Registers for push notifications and uploads the Expo push token to the
 * backend (best-effort). Returns the token, or null when push is unavailable
 * (simulator, web, denied permission, missing project ID) — callers must
 * handle null as "push unavailable", never as an error.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      logger.log('Push notifications require a physical device');
      return null;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    const { status } =
      existing === 'granted'
        ? { status: existing }
        : await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      logger.log('Push notification permission denied');
      return null;
    }

    await ensureAndroidChannel();

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      logger.log('Push registration skipped: no EAS project ID');
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    // Best-effort upload — a failed upload must not break the session.
    try {
      await notificationsApi.registerToken(token);
    } catch {
      logger.log('Push token upload failed (will retry next launch)');
    }

    return token;
  } catch (error) {
    logger.log('Push registration failed');
    return null;
  }
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  secondsFromNow = 1
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data ?? {} },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secondsFromNow },
    });
  } catch (error) {
    logger.log('Local notification scheduling failed');
  }
}

export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // best-effort
  }
}

export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch {
    return 0;
  }
}

export async function setBadgeCount(count: number) {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch {
    // badges unsupported on some launchers — best-effort
  }
}

export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/** Cold-start tap: the notification that launched the app, if any. */
export async function getLaunchNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  try {
    return await Notifications.getLastNotificationResponseAsync();
  } catch {
    return null;
  }
}
