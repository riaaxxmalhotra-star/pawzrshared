import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../lib/auth';
import { colors } from '../../theme/colors';
import logger from '../../lib/logger';

interface Service {
  name: string;
  price: string;
  duration: string;
}

export default function GroomerOnboardingScreen() {
  const navigation = useNavigation<any>();
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Business info
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');

  // Location
  const [address, setAddress] = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');

  // Store photos (up to 12)
  const [photos, setPhotos] = useState<string[]>([]);

  // Services
  const [services, setServices] = useState<Service[]>([
    { name: 'Basic Grooming', price: '', duration: '60' },
    { name: 'Full Grooming', price: '', duration: '90' },
  ]);

  // Working hours
  const [workingDays, setWorkingDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleAddPhoto = async () => {
    if (photos.length >= 12) {
      Alert.alert('Limit Reached', 'You can only add up to 12 photos');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const addService = () => {
    setServices([...services, { name: '', price: '', duration: '30' }]);
  };

  const updateService = (index: number, field: keyof Service, value: string) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const toggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter(d => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await completeOnboarding();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      logger.error('Error saving profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Business Profile</Text>
      <Text style={styles.stepSubtitle}>Tell pet owners about your grooming business</Text>

      {/* Business Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your salon/shop name"
          value={businessName}
          onChangeText={setBusinessName}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Owner Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Owner Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your full name"
          value={ownerName}
          onChangeText={setOwnerName}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Contact */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={colors.gray[400]}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholderTextColor={colors.gray[400]}
          />
        </View>
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>About Your Business</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your services, specialties, experience..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Address */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Address</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Full address"
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={2}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Google Maps Link */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Google Maps Link</Text>
        <TextInput
          style={styles.input}
          placeholder="Paste your Google Maps link"
          value={googleMapsLink}
          onChangeText={setGoogleMapsLink}
          placeholderTextColor={colors.gray[400]}
        />
        <Text style={styles.hint}>
          Share your location link from Google Maps for easy navigation
        </Text>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Store Photos</Text>
      <Text style={styles.stepSubtitle}>Show off your salon! Add up to 12 photos</Text>

      {/* Photos Grid */}
      <View style={styles.photosGrid}>
        {[...Array(12)].map((_, index) => (
          <TouchableOpacity
            key={index}
            style={styles.photoSlot}
            onPress={() => photos[index] ? handleRemovePhoto(index) : handleAddPhoto()}
          >
            {photos[index] ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photos[index] }} style={styles.photo} />
                <View style={styles.removePhotoButton}>
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </View>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="add" size={24} color={colors.gray[400]} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tipCard}>
        <Ionicons name="bulb" size={20} color="#8B5CF6" />
        <Text style={styles.tipText}>
          Add photos of your salon, equipment, and happy pets after grooming!
        </Text>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Services & Pricing</Text>
      <Text style={styles.stepSubtitle}>List your services and prices</Text>

      {services.map((service, index) => (
        <View key={index} style={styles.serviceCard}>
          <View style={styles.serviceHeader}>
            <Text style={styles.serviceNumber}>Service {index + 1}</Text>
            {index > 1 && (
              <TouchableOpacity onPress={() => removeService(index)}>
                <Ionicons name="close-circle" size={24} color={colors.gray[400]} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Service Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Full Grooming, Bath & Brush"
              value={service.name}
              onChangeText={(v) => updateService(index, 'name', v)}
              placeholderTextColor={colors.gray[400]}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Price (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="500"
                value={service.price}
                onChangeText={(v) => updateService(index, 'price', v)}
                keyboardType="numeric"
                placeholderTextColor={colors.gray[400]}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Duration (mins)</Text>
              <TextInput
                style={styles.input}
                placeholder="60"
                value={service.duration}
                onChangeText={(v) => updateService(index, 'duration', v)}
                keyboardType="numeric"
                placeholderTextColor={colors.gray[400]}
              />
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addService}>
        <Ionicons name="add-circle" size={24} color="#8B5CF6" />
        <Text style={[styles.addButtonText, { color: '#8B5CF6' }]}>Add Service</Text>
      </TouchableOpacity>

      {/* Working Hours */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Working Hours</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Working Days</Text>
        <View style={styles.daysRow}>
          {days.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayChip,
                workingDays.includes(day) && styles.dayChipSelected,
              ]}
              onPress={() => toggleDay(day)}
            >
              <Text
                style={[
                  styles.dayChipText,
                  workingDays.includes(day) && styles.dayChipTextSelected,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Open Time</Text>
          <TextInput
            style={styles.input}
            placeholder="09:00"
            value={openTime}
            onChangeText={setOpenTime}
            placeholderTextColor={colors.gray[400]}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Close Time</Text>
          <TextInput
            style={styles.input}
            placeholder="18:00"
            value={closeTime}
            onChangeText={setCloseTime}
            placeholderTextColor={colors.gray[400]}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderStep4 = () => (
    <View style={styles.verificationContainer}>
      <View style={[styles.verificationIcon, { backgroundColor: '#F3E8FF' }]}>
        <Ionicons name="shield-checkmark" size={60} color="#8B5CF6" />
      </View>
      <Text style={styles.stepTitle}>Aadhaar Verification</Text>
      <Text style={styles.verificationText}>
        Verified businesses get more bookings! Show pet owners they can trust you.
      </Text>

      <TouchableOpacity
        style={[styles.verifyButton, { backgroundColor: '#8B5CF6' }]}
        onPress={() => navigation.navigate('AadhaarVerification')}
      >
        <Ionicons name="card" size={20} color={colors.white} />
        <Text style={styles.verifyButtonText}>Verify with Aadhaar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleComplete}>
        <Text style={styles.skipButtonText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 4) * 100}%`, backgroundColor: '#8B5CF6' }]} />
          </View>
          <Text style={styles.progressText}>Step {step} of 4</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </View>

        {/* Footer */}
        {step < 4 && (
          <View style={styles.footer}>
            {step > 1 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep(step - 1)}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: '#8B5CF6' }, step === 1 && { flex: 1 }]}
              onPress={() => setStep(step + 1)}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: colors.gray[500],
    textAlign: 'right',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginTop: 16,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: colors.gray[500],
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.gray[900],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  hint: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 6,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  photoSlot: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  photoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.white,
    borderRadius: 10,
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#6B21A8',
    marginLeft: 10,
    lineHeight: 18,
  },
  serviceCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 24,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },
  dayChipSelected: {
    backgroundColor: '#8B5CF6',
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[600],
  },
  dayChipTextSelected: {
    color: colors.white,
  },
  verificationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  verificationIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  verificationText: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  verifyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 15,
    color: colors.gray[500],
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.gray[100],
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  nextButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
