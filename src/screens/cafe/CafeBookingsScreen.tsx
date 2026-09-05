import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, roleColors } from '../../theme/colors';

// Use centralized role color
const CAFE_COLOR = roleColors.CAFE;

type BookingStatus = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  petName?: string;
  eventId?: string;
  eventTitle?: string;
  date: string;
  time: string;
  partySize: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  specialRequests?: string;
  totalAmount: number;
  createdAt: string;
}

export default function CafeBookingsScreen() {
  const [activeTab, setActiveTab] = useState<BookingStatus>('pending');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Mock data
  const bookings: Booking[] = [
    {
      id: '1',
      customerName: 'Priya Sharma',
      customerPhone: '+91 98765 43210',
      petName: 'Bruno',
      date: '2025-02-15',
      time: '2:00 PM',
      partySize: 4,
      status: 'pending',
      specialRequests: 'Window seat preferred, celebrating pet birthday',
      totalAmount: 1200,
      createdAt: '2025-02-13T10:30:00',
    },
    {
      id: '2',
      customerName: 'Rahul Verma',
      customerPhone: '+91 98765 43211',
      petName: 'Max',
      eventId: '1',
      eventTitle: 'Sunday Pet Meetup',
      date: '2025-02-16',
      time: '3:00 PM',
      partySize: 2,
      status: 'confirmed',
      totalAmount: 598,
      createdAt: '2025-02-12T14:20:00',
    },
    {
      id: '3',
      customerName: 'Anita Desai',
      customerPhone: '+91 98765 43212',
      date: '2025-02-15',
      time: '5:00 PM',
      partySize: 6,
      status: 'confirmed',
      totalAmount: 1800,
      createdAt: '2025-02-11T09:15:00',
    },
    {
      id: '4',
      customerName: 'Vikram Singh',
      customerPhone: '+91 98765 43213',
      petName: 'Lucky',
      date: '2025-02-14',
      time: '1:00 PM',
      partySize: 3,
      status: 'completed',
      totalAmount: 900,
      createdAt: '2025-02-10T16:45:00',
    },
    {
      id: '5',
      customerName: 'Neha Gupta',
      customerPhone: '+91 98765 43214',
      date: '2025-02-13',
      time: '4:00 PM',
      partySize: 2,
      status: 'cancelled',
      totalAmount: 600,
      createdAt: '2025-02-09T11:00:00',
    },
  ];

  const tabs: { id: BookingStatus; label: string; count: number }[] = [
    { id: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
    { id: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
    { id: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
    { id: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length },
  ];

  const filteredBookings = bookings.filter(b => activeTab === 'all' || b.status === activeTab);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'confirmed': return '#10B981';
      case 'completed': return colors.gray[400];
      case 'cancelled': return '#EF4444';
      default: return colors.gray[400];
    }
  };

  const handleAction = (action: 'confirm' | 'cancel' | 'complete') => {
    // TODO: API call
    setModalVisible(false);
    setSelectedBooking(null);
  };

  const openBookingDetail = (booking: Booking) => {
    setSelectedBooking(booking);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookings</Text>
        <View style={styles.todayBadge}>
          <Text style={styles.todayText}>Today: {bookings.filter(b => b.date === '2025-02-15').length}</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[styles.tabBadge, activeTab === tab.id && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === tab.id && styles.tabBadgeTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bookings List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CAFE_COLOR} />}
        contentContainerStyle={styles.listContainer}
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: `${CAFE_COLOR}15` }]}>
              <Ionicons name="book-outline" size={48} color={CAFE_COLOR} />
            </View>
            <Text style={styles.emptyTitle}>No bookings</Text>
            <Text style={styles.emptySubtitle}>No {activeTab} bookings found</Text>
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.bookingCard}
              onPress={() => openBookingDetail(booking)}
            >
              <View style={styles.bookingHeader}>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{booking.customerName}</Text>
                  {booking.petName && (
                    <View style={styles.petBadge}>
                      <Ionicons name="paw" size={12} color={CAFE_COLOR} />
                      <Text style={styles.petName}>{booking.petName}</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(booking.status)}15` }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(booking.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                    {booking.status}
                  </Text>
                </View>
              </View>

              {booking.eventTitle && (
                <View style={styles.eventInfo}>
                  <Ionicons name="calendar" size={14} color={CAFE_COLOR} />
                  <Text style={[styles.eventTitle, { color: CAFE_COLOR }]}>{booking.eventTitle}</Text>
                </View>
              )}

              <View style={styles.bookingDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={16} color={colors.gray[400]} />
                  <Text style={styles.detailText}>{formatDate(booking.date)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={16} color={colors.gray[400]} />
                  <Text style={styles.detailText}>{booking.time}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="people-outline" size={16} color={colors.gray[400]} />
                  <Text style={styles.detailText}>{booking.partySize} guests</Text>
                </View>
              </View>

              <View style={styles.bookingFooter}>
                <Text style={styles.amountText}>₹{booking.totalAmount}</Text>
                {booking.status === 'pending' && (
                  <View style={styles.quickActions}>
                    <TouchableOpacity
                      style={[styles.quickActionBtn, { backgroundColor: '#10B98115' }]}
                      onPress={() => handleAction('confirm')}
                    >
                      <Ionicons name="checkmark" size={18} color="#10B981" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickActionBtn, { backgroundColor: '#EF444415' }]}
                      onPress={() => handleAction('cancel')}
                    >
                      <Ionicons name="close" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Booking Detail Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            {selectedBooking && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Booking Details</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.gray[500]} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Customer</Text>
                    <Text style={styles.modalValue}>{selectedBooking.customerName}</Text>
                    <Text style={styles.modalSubValue}>{selectedBooking.customerPhone}</Text>
                    {selectedBooking.petName && (
                      <View style={[styles.petBadge, { marginTop: 8 }]}>
                        <Ionicons name="paw" size={14} color={CAFE_COLOR} />
                        <Text style={styles.petName}>{selectedBooking.petName}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Booking Info</Text>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Date:</Text>
                      <Text style={styles.modalValue}>{formatDate(selectedBooking.date)}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Time:</Text>
                      <Text style={styles.modalValue}>{selectedBooking.time}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Party Size:</Text>
                      <Text style={styles.modalValue}>{selectedBooking.partySize} guests</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Amount:</Text>
                      <Text style={[styles.modalValue, { color: CAFE_COLOR, fontWeight: '700' }]}>
                        ₹{selectedBooking.totalAmount}
                      </Text>
                    </View>
                  </View>

                  {selectedBooking.specialRequests && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Special Requests</Text>
                      <Text style={styles.modalSubValue}>{selectedBooking.specialRequests}</Text>
                    </View>
                  )}

                  {selectedBooking.status === 'pending' && (
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={[styles.modalActionBtn, { backgroundColor: '#EF4444' }]}
                        onPress={() => handleAction('cancel')}
                      >
                        <Text style={styles.modalActionBtnText}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalActionBtn, { backgroundColor: '#10B981' }]}
                        onPress={() => handleAction('confirm')}
                      >
                        <Text style={styles.modalActionBtnText}>Confirm</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedBooking.status === 'confirmed' && (
                    <TouchableOpacity
                      style={[styles.modalActionBtn, { backgroundColor: CAFE_COLOR, marginTop: 16 }]}
                      onPress={() => handleAction('complete')}
                    >
                      <Text style={styles.modalActionBtnText}>Mark as Completed</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.gray[900] },
  todayBadge: { backgroundColor: `${CAFE_COLOR}15`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  todayText: { fontSize: 13, fontWeight: '600', color: CAFE_COLOR },
  tabsScroll: { maxHeight: 50 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.gray[100], gap: 6 },
  tabActive: { backgroundColor: CAFE_COLOR },
  tabText: { fontSize: 14, fontWeight: '500', color: colors.gray[600] },
  tabTextActive: { color: colors.white },
  tabBadge: { backgroundColor: colors.gray[200], paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabBadgeText: { fontSize: 12, fontWeight: '600', color: colors.gray[600] },
  tabBadgeTextActive: { color: colors.white },
  listContainer: { paddingHorizontal: 20, paddingTop: 16 },
  bookingCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  petBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${CAFE_COLOR}15`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', gap: 4 },
  petName: { fontSize: 12, fontWeight: '600', color: CAFE_COLOR },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  eventInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${CAFE_COLOR}10`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: 12, gap: 6 },
  eventTitle: { fontSize: 13, fontWeight: '600' },
  bookingDetails: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: colors.gray[500] },
  bookingFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.gray[100], paddingTop: 12 },
  amountText: { fontSize: 18, fontWeight: '700', color: colors.gray[900] },
  quickActions: { flexDirection: 'row', gap: 8 },
  quickActionBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.gray[900], marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: colors.gray[500] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, maxHeight: '80%' },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.gray[300], borderRadius: 2, alignSelf: 'center', marginVertical: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.gray[900] },
  modalSection: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  modalSectionTitle: { fontSize: 14, fontWeight: '600', color: colors.gray[500], marginBottom: 8 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  modalLabel: { fontSize: 15, color: colors.gray[500] },
  modalValue: { fontSize: 15, fontWeight: '600', color: colors.gray[900] },
  modalSubValue: { fontSize: 14, color: colors.gray[600], lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalActionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalActionBtnText: { fontSize: 16, fontWeight: '600', color: colors.white },
});
