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

interface ScheduleWalkModalProps {
  visible: boolean;
  onClose: () => void;
  onSchedule: (data: WalkScheduleData) => void;
  petName?: string;
  recipientName: string;
}

export interface WalkScheduleData {
  date: Date;
  time: Date;
  duration: number;
  location: string;
  notes: string;
}

const DURATION_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
];

export default function ScheduleWalkModal({
  visible,
  onClose,
  onSchedule,
  petName,
  recipientName,
}: ScheduleWalkModalProps) {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSchedule = () => {
    if (!location.trim()) {
      return;
    }

    onSchedule({
      date,
      time,
      duration,
      location: location.trim(),
      notes: notes.trim(),
    });

    // Reset form
    setDate(new Date());
    setTime(new Date());
    setDuration(60);
    setLocation('');
    setNotes('');
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (t: Date) => {
    return t.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close schedule walk dialog">
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
            <Text style={styles.title}>Schedule a Walk</Text>
            <View style={styles.closeBtn} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Pet & Person Info */}
            <View style={styles.infoCard}>
              <Ionicons name="paw" size={24} color={colors.primary} />
              <Text style={styles.infoText}>
                Walk {petName ? `for ${petName}` : ''} with {recipientName}
              </Text>
            </View>

            {/* Date Picker */}
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={styles.pickerText}>{formatDate(date)}</Text>
              <Ionicons name="chevron-down" size={20} color={colors.gray[400]} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            {/* Time Picker */}
            <Text style={styles.label}>Time</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.pickerText}>{formatTime(time)}</Text>
              <Ionicons name="chevron-down" size={20} color={colors.gray[400]} />
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}

            {/* Duration */}
            <Text style={styles.label}>Duration</Text>
            <View style={styles.durationContainer}>
              {DURATION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.durationOption,
                    duration === option.value && styles.durationOptionSelected,
                  ]}
                  onPress={() => setDuration(option.value)}
                >
                  <Text
                    style={[
                      styles.durationText,
                      duration === option.value && styles.durationTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Location */}
            <Text style={styles.label}>Pickup Location *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color={colors.gray[400]} />
              <TextInput
                style={styles.input}
                placeholder="Enter address or landmark"
                placeholderTextColor={colors.gray[400]}
                value={location}
                onChangeText={setLocation}
              />
            </View>

            {/* Notes */}
            <Text style={styles.label}>Special Instructions (Optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Any special instructions for the walk..."
              placeholderTextColor={colors.gray[400]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scheduleBtn, !location.trim() && styles.scheduleBtnDisabled]}
              onPress={handleSchedule}
              disabled={!location.trim()}
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
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: colors.gray[900],
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  durationOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  durationOptionSelected: {
    backgroundColor: colors.primary,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[600],
  },
  durationTextSelected: {
    color: colors.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.gray[900],
  },
  notesInput: {
    backgroundColor: colors.gray[50],
    padding: 14,
    borderRadius: 12,
    minHeight: 80,
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
