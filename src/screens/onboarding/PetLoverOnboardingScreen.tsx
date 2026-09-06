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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../lib/auth';
import { colors } from '../../theme/colors';
import PromptSelector from '../../components/PromptSelector';
import logger from '../../lib/logger';

interface SelectedPrompt {
  promptId: string;
  prompt: string;
  answer: string;
}

export default function PetLoverOnboardingScreen() {
  const navigation = useNavigation<any>();
  const { user, updateUserProfile, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  // Profile info
  const [photos, setPhotos] = useState<string[]>([]);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [dob, setDob] = useState('');

  // Address fields
  const [addressLine1, setAddressLine1] = useState(user?.addressLine1 || '');
  const [addressLine2, setAddressLine2] = useState(user?.addressLine2 || '');
  const [landmark, setLandmark] = useState(user?.landmark || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [city, setCity] = useState(user?.city || '');
  const [state, setState] = useState(user?.state || '');

  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(2000, 0, 1));

  // Preferences
  const [preferredPets, setPreferredPets] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [experience, setExperience] = useState('');

  // Prompts
  const [selectedPrompts, setSelectedPrompts] = useState<SelectedPrompt[]>([]);
  const [practicalAnswers, setPracticalAnswers] = useState<{ [key: string]: string }>({});

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      setDob(formattedDate);
    }
  };

  const calculateAge = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length !== 3) return '';
    const birthDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} years old`;
  };

  // Auto-fill city and state from pincode
  const handlePincodeChange = async (value: string) => {
    setPincode(value);
    if (value.length === 6) {
      setIsPincodeLoading(true);
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${value}`);
        const data = await response.json();
        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const postOffice = data[0].PostOffice[0];
          setCity(postOffice.District || '');
          setState(postOffice.State || '');
        }
      } catch (error) {
        logger.log('Pincode lookup failed:', error);
      } finally {
        setIsPincodeLoading(false);
      }
    }
  };

  const petTypes = ['Dogs', 'Cats', 'Birds', 'Fish', 'Rabbits', 'All Pets'];
  const serviceTypes = ['Dog Walking', 'Pet Sitting', 'Overnight Care', 'Pet Meetups', 'Volunteering'];
  const availabilityOptions = ['Weekdays', 'Weekends', 'Mornings', 'Afternoons', 'Evenings'];

  const toggleArrayItem = (arr: string[], item: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (arr.includes(item)) {
      setter(arr.filter(i => i !== item));
    } else {
      setter([...arr, item]);
    }
  };

  const handleAddPhoto = async () => {
    if (photos.length >= 6) {
      Alert.alert('Limit Reached', 'You can only add up to 6 photos');
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

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Save all profile data
      await updateUserProfile({
        name: name.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        image: photos[0] || undefined,
        dob: dob,
        photos: photos, // All 6 photos for pet lover
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        landmark: landmark.trim(),
        pincode: pincode.trim(),
        city: city.trim(),
        state: state.trim(),
        preferredPets: preferredPets,
        services: services,
        availability: availability,
        experience: experience.trim(),
        prompts: selectedPrompts,
        practicalAnswers: practicalAnswers,
        onboardingComplete: true,
      });
      // Main lives in the parent RootStack, not this nested Onboarding stack.
      const parent = navigation.getParent();
      if (parent) {
        parent.reset({ index: 0, routes: [{ name: 'Main' }] });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }
    } catch (error) {
      logger.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Your Profile</Text>
      <Text style={styles.stepSubtitle}>Show pets who you are! Add up to 6 photos</Text>

      {/* Photos Grid */}
      <View style={styles.photosGrid}>
        {[...Array(6)].map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.photoSlot, index === 0 && styles.mainPhotoSlot]}
            onPress={() => photos[index] ? handleRemovePhoto(index) : handleAddPhoto()}
          >
            {photos[index] ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photos[index] }} style={styles.photo} />
                <View style={styles.removePhotoButton}>
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                </View>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="add" size={index === 0 ? 32 : 24} color={colors.gray[400]} />
                {index === 0 && <Text style={styles.mainPhotoText}>Main Photo</Text>}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Phone */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Date of Birth */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date of Birth</Text>
        <TouchableOpacity
          style={styles.datePickerBtn}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.gray[500]} />
          <Text style={[styles.datePickerText, dob && { color: colors.gray[900] }]}>
            {dob || 'Select your date of birth'}
          </Text>
          {dob && <Text style={styles.ageText}>{calculateAge(dob)}</Text>}
        </TouchableOpacity>
      </View>

      {/* Bio */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>About You</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell pets and their owners about yourself..."
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Address Section */}
      <Text style={styles.sectionLabel}>Address</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Address Line 1</Text>
        <TextInput
          style={styles.input}
          placeholder="House/Flat No., Building Name"
          value={addressLine1}
          onChangeText={setAddressLine1}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Address Line 2</Text>
        <TextInput
          style={styles.input}
          placeholder="Street, Area"
          value={addressLine2}
          onChangeText={setAddressLine2}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Landmark</Text>
        <TextInput
          style={styles.input}
          placeholder="Nearby landmark"
          value={landmark}
          onChangeText={setLandmark}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Pincode</Text>
        <View style={styles.pincodeRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Enter 6-digit pincode"
            value={pincode}
            onChangeText={handlePincodeChange}
            keyboardType="numeric"
            maxLength={6}
            placeholderTextColor={colors.gray[400]}
          />
          {isPincodeLoading && (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 12 }} />
          )}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={[styles.input, city && styles.autoFilledInput]}
            placeholder="City"
            value={city}
            onChangeText={setCity}
            placeholderTextColor={colors.gray[400]}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>State</Text>
          <TextInput
            style={[styles.input, state && styles.autoFilledInput]}
            placeholder="State"
            value={state}
            onChangeText={setState}
            placeholderTextColor={colors.gray[400]}
          />
        </View>
      </View>

      {/* Date Picker Modal for iOS */}
      {Platform.OS === 'ios' && (
        <Modal visible={showDatePicker} transparent animationType="slide">
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerContent}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1950, 0, 1)}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android Date Picker */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1950, 0, 1)}
        />
      )}
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Your Preferences</Text>
      <Text style={styles.stepSubtitle}>What pets do you love and how can you help?</Text>

      {/* Preferred Pets */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Preferred Pets</Text>
        <View style={styles.optionsRow}>
          {petTypes.map((pet) => (
            <TouchableOpacity
              key={pet}
              style={[
                styles.optionChip,
                preferredPets.includes(pet) && styles.optionChipSelected,
              ]}
              onPress={() => toggleArrayItem(preferredPets, pet, setPreferredPets)}
            >
              <Text
                style={[
                  styles.optionChipText,
                  preferredPets.includes(pet) && styles.optionChipTextSelected,
                ]}
              >
                {pet}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Services */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Services You Can Offer</Text>
        <View style={styles.optionsRow}>
          {serviceTypes.map((service) => (
            <TouchableOpacity
              key={service}
              style={[
                styles.optionChip,
                services.includes(service) && styles.optionChipSelected,
              ]}
              onPress={() => toggleArrayItem(services, service, setServices)}
            >
              <Text
                style={[
                  styles.optionChipText,
                  services.includes(service) && styles.optionChipTextSelected,
                ]}
              >
                {service}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Availability */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Availability</Text>
        <View style={styles.optionsRow}>
          {availabilityOptions.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.optionChip,
                availability.includes(time) && styles.optionChipSelected,
              ]}
              onPress={() => toggleArrayItem(availability, time, setAvailability)}
            >
              <Text
                style={[
                  styles.optionChipText,
                  availability.includes(time) && styles.optionChipTextSelected,
                ]}
              >
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Experience */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Experience with Pets</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your experience with pets..."
          value={experience}
          onChangeText={setExperience}
          multiline
          numberOfLines={3}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="heart" size={24} color="{colors.primary}" />
        <View style={styles.infoCardContent}>
          <Text style={styles.infoCardTitle}>Match with Pets!</Text>
          <Text style={styles.infoCardText}>
            After setup, you can swipe to match with nearby pets, join meetups, and volunteer!
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Add Personality</Text>
      <Text style={styles.stepSubtitle}>Let pet owners know more about you</Text>

      <PromptSelector
        role="LOVER"
        selectedPrompts={selectedPrompts}
        practicalAnswers={practicalAnswers}
        onPromptsChange={setSelectedPrompts}
        onPracticalAnswersChange={setPracticalAnswers}
      />
    </ScrollView>
  );

  const renderStep4 = () => (
    <View style={styles.verificationContainer}>
      <View style={styles.verificationIcon}>
        <Ionicons name="shield-checkmark" size={60} color={colors.primary} />
      </View>
      <Text style={styles.stepTitle}>Aadhaar Verification</Text>
      <Text style={styles.verificationText}>
        Build trust with pet owners! Verified profiles get more matches and opportunities.
        This step is optional but highly recommended.
      </Text>

      <TouchableOpacity
        style={[styles.verifyButton, { backgroundColor: colors.primary }]}
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
            <View style={[styles.progressFill, { width: `${(step / 4) * 100}%`, backgroundColor: colors.primary }]} />
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
              style={[styles.nextButton, { backgroundColor: colors.primary }, step === 1 && { flex: 1 }]}
              onPress={() => setStep(step + 1)}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.nextButtonText}>Next</Text>
              )}
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
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  photoSlot: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  mainPhotoSlot: {
    width: '48%',
    aspectRatio: 0.8,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainPhotoText: {
    fontSize: 11,
    color: colors.gray[400],
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 20,
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
    height: 100,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginTop: 8,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  pincodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoFilledInput: {
    backgroundColor: '#E8F5E9',
    borderColor: '#81C784',
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 10,
  },
  datePickerText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[400],
  },
  ageText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  datePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  datePickerContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  datePickerCancel: {
    fontSize: 16,
    color: colors.gray[500],
  },
  datePickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  optionChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionChipText: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '500',
  },
  optionChipTextSelected: {
    color: colors.white,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  infoCardContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  infoCardText: {
    fontSize: 13,
    color: colors.primaryDark,
    lineHeight: 18,
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
    backgroundColor: colors.secondary,
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
