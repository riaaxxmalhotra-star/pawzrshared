import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';

type NotificationType = 'booking' | 'message' | 'order' | 'review' | 'system' | 'promotion';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionData?: any;
}

// Mock notifications data
const getMockNotifications = (userRole: string): Notification[] => {
  const baseNotifications: Notification[] = [
    {
      id: '1',
      type: 'system',
      title: 'Welcome to Pawzr!',
      message: 'Your account is now set up. Start exploring pet services near you.',
      time: '2 hours ago',
      read: true,
    },
  ];

  if (userRole === 'SUPPLIER') {
    return [
      {
        id: '2',
        type: 'order',
        title: 'New Order Received',
        message: 'Rahul Kumar placed an order for Rs. 2,850. Tap to view details.',
        time: '5 min ago',
        read: false,
        actionData: { screen: 'Orders' },
      },
      {
        id: '3',
        type: 'order',
        title: 'Order Delivered',
        message: 'Order #ORD-2844 has been delivered successfully.',
        time: '3 hours ago',
        read: false,
      },
      {
        id: '4',
        type: 'review',
        title: 'New Review',
        message: 'Anita Desai left a 5-star review for Premium Dog Food.',
        time: 'Yesterday',
        read: true,
      },
      {
        id: '5',
        type: 'system',
        title: 'Low Stock Alert',
        message: 'Cat Scratching Post has only 8 items left. Consider restocking.',
        time: 'Yesterday',
        read: true,
        actionData: { screen: 'Inventory' },
      },
      ...baseNotifications,
    ];
  }

  if (userRole === 'VET' || userRole === 'GROOMER') {
    return [
      {
        id: '2',
        type: 'booking',
        title: 'New Booking',
        message: 'Rahul Kumar booked a consultation for tomorrow at 10:00 AM.',
        time: '15 min ago',
        read: false,
        actionData: { screen: 'Calendar' },
      },
      {
        id: '3',
        type: 'message',
        title: 'New Message',
        message: 'Priya Sharma sent you a message about her pet.',
        time: '1 hour ago',
        read: false,
        actionData: { screen: 'Messages' },
      },
      {
        id: '4',
        type: 'review',
        title: 'New Review',
        message: 'Amit Patel left a 5-star review for your service.',
        time: 'Yesterday',
        read: true,
      },
      ...baseNotifications,
    ];
  }

  if (userRole === 'LOVER') {
    return [
      {
        id: '2',
        type: 'booking',
        title: 'New Pet Match!',
        message: 'You have 3 new potential pet matches nearby.',
        time: '30 min ago',
        read: false,
        actionData: { screen: 'PetMatch' },
      },
      {
        id: '3',
        type: 'booking',
        title: 'Job Request',
        message: 'Neha Gupta requested dog walking service for Bruno.',
        time: '2 hours ago',
        read: false,
      },
      {
        id: '4',
        type: 'message',
        title: 'New Message',
        message: 'You have a new message from Rahul Kumar.',
        time: 'Yesterday',
        read: true,
        actionData: { screen: 'Messages' },
      },
      ...baseNotifications,
    ];
  }

  // Pet Owner notifications
  return [
    {
      id: '2',
      type: 'booking',
      title: 'Appointment Reminder',
      message: 'Your vet appointment with Dr. Sarah is tomorrow at 10:00 AM.',
      time: '1 hour ago',
      read: false,
      actionData: { screen: 'Calendar' },
    },
    {
      id: '3',
      type: 'message',
      title: 'New Message',
      message: 'Dr. Sarah sent you a message about Max\'s checkup.',
      time: '3 hours ago',
      read: false,
      actionData: { screen: 'Messages' },
    },
    {
      id: '4',
      type: 'promotion',
      title: '20% Off Grooming!',
      message: 'PetSpa Studio is offering 20% off on full grooming this weekend.',
      time: 'Yesterday',
      read: true,
    },
    {
      id: '5',
      type: 'system',
      title: 'Vaccination Due',
      message: 'Max\'s rabies vaccination is due next week. Book an appointment.',
      time: '2 days ago',
      read: true,
    },
    ...baseNotifications,
  ];
};

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const userRole = (user?.role || 'OWNER').toUpperCase();

  const [notifications, setNotifications] = useState<Notification[]>(getMockNotifications(userRole));
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => !n.read);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'booking': return 'calendar';
      case 'message': return 'chatbubble';
      case 'order': return 'receipt';
      case 'review': return 'star';
      case 'system': return 'information-circle';
      case 'promotion': return 'pricetag';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'booking': return '#3B82F6';
      case 'message': return '#8B5CF6';
      case 'order': return '#F59E0B';
      case 'review': return '#10B981';
      case 'system': return colors.primary;
      case 'promotion': return '#F97316';
      default: return colors.gray[500];
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    setNotifications(notifications.map(n =>
      n.id === notification.id ? { ...n, read: true } : n
    ));

    // Navigate if action data exists
    if (notification.actionData?.screen) {
      navigation.navigate(notification.actionData.screen);
    }
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setNotifications(getMockNotifications(userRole));
      setRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markReadButton}>
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.gray[300]} />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'unread'
                ? "You're all caught up!"
                : "You'll see notifications about bookings, messages, and updates here."}
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.notificationCardUnread,
              ]}
              onPress={() => handleNotificationPress(notification)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.notificationIcon,
                { backgroundColor: `${getNotificationColor(notification.type)}15` }
              ]}>
                <Ionicons
                  name={getNotificationIcon(notification.type) as any}
                  size={22}
                  color={getNotificationColor(notification.type)}
                />
              </View>
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={[
                    styles.notificationTitle,
                    !notification.read && styles.notificationTitleUnread,
                  ]}>
                    {notification.title}
                  </Text>
                  {!notification.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notificationMessage} numberOfLines={2}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.gray[300]} />
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    marginLeft: 8,
  },
  markReadButton: {
    padding: 8,
  },
  markReadText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[600],
  },
  filterTextActive: {
    color: colors.white,
  },
  scrollContent: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationCardUnread: {
    backgroundColor: `${colors.primary}05`,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray[900],
  },
  notificationTitleUnread: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
