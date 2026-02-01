import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { bookingsApi, petsApi } from '../lib/api';
import logger from '../lib/logger';

interface BookingScreenProps {
  route?: {
    params?: {
      provider?: {
        id: string;
        name: string;
        type: string;
        price?: string;
      };
    };
  };
  navigation?: any;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
}

const timeSlots = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
];

const durations = [
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
];

export default function BookingScreen({ route, navigation }: BookingScreenProps) {
  const provider = route?.params?.provider;

  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      const data = await petsApi.getMyPets();
      const petsList = data.pets || data || [];
      setPets(petsList);
      if (petsList.length > 0) {
        setSelectedPet(petsList[0]);
      }
    } catch (error) {
      logger.error('Failed to load pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDay = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const handleBooking = async () => {
    if (!selectedPet || !selectedTime || !provider) {
      Alert.alert('Error', 'Please select a pet and time slot');
      return;
    }

    setBooking(true);
    try {
      await bookingsApi.createBooking({
        providerId: provider.id,
        petId: selectedPet.id,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        duration: selectedDuration,
        serviceType: provider.type,
      });

      Alert.alert(
        'Booking Confirmed!',
        `Your appointment with ${provider.name} has been scheduled.`,
        [{ text: 'OK', onPress: () => navigation?.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create booking');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Provider Info */}
        {provider && (
          <View style={styles.providerCard}>
            <View style={styles.providerIcon}>
              <Ionicons
                name={provider.type === 'Veterinarian' ? 'medical' : provider.type === 'Groomer' ? 'cut' : 'heart'}
                size={28}
                color={colors.primary}
              />
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{provider.name}</Text>
              <Text style={styles.providerType}>{provider.type}</Text>
            </View>
            <Text style={styles.providerPrice}>{provider.price || '₹500'}</Text>
          </View>
        )}

        {/* Select Pet */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Pet</Text>
          {pets.length === 0 ? (
            <View style={styles.noPets}>
              <Ionicons name="paw-outline" size={40} color={colors.gray[300]} />
              <Text style={styles.noPetsText}>No pets added yet</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {pets.map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={[
                    styles.petChip,
                    selectedPet?.id === pet.id && styles.petChipSelected,
                  ]}
                  onPress={() => setSelectedPet(pet)}
                >
                  <Text style={styles.petEmoji}>
                    {pet.species.toLowerCase() === 'dog' ? '🐕' : pet.species.toLowerCase() === 'cat' ? '🐱' : '🐾'}
                  </Text>
                  <Text
                    style={[
                      styles.petName,
                      selectedPet?.id === pet.id && styles.petNameSelected,
                    ]}
                  >
                    {pet.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Select Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {getNextDays().map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateChip,
                  selectedDate.toDateString() === date.toDateString() && styles.dateChipSelected,
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text
                  style={[
                    styles.dateDay,
                    selectedDate.toDateString() === date.toDateString() && styles.dateDaySelected,
                  ]}
                >
                  {formatDay(date)}
                </Text>
                <Text
                  style={[
                    styles.dateNumber,
                    selectedDate.toDateString() === date.toDateString() && styles.dateNumberSelected,
                  ]}
                >
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Select Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeGrid}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeChip,
                  selectedTime === time && styles.timeChipSelected,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text
                  style={[
                    styles.timeText,
                    selectedTime === time && styles.timeTextSelected,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Select Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.durationRow}>
            {durations.map((duration) => (
              <TouchableOpacity
                key={duration.value}
                style={[
                  styles.durationChip,
                  selectedDuration === duration.value && styles.durationChipSelected,
                ]}
                onPress={() => setSelectedDuration(duration.value)}
              >
                <Text
                  style={[
                    styles.durationText,
                    selectedDuration === duration.value && styles.durationTextSelected,
                  ]}
                >
                  {duration.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service</Text>
            <Text style={styles.summaryValue}>{provider?.type || 'Consultation'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pet</Text>
            <Text style={styles.summaryValue}>{selectedPet?.name || 'Not selected'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryValue}>
              {selectedDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time</Text>
            <Text style={styles.summaryValue}>{selectedTime || 'Not selected'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{selectedDuration} min</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{provider?.price || '₹500'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.bookButton, booking && styles.bookButtonDisabled]}
          onPress={handleBooking}
          disabled={booking || !selectedPet || !selectedTime}
        >
          {booking ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="calendar-outline" size={22} color={colors.white} />
              <Text style={styles.bookButtonText}>Confirm Booking</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  content: {
    padding: 20,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  providerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  providerName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray[900],
  },
  providerType: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 2,
  },
  providerPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 12,
  },
  noPets: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
  },
  noPetsText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.gray[500],
  },
  petChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  petChipSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  petEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  petName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[700],
  },
  petNameSelected: {
    color: colors.primary,
  },
  dateChip: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 2,
    borderColor: colors.gray[200],
    minWidth: 70,
  },
  dateChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 4,
  },
  dateDaySelected: {
    color: colors.white,
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  dateNumberSelected: {
    color: colors.white,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  timeChipSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  timeTextSelected: {
    color: colors.primary,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  durationChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  durationChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  durationTextSelected: {
    color: colors.white,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.gray[500],
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: colors.gray[100],
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
});
