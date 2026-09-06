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

export default function VetOnboardingScreen() {
  const navigation = useNavigation<any>();
  const { updateUserProfile, completeOnboarding, signOut } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Business info
  const [clinicName, setClinicName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [qualification, setQualification] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');

  // Photos
  const [photos, setPhotos] = useState<string[]>([]);

  // Services
  const [services, setServices] = useState<Service[]>([
    { name: 'Consultation', price: '', duration: '30' },
    { name: 'Vaccination', price: '', duration: '15' },
  ]);

  // Specializations
  const [specializations, setSpecializations] = useState<string[]>([]);
  const specOptions = ['Dogs', 'Cats', 'Birds', 'Exotic Pets', 'Surgery', 'Dental', 'Emergency Care'];

  const [workingDays, setWorkingDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleSpec = (spec: string) => {
    if (specializations.includes(spec)) {
      setSpecializations(specializations.filter(s => s !== spec));
    } else {
      setSpecializations([...specializations, spec]);
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

  const collectProfile = () => ({
    name: doctorName.trim() || undefined,
    phone: phone.trim(),
    businessName: clinicName.trim(),
    bio: description.trim(),
    googleMapsLink: googleMapsLink.trim(),
    image: photos[0] || undefined,
    photos,
    addressLine1: address.trim(),
    services: specializations,
    qualification: qualification.trim(),
    registrationNo: registrationNo.trim(),
    specializations,
    workingDays,
    openTime,
    closeTime,
  });

  const validateStep = (currentStep: number): string | null => {
    if (currentStep === 1) {
      if (!clinicName.trim()) return 'Please enter your clinic name.';
      if (!doctorName.trim()) return 'Please enter the doctor name.';
      if (!phone.trim()) return 'Please enter a contact phone number.';
      if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
        return 'Please enter a valid email address.';
      }
    }
    if (currentStep === 3) {
      for (let i = 0; i < services.length; i++) {
        if (!services[i].name.trim()) return `Please name service ${i + 1} or remove it.`;
        if (!services[i].price.trim() || Number.isNaN(Number(services[i].price))) {
          return `Please enter a valid price for "${services[i].name.trim()}".`;
        }
      }
    }
    return null;
  };

  // Drafts persist across Back/Next AND cold restarts (profile storage
  // survives logout), so killing the app mid-onboarding loses nothing.
  const saveDraft = async () => {
    try {
      await updateUserProfile(collectProfile());
    } catch {
      // best-effort: drafts must never block navigation
    }
  };

  const handleNext = async () => {
    const error = validateStep(step);
    if (error) {
      Alert.alert('Missing details', error);
      return;
    }
    await saveDraft();
    setStep(step + 1);
  };

  const handleBack = async () => {
    await saveDraft();
    setStep(step - 1);
  };

  const resetToMain = () => {
    // Main lives in the parent RootStack, not this nested Onboarding stack —
    // resetting the child navigator would throw/no-op.
    const parent = navigation.getParent();
    const target = { index: 0, routes: [{ name: 'Main' }] } as const;
    if (parent) parent.reset(target);
    else navigation.reset(target);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await updateUserProfile({ ...collectProfile(), onboardingComplete: true });
      await completeOnboarding();
      resetToMain();
    } catch (error) {
      logger.error('Error saving vet profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'Your progress is saved as a draft. You can continue later.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const renderStep1 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Clinic Profile</Text>
      <Text style={styles.stepSubtitle}>Tell pet owners about your veterinary practice</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Clinic Name</Text>
        <TextInput style={styles.input} placeholder="Your clinic name" value={clinicName} onChangeText={setClinicName} placeholderTextColor={colors.gray[400]} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Doctor Name</Text>
        <TextInput style={styles.input} placeholder="Dr. Full Name" value={doctorName} onChangeText={setDoctorName} placeholderTextColor={colors.gray[400]} />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Qualification</Text>
          <TextInput style={styles.input} placeholder="e.g. BVSc, MVSc" value={qualification} onChangeText={setQualification} placeholderTextColor={colors.gray[400]} />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Registration No.</Text>
          <TextInput style={styles.input} placeholder="VCI Reg No." value={registrationNo} onChangeText={setRegistrationNo} placeholderTextColor={colors.gray[400]} />
        </View>
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
        <Text style={styles.label}>About Your Practice</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Describe your services, experience..." value={description} onChangeText={setDescription} multiline numberOfLines={4} placeholderTextColor={colors.gray[400]} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Specializations</Text>
        <View style={styles.optionsRow}>
          {specOptions.map((spec) => (
            <TouchableOpacity key={spec} style={[styles.optionChip, specializations.includes(spec) && styles.optionChipSelected]} onPress={() => toggleSpec(spec)}>
              <Text style={[styles.optionChipText, specializations.includes(spec) && styles.optionChipTextSelected]}>{spec}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Clinic Address</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Full address" value={address} onChangeText={setAddress} multiline numberOfLines={2} placeholderTextColor={colors.gray[400]} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Google Maps Link</Text>
        <TextInput style={styles.input} placeholder="Paste your Google Maps link" value={googleMapsLink} onChangeText={setGoogleMapsLink} placeholderTextColor={colors.gray[400]} />
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Clinic Photos</Text>
      <Text style={styles.stepSubtitle}>Show your clinic! Add up to 12 photos</Text>

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

      <View style={styles.tipCard}>
        <Ionicons name="bulb" size={20} color="#10B981" />
        <Text style={styles.tipText}>Add photos of your clinic, equipment, and consultation rooms!</Text>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Services & Hours</Text>
      <Text style={styles.stepSubtitle}>List your services and working hours</Text>

      {services.map((service, index) => (
        <View key={index} style={styles.serviceCard}>
          <Text style={styles.serviceNumber}>Service {index + 1}</Text>
          <View style={styles.inputGroup}>
            <TextInput style={styles.input} placeholder="Service name" value={service.name} onChangeText={(v) => updateService(index, 'name', v)} placeholderTextColor={colors.gray[400]} />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <TextInput style={styles.input} placeholder="Price ₹" value={service.price} onChangeText={(v) => updateService(index, 'price', v)} keyboardType="numeric" placeholderTextColor={colors.gray[400]} />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <TextInput style={styles.input} placeholder="Duration (mins)" value={service.duration} onChangeText={(v) => updateService(index, 'duration', v)} keyboardType="numeric" placeholderTextColor={colors.gray[400]} />
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addService}>
        <Ionicons name="add-circle" size={24} color="#10B981" />
        <Text style={[styles.addButtonText, { color: '#10B981' }]}>Add Service</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Working Hours</Text>
      <View style={styles.inputGroup}>
        <View style={styles.daysRow}>
          {days.map((day) => (
            <TouchableOpacity key={day} style={[styles.dayChip, workingDays.includes(day) && styles.dayChipSelected]} onPress={() => toggleDay(day)}>
              <Text style={[styles.dayChipText, workingDays.includes(day) && styles.dayChipTextSelected]}>{day}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Open</Text>
          <TextInput style={styles.input} placeholder="09:00" value={openTime} onChangeText={setOpenTime} placeholderTextColor={colors.gray[400]} />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Close</Text>
          <TextInput style={styles.input} placeholder="18:00" value={closeTime} onChangeText={setCloseTime} placeholderTextColor={colors.gray[400]} />
        </View>
      </View>
    </ScrollView>
  );

  const renderStep4 = () => (
    <View style={styles.verificationContainer}>
      <View style={[styles.verificationIcon, { backgroundColor: '#D1FAE5' }]}>
        <Ionicons name="shield-checkmark" size={60} color="#10B981" />
      </View>
      <Text style={styles.stepTitle}>Aadhaar Verification</Text>
      <Text style={styles.verificationText}>Verified vets get more appointments! Build trust with pet owners.</Text>

      <TouchableOpacity style={[styles.verifyButton, { backgroundColor: '#10B981' }]} onPress={() => navigation.navigate('AadhaarVerification')}>
        <Ionicons name="card" size={20} color={colors.white} />
        <Text style={styles.verifyButtonText}>Verify with Aadhaar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleComplete} disabled={isLoading}>
        <Text style={styles.skipButtonText}>{isLoading ? 'Saving…' : 'Skip for now'}</Text>
      </TouchableOpacity>

      <View style={styles.step4Footer}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.linkButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.linkButtonText}>Not you? Sign out</Text>
        </TouchableOpacity>
      </View>
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
            <View style={[styles.progressFill, { width: `${(step / 4) * 100}%`, backgroundColor: '#10B981' }]} />
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
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.nextButton, { backgroundColor: '#10B981' }, step === 1 && { flex: 1 }]} onPress={handleNext}>
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
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.gray[100], borderWidth: 1, borderColor: colors.gray[200] },
  optionChipSelected: { backgroundColor: '#10B981', borderColor: '#10B981' },
  optionChipText: { fontSize: 13, color: colors.gray[600], fontWeight: '500' },
  optionChipTextSelected: { color: colors.white },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  photoSlot: { width: '23%', aspectRatio: 1, borderRadius: 10, backgroundColor: colors.gray[100], borderWidth: 1, borderColor: colors.gray[200], borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  photo: { width: '100%', height: '100%', borderRadius: 10 },
  photoContainer: { width: '100%', height: '100%', position: 'relative' },
  removePhotoButton: { position: 'absolute', top: -6, right: -6, backgroundColor: colors.white, borderRadius: 10 },
  tipCard: { flexDirection: 'row', backgroundColor: '#D1FAE5', borderRadius: 12, padding: 14, alignItems: 'center' },
  tipText: { flex: 1, fontSize: 13, color: '#065F46', marginLeft: 10, lineHeight: 18 },
  serviceCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.gray[100] },
  serviceNumber: { fontSize: 14, fontWeight: '600', color: '#10B981', marginBottom: 12 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginBottom: 24 },
  addButtonText: { fontSize: 15, fontWeight: '600', marginLeft: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 16 },
  daysRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  dayChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.gray[100] },
  dayChipSelected: { backgroundColor: '#10B981' },
  dayChipText: { fontSize: 12, fontWeight: '600', color: colors.gray[600] },
  dayChipTextSelected: { color: colors.white },
  verificationContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  verificationIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  verificationText: { fontSize: 15, color: colors.gray[500], textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  verifyButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, gap: 8, width: '100%' },
  verifyButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  skipButton: { marginTop: 16, paddingVertical: 12 },
  skipButtonText: { fontSize: 15, color: colors.gray[500] },
  step4Footer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 24 },
  linkButtonText: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  footer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 12, borderTopWidth: 1, borderTopColor: colors.gray[100] },
  backButton: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: colors.gray[100] },
  backButtonText: { fontSize: 16, fontWeight: '600', color: colors.gray[700] },
  nextButton: { flex: 2, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  nextButtonText: { fontSize: 16, fontWeight: '600', color: colors.white },
});
