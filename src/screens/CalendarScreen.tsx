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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';
import { bookingsApi } from '../lib/api';

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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

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

  const getRoleConfig = () => {
    switch (userRole) {
      case 'VET':
        return { color: '#10B981', title: 'Appointments' };
      case 'GROOMER':
        return { color: '#8B5CF6', title: 'Appointments' };
      case 'LOVER':
        return { color: '#EC4899', title: 'Bookings' };
      default:
        return { color: colors.primary, title: 'Calendar' };
    }
  };

  const config = getRoleConfig();

  useEffect(() => {
    loadBookings();
  }, [currentDate]);

  const loadBookings = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const data = await bookingsApi.getMyBookings();

      // Group bookings by date
      const grouped: DayBookings = {};
      const bookingsList = data.bookings || data || [];

      bookingsList.forEach((booking: any) => {
        const dateKey = booking.date?.split('T')[0] || booking.date;
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
      console.error('Failed to load bookings:', error);
      // Use mock data for demo
      setBookings(getMockBookings());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getMockBookings = (): DayBookings => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 5);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    return {
      [formatDate(today)]: [
        {
          id: '1',
          customerName: 'Rahul Kumar',
          customerPhone: '+91 98765 43210',
          petName: 'Bruno',
          petType: 'Dog',
          service: userRole === 'VET' ? 'Annual Checkup' : 'Full Grooming',
          date: formatDate(today),
          time: '10:00 AM',
          duration: 30,
          status: 'confirmed',
          price: 800,
        },
        {
          id: '2',
          customerName: 'Priya Sharma',
          customerPhone: '+91 87654 32109',
          petName: 'Whiskers',
          petType: 'Cat',
          service: userRole === 'VET' ? 'Vaccination' : 'Bath & Brush',
          date: formatDate(today),
          time: '2:30 PM',
          duration: 45,
          status: 'pending',
          price: 600,
        },
      ],
      [formatDate(tomorrow)]: [
        {
          id: '3',
          customerName: 'Amit Patel',
          customerPhone: '+91 76543 21098',
          petName: 'Max',
          petType: 'Dog',
          service: userRole === 'VET' ? 'Dental Cleaning' : 'De-shedding',
          date: formatDate(tomorrow),
          time: '11:00 AM',
          duration: 60,
          status: 'confirmed',
          price: 1200,
        },
      ],
      [formatDate(dayAfter)]: [
        {
          id: '4',
          customerName: 'Neha Gupta',
          customerPhone: '+91 65432 10987',
          petName: 'Coco',
          petType: 'Dog',
          service: userRole === 'VET' ? 'Follow-up' : 'Nail Trimming',
          date: formatDate(dayAfter),
          time: '3:00 PM',
          duration: 20,
          status: 'pending',
          notes: 'First time customer',
          price: 300,
        },
      ],
      [formatDate(nextWeek)]: [
        {
          id: '5',
          customerName: 'Vikram Singh',
          customerPhone: '+91 54321 09876',
          petName: 'Rocky',
          petType: 'Dog',
          service: userRole === 'VET' ? 'Surgery Consultation' : 'Full Grooming',
          date: formatDate(nextWeek),
          time: '10:30 AM',
          duration: 45,
          status: 'confirmed',
          price: 1500,
        },
      ],
    };
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

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getDateKey = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, day).toISOString().split('T')[0];
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

  const handleAcceptBooking = async () => {
    if (!selectedBooking) return;

    setProcessingAction(true);
    try {
      await bookingsApi.updateBooking(selectedBooking.id, { status: 'confirmed' });

      // Update local state
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
      // Update locally for demo
      const dateKey = selectedBooking.date;
      setBookings(prev => ({
        ...prev,
        [dateKey]: prev[dateKey].map(b =>
          b.id === selectedBooking.id ? { ...b, status: 'confirmed' as const } : b
        ),
      }));
      setShowBookingModal(false);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDeclineBooking = async () => {
    if (!selectedBooking) return;

    Alert.alert(
      'Decline Booking',
      'Are you sure you want to decline this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessingAction(true);
            try {
              await bookingsApi.updateBooking(selectedBooking.id, { status: 'cancelled' });

              const dateKey = selectedBooking.date;
              setBookings(prev => ({
                ...prev,
                [dateKey]: prev[dateKey].filter(b => b.id !== selectedBooking.id),
              }));

              setShowBookingModal(false);
              Alert.alert('Declined', 'Booking has been declined.');
            } catch (error) {
              const dateKey = selectedBooking.date;
              setBookings(prev => ({
                ...prev,
                [dateKey]: prev[dateKey].filter(b => b.id !== selectedBooking.id),
              }));
              setShowBookingModal(false);
            } finally {
              setProcessingAction(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteBooking = async () => {
    if (!selectedBooking) return;

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
      const dateKey = selectedBooking.date;
      setBookings(prev => ({
        ...prev,
        [dateKey]: prev[dateKey].map(b =>
          b.id === selectedBooking.id ? { ...b, status: 'completed' as const } : b
        ),
      }));
      setShowBookingModal(false);
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'confirmed':
        return '#10B981';
      case 'completed':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return colors.gray[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time';
      case 'confirmed':
        return 'checkmark-circle';
      case 'completed':
        return 'checkmark-done';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'ellipse';
    }
  };

  const selectedDayBookings = selectedDate
    ? bookings[selectedDate.toISOString().split('T')[0]] || []
    : [];

  const days = getDaysInMonth(currentDate);

  // Stats
  const allBookings = Object.values(bookings).flat();
  const pendingCount = allBookings.filter(b => b.status === 'pending').length;
  const todayCount = bookings[new Date().toISOString().split('T')[0]]?.length || 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={config.color} />
          <Text style={styles.loadingText}>Loading calendar...</Text>
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{config.title}</Text>
          <TouchableOpacity style={styles.todayBtn} onPress={goToToday}>
            <Text style={[styles.todayBtnText, { color: config.color }]}>Today</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: config.color }]}>
            <Text style={styles.statValue}>{todayCount}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
            <Text style={styles.statValue}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
            <Text style={styles.statValue}>{allBookings.filter(b => b.status === 'confirmed').length}</Text>
            <Text style={styles.statLabel}>Confirmed</Text>
          </View>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={24} color={colors.gray[700]} />
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        <View style={styles.calendar}>
          {/* Day headers */}
          <View style={styles.weekHeader}>
            {DAYS.map(day => (
              <View key={day} style={styles.dayHeaderCell}>
                <Text style={styles.dayHeaderText}>{day}</Text>
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

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCell,
                    isToday(day) && styles.todayCell,
                    isSelected(day) && [styles.selectedCell, { backgroundColor: config.color }],
                  ]}
                  onPress={() => selectDay(day)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday(day) && !isSelected(day) && { color: config.color, fontWeight: '700' },
                      isSelected(day) && styles.selectedDayText,
                    ]}
                  >
                    {day}
                  </Text>
                  {hasBookings && (
                    <View style={styles.bookingIndicators}>
                      <View
                        style={[
                          styles.bookingDot,
                          { backgroundColor: hasPending ? '#F59E0B' : '#10B981' },
                        ]}
                      />
                      {dayBookings.length > 1 && (
                        <View
                          style={[
                            styles.bookingDot,
                            { backgroundColor: config.color },
                          ]}
                        />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Day Bookings */}
        <View style={styles.bookingsSection}>
          <Text style={styles.sectionTitle}>
            {selectedDate
              ? selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Select a date'}
          </Text>

          {selectedDayBookings.length === 0 ? (
            <View style={styles.emptyDay}>
              <Ionicons name="calendar-outline" size={48} color={colors.gray[300]} />
              <Text style={styles.emptyDayText}>No bookings for this day</Text>
              <Text style={styles.emptyDaySubtext}>
                Your schedule is free!
              </Text>
            </View>
          ) : (
            selectedDayBookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => openBookingDetails(booking)}
              >
                <View style={styles.bookingTime}>
                  <Text style={styles.timeText}>{booking.time}</Text>
                  <Text style={styles.durationText}>{booking.duration} min</Text>
                </View>
                <View style={styles.bookingDivider} />
                <View style={styles.bookingDetails}>
                  <View style={styles.bookingHeader}>
                    <Text style={styles.customerName}>{booking.customerName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(booking.status)}15` }]}>
                      <Ionicons
                        name={getStatusIcon(booking.status) as any}
                        size={12}
                        color={getStatusColor(booking.status)}
                      />
                      <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.petInfo}>
                    <Ionicons name="paw" size={14} color={colors.gray[400]} />
                    <Text style={styles.petText}>{booking.petName} ({booking.petType})</Text>
                  </View>
                  <Text style={styles.serviceText}>{booking.service}</Text>
                  <Text style={[styles.priceText, { color: config.color }]}>
                    ₹{booking.price.toLocaleString()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Booking Details Modal */}
      <Modal visible={showBookingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Booking Details</Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <Ionicons name="close" size={24} color={colors.gray[700]} />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: `${getStatusColor(selectedBooking.status)}15` }]}>
                  <Ionicons
                    name={getStatusIcon(selectedBooking.status) as any}
                    size={20}
                    color={getStatusColor(selectedBooking.status)}
                  />
                  <Text style={[styles.statusBannerText, { color: getStatusColor(selectedBooking.status) }]}>
                    {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                  </Text>
                </View>

                {/* Customer Info */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Customer</Text>
                  <View style={styles.detailRow}>
                    <Ionicons name="person" size={18} color={colors.gray[500]} />
                    <Text style={styles.detailText}>{selectedBooking.customerName}</Text>
                  </View>
                  {selectedBooking.customerPhone && (
                    <TouchableOpacity style={styles.detailRow}>
                      <Ionicons name="call" size={18} color={config.color} />
                      <Text style={[styles.detailText, { color: config.color }]}>
                        {selectedBooking.customerPhone}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Pet Info */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Pet</Text>
                  <View style={styles.detailRow}>
                    <Ionicons name="paw" size={18} color={colors.gray[500]} />
                    <Text style={styles.detailText}>
                      {selectedBooking.petName} ({selectedBooking.petType})
                    </Text>
                  </View>
                </View>

                {/* Appointment Info */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Appointment</Text>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={18} color={colors.gray[500]} />
                    <Text style={styles.detailText}>
                      {new Date(selectedBooking.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={18} color={colors.gray[500]} />
                    <Text style={styles.detailText}>
                      {selectedBooking.time} ({selectedBooking.duration} minutes)
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="medkit" size={18} color={colors.gray[500]} />
                    <Text style={styles.detailText}>{selectedBooking.service}</Text>
                  </View>
                </View>

                {/* Notes */}
                {selectedBooking.notes && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Notes</Text>
                    <Text style={styles.notesText}>{selectedBooking.notes}</Text>
                  </View>
                )}

                {/* Price */}
                <View style={styles.priceSection}>
                  <Text style={styles.priceLabelLarge}>Total</Text>
                  <Text style={[styles.priceValueLarge, { color: config.color }]}>
                    ₹{selectedBooking.price.toLocaleString()}
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.actionButtons}>
                  {selectedBooking.status === 'pending' && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.declineBtn]}
                        onPress={handleDeclineBooking}
                        disabled={processingAction}
                      >
                        <Ionicons name="close" size={20} color={colors.error} />
                        <Text style={styles.declineBtnText}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.acceptBtn, { backgroundColor: config.color }]}
                        onPress={handleAcceptBooking}
                        disabled={processingAction}
                      >
                        {processingAction ? (
                          <ActivityIndicator color={colors.white} size="small" />
                        ) : (
                          <>
                            <Ionicons name="checkmark" size={20} color={colors.white} />
                            <Text style={styles.acceptBtnText}>Accept</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                  {selectedBooking.status === 'confirmed' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.completeBtn, { backgroundColor: config.color }]}
                      onPress={handleCompleteBooking}
                      disabled={processingAction}
                    >
                      {processingAction ? (
                        <ActivityIndicator color={colors.white} size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-done" size={20} color={colors.white} />
                          <Text style={styles.acceptBtnText}>Mark Complete</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  {selectedBooking.status === 'completed' && (
                    <View style={styles.completedBanner}>
                      <Ionicons name="checkmark-done-circle" size={24} color="#10B981" />
                      <Text style={styles.completedText}>This booking has been completed</Text>
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.gray[500],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  todayBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  todayBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  calendar: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
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
    fontWeight: '600',
    color: colors.gray[500],
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  todayCell: {
    backgroundColor: colors.gray[50],
  },
  selectedCell: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 15,
    color: colors.gray[900],
  },
  selectedDayText: {
    color: colors.white,
    fontWeight: '600',
  },
  bookingIndicators: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 4,
    gap: 3,
  },
  bookingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  bookingsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 16,
  },
  emptyDay: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyDayText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
    marginTop: 12,
  },
  emptyDaySubtext: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingTime: {
    alignItems: 'center',
    width: 60,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[900],
  },
  durationText: {
    fontSize: 11,
    color: colors.gray[500],
    marginTop: 2,
  },
  bookingDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.gray[200],
    marginHorizontal: 12,
  },
  bookingDetails: {
    flex: 1,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  petText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  serviceText: {
    fontSize: 13,
    color: colors.gray[600],
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  statusBannerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  detailText: {
    fontSize: 15,
    color: colors.gray[900],
  },
  notesText: {
    fontSize: 14,
    color: colors.gray[600],
    backgroundColor: colors.gray[50],
    padding: 12,
    borderRadius: 10,
    lineHeight: 20,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  priceLabelLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  priceValueLarge: {
    fontSize: 24,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  declineBtn: {
    backgroundColor: `${colors.error}10`,
    borderWidth: 1,
    borderColor: colors.error,
  },
  declineBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  acceptBtn: {},
  acceptBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  completeBtn: {
    flex: 1,
  },
  completedBanner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B98115',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
});
