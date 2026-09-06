import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';
import { bookingsApi, canTransitionBooking } from '../lib/api';
import logger from '../lib/logger';

const { width } = Dimensions.get('window');
const CALENDAR_PADDING = 24;
const DAY_SIZE = (width - CALENDAR_PADDING * 2 - 32) / 7;

interface Booking {
  id: string;
  customerName: string;
  customerPhone?: string;
  petName: string;
  petType: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  price: number;
}

interface DayBookings {
  [date: string]: Booking[];
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/** Local calendar-day key. Never use toISOString() here: UTC conversion
 *  shifts IST evenings onto the wrong day. */
function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Normalize a server date (ISO datetime or YYYY-MM-DD) to a local day key. */
function toDateKey(value: unknown): string {
  if (typeof value === 'string') {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  }
  const d = value instanceof Date ? value : new Date(value as string);
  if (Number.isNaN(d.getTime())) return '';
  return toLocalDateKey(d);
}

export default function CalendarScreen() {
  const { user } = useAuth();
  const userRole = (user?.role || 'OWNER').toUpperCase();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [bookings, setBookings] = useState<DayBookings>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const getRoleConfig = () => {
    switch (userRole) {
      case 'VET':
        return { color: '#10B981', title: 'Appointments', icon: 'medical' };
      case 'GROOMER':
        return { color: '#8B5CF6', title: 'Appointments', icon: 'cut' };
      case 'LOVER':
        return { color: '#F97316', title: 'My Schedule', icon: 'heart' };
      default:
        return { color: colors.primary, title: 'Calendar', icon: 'calendar' };
    }
  };

  const config = getRoleConfig();

  useEffect(() => {
    loadBookings();
  }, [currentDate]);

  const loadBookings = async () => {
    setLoadError(null);
    try {
      const data = await bookingsApi.getMyBookings();
      const grouped: DayBookings = {};
      const bookingsList = data.bookings || data || [];

      bookingsList.forEach((booking: any) => {
        const dateKey = toDateKey(booking.date);
        if (!dateKey) return;
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push({
          id: booking.id,
          customerName: booking.customerName || booking.user?.name || 'Customer',
          customerPhone: booking.customerPhone || booking.user?.phone,
          petName: booking.petName || booking.pet?.name || 'Pet',
          petType: booking.petType || booking.pet?.species || 'Dog',
          service: booking.service || booking.serviceName || 'Consultation',
          date: dateKey,
          time: booking.time || '10:00 AM',
          duration: booking.duration || 30,
          status: booking.status || 'pending',
          notes: booking.notes,
          price: booking.price || 500,
        });
      });

      setBookings(grouped);
    } catch (error) {
      // Honest failure: never silently substitute mock data for real bookings.
      const message = error instanceof Error ? error.message : 'Could not load bookings.';
      logger.error('Failed to load bookings:', error);
      setBookings({});
      setLoadError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getDateKey = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return toLocalDateKey(new Date(year, month, day));
  };

  const getBookingsForDay = (day: number) => {
    const dateKey = getDateKey(day);
    return bookings[dateKey] || [];
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isPast = (day: number) => {
    const today = new Date();
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    today.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const selectDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    setSelectedDate(new Date(year, month, day));
  };

  const goToPrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const openBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const failAction = (error: unknown) => {
    // Never apply the mutation locally on failure (the old code did) — the
    // calendar must reflect the server, not wishful thinking.
    const message = error instanceof Error ? error.message : 'Action failed. Please try again.';
    logger.error('Booking action failed:', error);
    Alert.alert('Could not update booking', message);
  };

  const handleAcceptBooking = async () => {
    if (!selectedBooking) return;
    if (!canTransitionBooking(selectedBooking.status, 'confirmed')) {
      Alert.alert('Invalid action', `A ${selectedBooking.status} booking cannot be confirmed.`);
      return;
    }
    setProcessingAction(true);
    try {
      await bookingsApi.updateBooking(selectedBooking.id, { status: 'confirmed' });
      const dateKey = selectedBooking.date;
      setBookings(prev => ({
        ...prev,
        [dateKey]: prev[dateKey].map(b =>
          b.id === selectedBooking.id ? { ...b, status: 'confirmed' as const } : b
        ),
      }));
      setShowBookingModal(false);
      Alert.alert('Success', 'Booking confirmed!');
    } catch (error) {
      failAction(error);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDeclineBooking = async () => {
    if (!selectedBooking) return;
    if (!canTransitionBooking(selectedBooking.status, 'cancelled')) {
      Alert.alert('Invalid action', `A ${selectedBooking.status} booking cannot be cancelled.`);
      return;
    }
    Alert.alert('Decline Booking', 'Are you sure you want to decline this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          setProcessingAction(true);
          try {
            // Single cancel path — no second free-form status update.
            await bookingsApi.cancelBooking(selectedBooking.id);
            const dateKey = selectedBooking.date;
            setBookings(prev => ({
              ...prev,
              [dateKey]: prev[dateKey].filter(b => b.id !== selectedBooking.id),
            }));
            setShowBookingModal(false);
          } catch (error) {
            failAction(error);
          } finally {
            setProcessingAction(false);
          }
        },
      },
    ]);
  };

  const handleCompleteBooking = async () => {
    if (!selectedBooking) return;
    if (!canTransitionBooking(selectedBooking.status, 'completed')) {
      Alert.alert('Invalid action', `A ${selectedBooking.status} booking cannot be completed.`);
      return;
    }
    setProcessingAction(true);
    try {
      await bookingsApi.updateBooking(selectedBooking.id, { status: 'completed' });
      const dateKey = selectedBooking.date;
      setBookings(prev => ({
        ...prev,
        [dateKey]: prev[dateKey].map(b =>
          b.id === selectedBooking.id ? { ...b, status: 'completed' as const } : b
        ),
      }));
      setShowBookingModal(false);
      Alert.alert('Success', 'Booking marked as completed!');
    } catch (error) {
      failAction(error);
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'confirmed': return '#10B981';
      case 'completed': return '#6B7280';
      case 'cancelled': return '#EF4444';
      default: return colors.gray[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time';
      case 'confirmed': return 'checkmark-circle';
      case 'completed': return 'checkmark-done';
      case 'cancelled': return 'close-circle';
      default: return 'ellipse';
    }
  };

  const selectedDayBookings = selectedDate
    ? bookings[toLocalDateKey(selectedDate)] || []
    : [];

  const days = getDaysInMonth(currentDate);
  const allBookings = Object.values(bookings).flat();
  const pendingCount = allBookings.filter(b => b.status === 'pending').length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={config.color} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={config.color} />
        }
      >
        {/* Clean Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{config.title}</Text>
            {pendingCount > 0 && (
              <Text style={styles.headerSubtitle}>{pendingCount} pending request{pendingCount > 1 ? 's' : ''}</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.todayBtn, { backgroundColor: `${config.color}12` }]}
            onPress={goToToday}
          >
            <Text style={[styles.todayBtnText, { color: config.color }]}>Today</Text>
          </TouchableOpacity>
        </View>

        {loadError && (
          <View style={styles.errorBanner}>
            <Ionicons name="cloud-offline-outline" size={20} color="#B45309" />
            <Text style={styles.errorBannerText}>{loadError}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => { setLoading(true); loadBookings(); }}
            >
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Elegant Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.gray[600]} />
          </TouchableOpacity>
          <View style={styles.monthTitleContainer}>
            <Text style={styles.monthTitle}>{MONTHS[currentDate.getMonth()]}</Text>
            <Text style={styles.yearTitle}>{currentDate.getFullYear()}</Text>
          </View>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[600]} />
          </TouchableOpacity>
        </View>

        {/* Premium Calendar */}
        <View style={styles.calendarContainer}>
          {/* Day headers */}
          <View style={styles.weekHeader}>
            {DAYS.map((day, index) => (
              <View key={index} style={styles.dayHeaderCell}>
                <Text style={[
                  styles.dayHeaderText,
                  (index === 0 || index === 6) && styles.weekendText
                ]}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Days grid */}
          <View style={styles.daysGrid}>
            {days.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const dayBookings = getBookingsForDay(day);
              const hasBookings = dayBookings.length > 0;
              const hasPending = dayBookings.some(b => b.status === 'pending');
              const hasConfirmed = dayBookings.some(b => b.status === 'confirmed');
              const past = isPast(day);

              return (
                <TouchableOpacity
                  key={day}
                  style={styles.dayCell}
                  onPress={() => selectDay(day)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.dayInner,
                    isToday(day) && !isSelected(day) && styles.todayCell,
                    isSelected(day) && [styles.selectedCell, { backgroundColor: config.color }],
                  ]}>
                    <Text style={[
                      styles.dayText,
                      past && !isSelected(day) && styles.pastDayText,
                      isToday(day) && !isSelected(day) && [styles.todayText, { color: config.color }],
                      isSelected(day) && styles.selectedDayText,
                    ]}>
                      {day}
                    </Text>
                  </View>
                  {hasBookings && !isSelected(day) && (
                    <View style={styles.bookingIndicator}>
                      <View style={[
                        styles.indicatorDot,
                        { backgroundColor: hasPending ? '#F59E0B' : hasConfirmed ? '#10B981' : colors.gray[400] }
                      ]} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Day Section */}
        <View style={styles.bookingsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionDate}>
              {selectedDate?.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            {selectedDayBookings.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: `${config.color}15` }]}>
                <Text style={[styles.countText, { color: config.color }]}>
                  {selectedDayBookings.length}
                </Text>
              </View>
            )}
          </View>

          {selectedDayBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: `${config.color}10` }]}>
                <Ionicons name="calendar-outline" size={28} color={config.color} />
              </View>
              <Text style={styles.emptyTitle}>No appointments</Text>
              <Text style={styles.emptySubtitle}>Your schedule is clear for this day</Text>
            </View>
          ) : (
            <View style={styles.bookingsList}>
              {selectedDayBookings.map((booking, index) => (
                <TouchableOpacity
                  key={booking.id}
                  style={[
                    styles.bookingCard,
                    index === selectedDayBookings.length - 1 && { marginBottom: 0 }
                  ]}
                  onPress={() => openBookingDetails(booking)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.timeStrip, { backgroundColor: getStatusColor(booking.status) }]} />
                  <View style={styles.bookingContent}>
                    <View style={styles.bookingTop}>
                      <Text style={styles.bookingTime}>{booking.time}</Text>
                      <View style={[styles.statusPill, { backgroundColor: `${getStatusColor(booking.status)}15` }]}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(booking.status) }]} />
                        <Text style={[styles.statusLabel, { color: getStatusColor(booking.status) }]}>
                          {booking.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.bookingCustomer}>{booking.customerName}</Text>
                    <View style={styles.bookingMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="paw" size={12} color={colors.gray[400]} />
                        <Text style={styles.metaText}>{booking.petName}</Text>
                      </View>
                      <View style={styles.metaDivider} />
                      <Text style={styles.metaText}>{booking.service}</Text>
                    </View>
                    <Text style={[styles.bookingPrice, { color: config.color }]}>
                      ₹{booking.price.toLocaleString()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.gray[300]} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Booking Details Modal */}
      <Modal visible={showBookingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Booking Details</Text>
              <TouchableOpacity
                onPress={() => setShowBookingModal(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Status */}
                <View style={[styles.statusCard, { backgroundColor: `${getStatusColor(selectedBooking.status)}10` }]}>
                  <Ionicons
                    name={getStatusIcon(selectedBooking.status) as any}
                    size={18}
                    color={getStatusColor(selectedBooking.status)}
                  />
                  <Text style={[styles.statusCardText, { color: getStatusColor(selectedBooking.status) }]}>
                    {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                  </Text>
                </View>

                {/* Info Cards */}
                <View style={styles.infoGrid}>
                  <View style={styles.infoCard}>
                    <Ionicons name="person-outline" size={18} color={colors.gray[400]} />
                    <Text style={styles.infoLabel}>Customer</Text>
                    <Text style={styles.infoValue}>{selectedBooking.customerName}</Text>
                    {selectedBooking.customerPhone && (
                      <Text style={[styles.infoLink, { color: config.color }]}>{selectedBooking.customerPhone}</Text>
                    )}
                  </View>
                  <View style={styles.infoCard}>
                    <Ionicons name="paw-outline" size={18} color={colors.gray[400]} />
                    <Text style={styles.infoLabel}>Pet</Text>
                    <Text style={styles.infoValue}>{selectedBooking.petName}</Text>
                    <Text style={styles.infoSubvalue}>{selectedBooking.petType}</Text>
                  </View>
                </View>

                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={18} color={colors.gray[400]} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Date</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedBooking.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={18} color={colors.gray[400]} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Time</Text>
                      <Text style={styles.detailValue}>
                        {selectedBooking.time} • {selectedBooking.duration} min
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailRow}>
                    <Ionicons name="briefcase-outline" size={18} color={colors.gray[400]} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Service</Text>
                      <Text style={styles.detailValue}>{selectedBooking.service}</Text>
                    </View>
                  </View>
                </View>

                {selectedBooking.notes && (
                  <View style={styles.notesCard}>
                    <Text style={styles.notesLabel}>Notes</Text>
                    <Text style={styles.notesValue}>{selectedBooking.notes}</Text>
                  </View>
                )}

                {/* Price */}
                <View style={styles.priceCard}>
                  <Text style={styles.priceLabel}>Total Amount</Text>
                  <Text style={[styles.priceValue, { color: config.color }]}>
                    ₹{selectedBooking.price.toLocaleString()}
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  {selectedBooking.status === 'pending' && (
                    <>
                      <TouchableOpacity
                        style={styles.declineButton}
                        onPress={handleDeclineBooking}
                        disabled={processingAction}
                      >
                        <Text style={styles.declineText}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.acceptButton, { backgroundColor: config.color }]}
                        onPress={handleAcceptBooking}
                        disabled={processingAction}
                      >
                        {processingAction ? (
                          <ActivityIndicator color={colors.white} size="small" />
                        ) : (
                          <Text style={styles.acceptText}>Accept</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                  {selectedBooking.status === 'confirmed' && (
                    <TouchableOpacity
                      style={[styles.completeButton, { backgroundColor: config.color }]}
                      onPress={handleCompleteBooking}
                      disabled={processingAction}
                    >
                      {processingAction ? (
                        <ActivityIndicator color={colors.white} size="small" />
                      ) : (
                        <Text style={styles.acceptText}>Mark Complete</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  {selectedBooking.status === 'completed' && (
                    <View style={styles.completedState}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <Text style={styles.completedText}>Completed</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: CALENDAR_PADDING,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.gray[900],
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 2,
  },
  todayBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  todayBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#B45309',
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: CALENDAR_PADDING,
    marginBottom: 20,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  monthTitleContainer: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  yearTitle: {
    fontSize: 13,
    color: colors.gray[400],
    marginTop: 1,
  },
  calendarContainer: {
    backgroundColor: colors.white,
    marginHorizontal: CALENDAR_PADDING,
    borderRadius: 20,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[400],
  },
  weekendText: {
    color: colors.gray[300],
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCell: {
    backgroundColor: colors.gray[100],
  },
  selectedCell: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray[800],
  },
  pastDayText: {
    color: colors.gray[300],
  },
  todayText: {
    fontWeight: '700',
  },
  selectedDayText: {
    color: colors.white,
    fontWeight: '600',
  },
  bookingIndicator: {
    position: 'absolute',
    bottom: 6,
  },
  indicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  bookingsSection: {
    paddingHorizontal: CALENDAR_PADDING,
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionDate: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray[800],
  },
  countBadge: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray[400],
    marginTop: 4,
  },
  bookingsList: {
    gap: 12,
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  timeStrip: {
    width: 3,
    height: 48,
    borderRadius: 2,
    marginRight: 14,
  },
  bookingContent: {
    flex: 1,
  },
  bookingTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bookingTime: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[500],
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  bookingCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  bookingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.gray[300],
    marginHorizontal: 8,
  },
  bookingPrice: {
    fontSize: 15,
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray[900],
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  statusCardText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    padding: 14,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.gray[400],
    marginTop: 8,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  infoSubvalue: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 1,
  },
  infoLink: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  detailCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.gray[400],
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[800],
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginLeft: 42,
  },
  notesCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#92400E',
    marginBottom: 4,
  },
  notesValue: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  priceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[600],
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    alignItems: 'center',
  },
  declineText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[700],
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  acceptText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  completeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  completedState: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  completedText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
  },
});
