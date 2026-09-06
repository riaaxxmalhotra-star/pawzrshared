import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../../theme/colors';

interface ScheduleHostingModalProps {
  visible: boolean;
  onClose: () => void;
  onSchedule: (data: HostingScheduleData) => void;
  petName?: string;
  recipientName: string;
}

export interface HostingScheduleData {
  checkIn: Date;
  checkOut: Date;
  specialInstructions: string;
  feedingSchedule: string;
  emergencyContact: string;
}

export default function ScheduleHostingModal({
  visible,
  onClose,
  onSchedule,
  petName,
  recipientName,
}: ScheduleHostingModalProps) {
  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [feedingSchedule, setFeedingSchedule] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);

  const handleSchedule = () => {
    if (checkOut <= checkIn) {
      return;
    }

    onSchedule({
      checkIn,
      checkOut,
      specialInstructions: specialInstructions.trim(),
      feedingSchedule: feedingSchedule.trim(),
      emergencyContact: emergencyContact.trim(),
    });

    // Reset form
    setCheckIn(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setCheckOut(tomorrow);
    setSpecialInstructions('');
    setFeedingSchedule('');
    setEmergencyContact('');
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateNights = () => {
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const onCheckInChange = (event: any, selectedDate?: Date) => {
    setShowCheckInPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setCheckIn(selectedDate);
      // Ensure checkout is after checkin
      if (selectedDate >= checkOut) {
        const newCheckOut = new Date(selectedDate);
        newCheckOut.setDate(newCheckOut.getDate() + 1);
        setCheckOut(newCheckOut);
      }
    }
  };

  const onCheckOutChange = (event: any, selectedDate?: Date) => {
    setShowCheckOutPicker(Platform.OS === 'ios');
    if (selectedDate && selectedDate > checkIn) {
      setCheckOut(selectedDate);
    }
  };

  const nights = calculateNights();
  const isValid = nights > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close schedule hosting dialog">
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
            <Text style={styles.title}>Schedule Hosting</Text>
            <View style={styles.closeBtn} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Pet & Person Info */}
            <View style={styles.infoCard}>
              <Ionicons name="home" size={24} color={colors.primary} />
              <Text style={styles.infoText}>
                Hosting {petName ? petName : 'pet'} with {recipientName}
              </Text>
            </View>

            {/* Date Range */}
            <View style={styles.dateRangeContainer}>
              {/* Check-in */}
              <View style={styles.dateColumn}>
                <Text style={styles.label}>Check-in</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowCheckInPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <Text style={styles.dateText}>{formatDate(checkIn)}</Text>
                </TouchableOpacity>
              </View>

              {/* Arrow */}
              <View style={styles.arrowContainer}>
                <Ionicons name="arrow-forward" size={20} color={colors.gray[400]} />
              </View>

              {/* Check-out */}
              <View style={styles.dateColumn}>
                <Text style={styles.label}>Check-out</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowCheckOutPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <Text style={styles.dateText}>{formatDate(checkOut)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {showCheckInPicker && (
              <DateTimePicker
                value={checkIn}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onCheckInChange}
                minimumDate={new Date()}
              />
            )}

            {showCheckOutPicker && (
              <DateTimePicker
                value={checkOut}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onCheckOutChange}
                minimumDate={new Date(checkIn.getTime() + 86400000)}
              />
            )}

            {/* Duration Summary */}
            <View style={styles.summaryCard}>
              <Ionicons name="moon-outline" size={20} color={colors.primary} />
              <Text style={styles.summaryText}>
                {nights} {nights === 1 ? 'night' : 'nights'}
              </Text>
            </View>

            {/* Feeding Schedule */}
            <Text style={styles.label}>Feeding Schedule</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="e.g., Breakfast at 8am, Dinner at 6pm, 1 cup of kibble each meal..."
              placeholderTextColor={colors.gray[400]}
              value={feedingSchedule}
              onChangeText={setFeedingSchedule}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Special Instructions */}
            <Text style={styles.label}>Special Instructions</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Any medications, allergies, behavioral notes, favorite toys..."
              placeholderTextColor={colors.gray[400]}
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Emergency Contact */}
            <Text style={styles.label}>Emergency Contact</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={colors.gray[400]} />
              <TextInput
                style={styles.inputField}
                placeholder="Phone number for emergencies"
                placeholderTextColor={colors.gray[400]}
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                keyboardType="phone-pad"
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scheduleBtn, !isValid && styles.scheduleBtnDisabled]}
              onPress={handleSchedule}
              disabled={!isValid}
            >
              <Ionicons name="send" size={18} color={colors.white} />
              <Text style={styles.scheduleBtnText}>Send Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  content: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[700],
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
    marginTop: 16,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  dateColumn: {
    flex: 1,
  },
  arrowContainer: {
    paddingBottom: 14,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: colors.gray[900],
    fontWeight: '500',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}10`,
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: colors.gray[900],
  },
  input: {
    backgroundColor: colors.gray[50],
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    color: colors.gray[900],
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[600],
  },
  scheduleBtn: {
    flex: 2,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scheduleBtnDisabled: {
    opacity: 0.5,
  },
  scheduleBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
