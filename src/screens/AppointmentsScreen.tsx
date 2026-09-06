import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { bookingsApi } from '../lib/api';
import logger from '../lib/logger';

interface Appointment {
  id: string;
  providerId?: string;
  providerName: string;
  providerType: 'vet' | 'groomer';
  service: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  petName?: string;
  address?: string;
  googleMapsLink?: string;
}

function displayDate(value: unknown): string {
  if (typeof value !== 'string' || value === '') return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function AppointmentsScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await bookingsApi.getMyBookings();
      const list = data.bookings || data || [];
      setAppointments(
        (Array.isArray(list) ? list : [])
          .map((b: any) => {
            const id = b?.id ?? b?._id;
            if (id === undefined || id === null) return null;
            const rawStatus = String(b.status ?? 'pending');
            const status: Appointment['status'] =
              rawStatus === 'completed' || rawStatus === 'cancelled' || rawStatus === 'no_show'
                ? rawStatus === 'no_show' ? 'cancelled' : rawStatus
                : 'upcoming';
            const rawType = String(b.providerType ?? b.provider?.type ?? '').toLowerCase();
            return {
              id: String(id),
              providerId: b.providerId ? String(b.providerId) : b.provider?.id ? String(b.provider.id) : undefined,
              providerName: b.providerName ?? b.provider?.name ?? b.clinicName ?? b.businessName ?? 'Provider',
              providerType: rawType === 'groomer' ? 'groomer' : 'vet',
              service: b.service ?? b.serviceName ?? 'Appointment',
              date: displayDate(b.date),
              time: b.time ?? '',
              status,
              petName: b.petName ?? b.pet?.name,
              address: b.address ?? b.provider?.address,
              googleMapsLink: b.googleMapsLink ?? b.provider?.googleMapsLink,
            } as Appointment;
          })
          .filter((a): a is Appointment => a !== null)
      );
    } catch (error) {
      logger.error('Failed to load appointments:', error);
      setAppointments([]);
      setLoadError(error instanceof Error ? error.message : 'Could not load appointments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const upcomingAppointments = appointments.filter(a => a.status === 'upcoming');
  const pastAppointments = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled');

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'vet':
        return { icon: 'medical', color: '#10B981', label: 'Veterinarian' };
      case 'groomer':
        return { icon: 'cut', color: '#8B5CF6', label: 'Pet Groomer' };
      default:
        return { icon: 'business', color: colors.primary, label: 'Provider' };
    }
  };

  const handleAppointmentPress = (appointment: Appointment) => {
    // Navigate to provider profile with appointment details
    navigation.navigate('ProviderProfile', {
      provider: {
        id: appointment.providerId ?? appointment.id,
        name: appointment.providerName,
        type: appointment.providerType,
        address: appointment.address || 'Address not available',
        googleMapsLink: appointment.googleMapsLink,
        rating: 0,
        reviewCount: 0,
        distance: '',
      },
    });
  };

  const renderAppointment = (appointment: Appointment) => {
    const typeConfig = getTypeConfig(appointment.providerType);

    return (
      <TouchableOpacity
        key={appointment.id}
        style={styles.appointmentCard}
        onPress={() => handleAppointmentPress(appointment)}
      >
        <View style={[styles.appointmentIcon, { backgroundColor: `${typeConfig.color}15` }]}>
          <Ionicons name={typeConfig.icon as any} size={24} color={typeConfig.color} />
        </View>
        <View style={styles.appointmentContent}>
          <View style={styles.appointmentHeader}>
            <Text style={styles.serviceName}>{appointment.service}</Text>
            <View style={[styles.statusBadge, appointment.status === 'completed' && styles.completedBadge]}>
              <Text style={[styles.statusText, appointment.status === 'completed' && styles.completedText]}>
                {appointment.status === 'upcoming' ? 'Upcoming' : 'Completed'}
              </Text>
            </View>
          </View>
          <Text style={styles.providerName}>{appointment.providerName}</Text>
          {appointment.petName && (
            <View style={styles.petRow}>
              <Ionicons name="paw" size={14} color={colors.gray[400]} />
              <Text style={styles.petName}>{appointment.petName}</Text>
            </View>
          )}
          <View style={styles.appointmentMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.gray[500]} />
              <Text style={styles.metaText}>{appointment.date}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={colors.gray[500]} />
              <Text style={styles.metaText}>{appointment.time}</Text>
            </View>
          </View>
          {appointment.status === 'upcoming' && appointment.address && (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={16} color={typeConfig.color} />
              <Text style={[styles.addressText, { color: typeConfig.color }]} numberOfLines={1}>
                {appointment.address}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={typeConfig.color} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming ({upcomingAppointments.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            Past ({pastAppointments.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.emptyText}>Loading appointments...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline-outline" size={60} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>Could not load appointments</Text>
            <Text style={styles.emptyText}>{loadError}</Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => { setLoading(true); loadAppointments(); }}
            >
              <Text style={styles.bookButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : activeTab === 'upcoming' ? (
          upcomingAppointments.length > 0 ? (
            upcomingAppointments.map(renderAppointment)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={60} color={colors.gray[300]} />
              <Text style={styles.emptyTitle}>No Upcoming Appointments</Text>
              <Text style={styles.emptyText}>Book an appointment with a vet or groomer</Text>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => navigation.navigate('Browse')}
              >
                <Text style={styles.bookButtonText}>Find Providers</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          pastAppointments.length > 0 ? (
            pastAppointments.map(renderAppointment)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={60} color={colors.gray[300]} />
              <Text style={styles.emptyTitle}>No Past Appointments</Text>
              <Text style={styles.emptyText}>Your completed appointments will appear here</Text>
            </View>
          )
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.gray[100],
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
  },
  activeTabText: {
    color: colors.white,
  },
  scrollContent: {
    padding: 20,
  },
  appointmentCard: {
    flexDirection: 'row',
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
  appointmentIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentContent: {
    flex: 1,
    marginLeft: 14,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: `${colors.primary}15`,
  },
  completedBadge: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  completedText: {
    color: '#4CAF50',
  },
  providerName: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 6,
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  petName: {
    fontSize: 13,
    color: colors.gray[500],
  },
  appointmentMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.gray[600],
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: 4,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 8,
    textAlign: 'center',
  },
  bookButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
