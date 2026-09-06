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

const CAFE_COLOR = '#14B8A6';

export default function CafeOnboardingScreen() {
  const navigation = useNavigation<any>();
  const { user, updateUserProfile, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  // Business info
  const [cafeName, setCafeName] = useState('');
  const [ownerName, setOwnerName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [description, setDescription] = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');

  // Address fields
  const [addressLine1, setAddressLine1] = useState(user?.addressLine1 || '');
  const [addressLine2, setAddressLine2] = useState(user?.addressLine2 || '');
  const [landmark, setLandmark] = useState(user?.landmark || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [city, setCity] = useState(user?.city || '');
  const [state, setState] = useState(user?.state || '');

  // Photos
  const [photos, setPhotos] = useState<string[]>([]);

  // Pet Amenities
  const [petAmenities, setPetAmenities] = useState<string[]>([]);
  const amenityOptions = [
    'Dog-friendly',
    'Cat-friendly',
    'Pet Water Bowls',
    'Pet Treats Available',
    'Pet Play Area',
    'Outdoor Seating',
    'Pet Menu',
    'Air Conditioned',
    'Pet Photography',
    'Pet Products for Sale',
  ];

  // Operating Hours
  const [workingDays, setWorkingDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [openTime, setOpenTime] = useState('10:00 AM');
  const [closeTime, setCloseTime] = useState('10:00 PM');

  // Seating
  const [seatingCapacity, setSeatingCapacity] = useState('');
  const [priceRange, setPriceRange] = useState<'$' | '$$' | '$$$'>('$$');

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

  const toggleAmenity = (amenity: string) => {
    if (petAmenities.includes(amenity)) {
      setPetAmenities(petAmenities.filter(a => a !== amenity));
    } else {
      setPetAmenities([...petAmenities, amenity]);
    }
  };

  const toggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter(d => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

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
      aspect: [16, 9],
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
      await updateUserProfile({
        name: ownerName.trim(),
        phone: phone.trim(),
        businessName: cafeName.trim(),
        bio: description.trim(),
        googleMapsLink: googleMapsLink.trim(),
        image: photos[0] || undefined,
        photos: photos,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        landmark: landmark.trim(),
        pincode: pincode.trim(),
        city: city.trim(),
        state: state.trim(),
        petAmenities: petAmenities,
        workingDays: workingDays,
        openTime: openTime,
        closeTime: closeTime,
        seatingCapacity: parseInt(seatingCapacity, 10) || 0,
        priceRange: priceRange,
        onboardingComplete: true,
      });
      // Main lives in the parent RootStack, not this nested Onboarding stack.
      const parent = navigation.getParent();
      if (parent) {
        parent.reset({ index: 0, routes: [{ name: 'Main' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
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
      <Text style={styles.stepTitle}>Cafe Profile</Text>
      <Text style={styles.stepSubtitle}>Tell pet owners about your cafe</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Cafe/Venue Name</Text>
        <TextInput style={styles.input} placeholder="Your cafe name" value={cafeName} onChangeText={setCafeName} placeholderTextColor={colors.gray[400]} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Owner Name</Text>
        <TextInput style={styles.input} placeholder="Your full name" value={ownerName} onChangeText={setOwnerName} placeholderTextColor={colors.gray[400]} />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={colors.gray[400]} />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholderTextColor={colors.gray[400]} />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>About Your Cafe</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Describe your cafe, ambiance, what makes it special for pet lovers..." value={description} onChangeText={setDescription} multiline numberOfLines={4} placeholderTextColor={colors.gray[400]} />
      </View>

      {/* Address Section */}
      <Text style={styles.sectionTitle}>Cafe Address</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Address Line 1</Text>
        <TextInput style={styles.input} placeholder="Shop No., Building Name" value={addressLine1} onChangeText={setAddressLine1} placeholderTextColor={colors.gray[400]} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Address Line 2</Text>
        <TextInput style={styles.input} placeholder="Street, Area" value={addressLine2} onChangeText={setAddressLine2} placeholderTextColor={colors.gray[400]} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Landmark</Text>
        <TextInput style={styles.input} placeholder="Nearby landmark" value={landmark} onChangeText={setLandmark} placeholderTextColor={colors.gray[400]} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Pincode</Text>
        <View style={styles.pincodeRow}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Enter 6-digit pincode" value={pincode} onChangeText={handlePincodeChange} keyboardType="numeric" maxLength={6} placeholderTextColor={colors.gray[400]} />
          {isPincodeLoading && <ActivityIndicator size="small" color={CAFE_COLOR} style={{ marginLeft: 12 }} />}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>City</Text>
          <TextInput style={[styles.input, city && styles.autoFilledInput]} placeholder="City" value={city} onChangeText={setCity} placeholderTextColor={colors.gray[400]} />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>State</Text>
          <TextInput style={[styles.input, state && styles.autoFilledInput]} placeholder="State" value={state} onChangeText={setState} placeholderTextColor={colors.gray[400]} />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Google Maps Link (Optional)</Text>
        <TextInput style={styles.input} placeholder="Paste your Google Maps link" value={googleMapsLink} onChangeText={setGoogleMapsLink} placeholderTextColor={colors.gray[400]} />
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Cafe Photos</Text>
      <Text style={styles.stepSubtitle}>Showcase your space! Add up to 12 photos</Text>

      <View style={styles.photosGrid}>
        {[...Array(12)].map((_, index) => (
          <TouchableOpacity key={index} style={styles.photoSlot} onPress={() => photos[index] ? handleRemovePhoto(index) : handleAddPhoto()}>
            {photos[index] ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photos[index] }} style={styles.photo} />
                <View style={styles.removePhotoButton}>
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </View>
              </View>
            ) : (
              <Ionicons name="add" size={24} color={colors.gray[400]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.tipCard, { backgroundColor: '#CCFBF1' }]}>
        <Ionicons name="bulb" size={20} color={CAFE_COLOR} />
        <Text style={[styles.tipText, { color: '#115E59' }]}>Add photos of your cafe, pet-friendly areas, and events!</Text>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Pet Amenities & Hours</Text>
      <Text style={styles.stepSubtitle}>What makes your cafe pet-friendly?</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Pet Amenities</Text>
        <View style={styles.optionsRow}>
          {amenityOptions.map((amenity) => (
            <TouchableOpacity key={amenity} style={[styles.optionChip, petAmenities.includes(amenity) && styles.optionChipSelected]} onPress={() => toggleAmenity(amenity)}>
              <Text style={[styles.optionChipText, petAmenities.includes(amenity) && styles.optionChipTextSelected]}>{amenity}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Working Days</Text>
        <View style={styles.daysRow}>
          {dayOptions.map((day) => (
            <TouchableOpacity key={day} style={[styles.dayChip, workingDays.includes(day) && styles.dayChipSelected]} onPress={() => toggleDay(day)}>
              <Text style={[styles.dayChipText, workingDays.includes(day) && styles.dayChipTextSelected]}>{day}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Opens At</Text>
          <TextInput style={styles.input} placeholder="10:00 AM" value={openTime} onChangeText={setOpenTime} placeholderTextColor={colors.gray[400]} />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Closes At</Text>
          <TextInput style={styles.input} placeholder="10:00 PM" value={closeTime} onChangeText={setCloseTime} placeholderTextColor={colors.gray[400]} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Seating Capacity</Text>
          <TextInput style={styles.input} placeholder="50" value={seatingCapacity} onChangeText={setSeatingCapacity} keyboardType="numeric" placeholderTextColor={colors.gray[400]} />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Price Range</Text>
          <View style={styles.priceRow}>
            {(['$', '$$', '$$$'] as const).map((price) => (
              <TouchableOpacity key={price} style={[styles.priceChip, priceRange === price && styles.priceChipSelected]} onPress={() => setPriceRange(price)}>
                <Text style={[styles.priceChipText, priceRange === price && styles.priceChipTextSelected]}>{price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: '#CCFBF1' }]}>
        <Ionicons name="calendar" size={24} color={CAFE_COLOR} />
        <View style={styles.infoCardContent}>
          <Text style={[styles.infoCardTitle, { color: '#115E59' }]}>Create Events Later</Text>
          <Text style={[styles.infoCardText, { color: '#134E4A' }]}>After setup, you can create pet events, manage bookings, and grow your community!</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderStep4 = () => (
    <View style={styles.verificationContainer}>
      <View style={[styles.verificationIcon, { backgroundColor: '#CCFBF1' }]}>
        <Ionicons name="shield-checkmark" size={60} color={CAFE_COLOR} />
      </View>
      <Text style={styles.stepTitle}>Aadhaar Verification</Text>
      <Text style={styles.verificationText}>Verified cafes get more bookings! Build trust with pet owners.</Text>

      <TouchableOpacity style={[styles.verifyButton, { backgroundColor: CAFE_COLOR }]} onPress={() => navigation.navigate('AadhaarVerification')}>
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
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 4) * 100}%`, backgroundColor: CAFE_COLOR }]} />
          </View>
          <Text style={styles.progressText}>Step {step} of 4</Text>
        </View>

        <View style={styles.content}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </View>

        {step < 4 && (
          <View style={styles.footer}>
            {step > 1 && (
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.nextButton, { backgroundColor: CAFE_COLOR }, step === 1 && { flex: 1 }]} onPress={() => setStep(step + 1)}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  progressContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  progressBar: { height: 4, backgroundColor: colors.gray[200], borderRadius: 2, marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 12, color: colors.gray[500], textAlign: 'right' },
  content: { flex: 1, paddingHorizontal: 20 },
  stepTitle: { fontSize: 28, fontWeight: 'bold', color: colors.gray[900], marginTop: 16, marginBottom: 8 },
  stepSubtitle: { fontSize: 15, color: colors.gray[500], marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.gray[700], marginBottom: 8 },
  input: { backgroundColor: colors.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.gray[900], borderWidth: 1, borderColor: colors.gray[200] },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  pincodeRow: { flexDirection: 'row', alignItems: 'center' },
  autoFilledInput: { backgroundColor: '#CCFBF1', borderColor: '#5EEAD4' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 16, marginTop: 8 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.gray[100], borderWidth: 1, borderColor: colors.gray[200] },
  optionChipSelected: { backgroundColor: CAFE_COLOR, borderColor: CAFE_COLOR },
  optionChipText: { fontSize: 13, color: colors.gray[600], fontWeight: '500' },
  optionChipTextSelected: { color: colors.white },
  daysRow: { flexDirection: 'row', gap: 8 },
  dayChip: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gray[100], borderWidth: 1, borderColor: colors.gray[200], justifyContent: 'center', alignItems: 'center' },
  dayChipSelected: { backgroundColor: CAFE_COLOR, borderColor: CAFE_COLOR },
  dayChipText: { fontSize: 12, color: colors.gray[600], fontWeight: '600' },
  dayChipTextSelected: { color: colors.white },
  priceRow: { flexDirection: 'row', gap: 8 },
  priceChip: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: colors.gray[100], borderWidth: 1, borderColor: colors.gray[200], alignItems: 'center' },
  priceChipSelected: { backgroundColor: CAFE_COLOR, borderColor: CAFE_COLOR },
  priceChipText: { fontSize: 14, color: colors.gray[600], fontWeight: '600' },
  priceChipTextSelected: { color: colors.white },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  photoSlot: { width: '23%', aspectRatio: 1, borderRadius: 10, backgroundColor: colors.gray[100], borderWidth: 1, borderColor: colors.gray[200], borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  photo: { width: '100%', height: '100%', borderRadius: 10 },
  photoContainer: { width: '100%', height: '100%', position: 'relative' },
  removePhotoButton: { position: 'absolute', top: -6, right: -6, backgroundColor: colors.white, borderRadius: 10 },
  tipCard: { flexDirection: 'row', borderRadius: 12, padding: 14, alignItems: 'center' },
  tipText: { flex: 1, fontSize: 13, marginLeft: 10, lineHeight: 18 },
  infoCard: { flexDirection: 'row', borderRadius: 12, padding: 16, marginTop: 8 },
  infoCardContent: { flex: 1, marginLeft: 12 },
  infoCardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  infoCardText: { fontSize: 13, lineHeight: 18 },
  verificationContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  verificationIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  verificationText: { fontSize: 15, color: colors.gray[500], textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  verifyButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, gap: 8, width: '100%' },
  verifyButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  skipButton: { marginTop: 16, paddingVertical: 12 },
  skipButtonText: { fontSize: 15, color: colors.gray[500] },
  footer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 12, borderTopWidth: 1, borderTopColor: colors.gray[100] },
  backButton: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: colors.gray[100] },
  backButtonText: { fontSize: 16, fontWeight: '600', color: colors.gray[700] },
  nextButton: { flex: 2, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  nextButtonText: { fontSize: 16, fontWeight: '600', color: colors.white },
});
