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
import PromptSelector from '../../components/PromptSelector';
import logger from '../../lib/logger';

interface SelectedPrompt {
  promptId: string;
  prompt: string;
  answer: string;
}

interface PetInfo {
  name: string;
  species: string;
  breed: string;
  age: string;
  birthday: string;
  gender: string;
  vaccinated: boolean;
  photos: string[];
}

export default function PetOwnerOnboardingScreen() {
  const navigation = useNavigation<any>();
  const { user, completeOnboarding, updateUserProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Profile info - pre-fill from user data
  const [photos, setPhotos] = useState<string[]>([]);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Prompts
  const [selectedPrompts, setSelectedPrompts] = useState<SelectedPrompt[]>([]);
  const [practicalAnswers, setPracticalAnswers] = useState<{ [key: string]: string }>({});
  const [addressLine1, setAddressLine1] = useState(user?.addressLine1 || '');
  const [addressLine2, setAddressLine2] = useState(user?.addressLine2 || '');
  const [landmark, setLandmark] = useState(user?.landmark || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [city, setCity] = useState(user?.city || '');
  const [state, setState] = useState(user?.state || '');

  // Pet info
  const [pets, setPets] = useState<PetInfo[]>([
    { name: '', species: 'Dog', breed: '', age: '', birthday: '', gender: 'Male', vaccinated: false, photos: [] },
  ]);

  const speciesOptions = ['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Other'];
  const genderOptions = ['Male', 'Female'];

  const handleAddPet = () => {
    setPets([
      ...pets,
      { name: '', species: 'Dog', breed: '', age: '', birthday: '', gender: 'Male', vaccinated: false, photos: [] },
    ]);
  };

  // Auto-fill city and state from pincode
  const handlePincodeChange = async (value: string) => {
    setPincode(value);
    if (value.length === 6) {
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
      }
    }
  };

  const updatePet = (index: number, field: keyof PetInfo, value: any) => {
    const updated = [...pets];
    updated[index] = { ...updated[index], [field]: value };
    setPets(updated);
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

  const handleAddPetPhoto = async (petIndex: number) => {
    if (pets[petIndex].photos.length >= 6) {
      Alert.alert('Limit Reached', 'You can only add up to 6 photos per pet');
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
      const updated = [...pets];
      updated[petIndex].photos = [...updated[petIndex].photos, result.assets[0].uri];
      setPets(updated);
    }
  };

  const handleRemovePetPhoto = (petIndex: number, photoIndex: number) => {
    const updated = [...pets];
    updated[petIndex].photos = updated[petIndex].photos.filter((_, i) => i !== photoIndex);
    setPets(updated);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Save all profile and pet data
      const petsWithIds = pets.filter(p => p.name).map((pet, index) => ({
        ...pet,
        id: `pet_${Date.now()}_${index}`,
      }));

      await updateUserProfile({
        name,
        image: photos[0] || undefined,
        photos: photos,
        phone,
        addressLine1,
        addressLine2,
        landmark,
        pincode,
        city,
        state,
        pets: petsWithIds,
        prompts: selectedPrompts,
        practicalAnswers: practicalAnswers,
        onboardingComplete: true,
      });

      // Navigate to main app (Main lives in the parent RootStack, not this
      // nested Onboarding stack — resetting the child navigator would throw).
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
      <Text style={styles.stepSubtitle}>Add up to 6 photos to show yourself</Text>

      {/* Photos Grid - like Bumble */}
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

      {/* Address Line 1 */}
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

      {/* Address Line 2 */}
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

      {/* Landmark */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Landmark</Text>
        <TextInput
          style={styles.input}
          placeholder="Near landmark (optional)"
          value={landmark}
          onChangeText={setLandmark}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Pincode, City, State */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Pincode</Text>
          <TextInput
            style={styles.input}
            placeholder="6 digits"
            value={pincode}
            onChangeText={handlePincodeChange}
            keyboardType="number-pad"
            maxLength={6}
            placeholderTextColor={colors.gray[400]}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={[styles.input, city ? styles.inputFilled : null]}
            placeholder="Auto-filled"
            value={city}
            onChangeText={setCity}
            placeholderTextColor={colors.gray[400]}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>State</Text>
        <TextInput
          style={[styles.input, state ? styles.inputFilled : null]}
          placeholder="Auto-filled from pincode"
          value={state}
          onChangeText={setState}
          placeholderTextColor={colors.gray[400]}
        />
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Your Pets</Text>
      <Text style={styles.stepSubtitle}>Add your furry friends</Text>

      {pets.map((pet, index) => (
        <View key={index} style={styles.petCard}>
          <Text style={styles.petCardTitle}>Pet {index + 1}</Text>

          {/* Pet Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pet Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter pet name"
              value={pet.name}
              onChangeText={(v) => updatePet(index, 'name', v)}
              placeholderTextColor={colors.gray[400]}
            />
          </View>

          {/* Species */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Species</Text>
            <View style={styles.optionsRow}>
              {speciesOptions.map((species) => (
                <TouchableOpacity
                  key={species}
                  style={[
                    styles.optionChip,
                    pet.species === species && styles.optionChipSelected,
                  ]}
                  onPress={() => updatePet(index, 'species', species)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      pet.species === species && styles.optionChipTextSelected,
                    ]}
                  >
                    {species}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Breed */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Breed</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter breed"
              value={pet.breed}
              onChangeText={(v) => updatePet(index, 'breed', v)}
              placeholderTextColor={colors.gray[400]}
            />
          </View>

          {/* Age & Gender */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2 years"
                value={pet.age}
                onChangeText={(v) => updatePet(index, 'age', v)}
                placeholderTextColor={colors.gray[400]}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.optionsRow}>
                {genderOptions.map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.optionChip,
                      pet.gender === gender && styles.optionChipSelected,
                    ]}
                    onPress={() => updatePet(index, 'gender', gender)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        pet.gender === gender && styles.optionChipTextSelected,
                      ]}
                    >
                      {gender}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Birthday (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Birthday (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY"
              value={pet.birthday}
              onChangeText={(v) => updatePet(index, 'birthday', v)}
              placeholderTextColor={colors.gray[400]}
            />
          </View>

          {/* Vaccination */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => updatePet(index, 'vaccinated', !pet.vaccinated)}
          >
            <View
              style={[
                styles.checkbox,
                pet.vaccinated && styles.checkboxChecked,
              ]}
            >
              {pet.vaccinated && (
                <Ionicons name="checkmark" size={16} color={colors.white} />
              )}
            </View>
            <Text style={styles.checkboxLabel}>Vaccinations up to date</Text>
          </TouchableOpacity>

          {/* Pet Photos */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Photos (up to 6)</Text>
            <View style={styles.photosGrid}>
              {[...Array(6)].map((_, photoIndex) => (
                <TouchableOpacity
                  key={photoIndex}
                  style={styles.petPhotoSlot}
                  onPress={() => pet.photos[photoIndex] ? handleRemovePetPhoto(index, photoIndex) : handleAddPetPhoto(index)}
                >
                  {pet.photos[photoIndex] ? (
                    <View style={styles.photoContainer}>
                      <Image
                        source={{ uri: pet.photos[photoIndex] }}
                        style={styles.petPhoto}
                      />
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
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addPetButton} onPress={handleAddPet}>
        <Ionicons name="add-circle" size={24} color={colors.primary} />
        <Text style={styles.addPetButtonText}>Add Another Pet</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Add Personality</Text>
      <Text style={styles.stepSubtitle}>Let pet lovers know more about you</Text>

      <PromptSelector
        role="OWNER"
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
        Verify your identity to build trust with other pet owners and service providers.
        This step is optional but recommended.
      </Text>

      <TouchableOpacity
        style={styles.verifyButton}
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
            <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
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
              style={[styles.nextButton, step === 1 && { flex: 1 }]}
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
    backgroundColor: colors.primary,
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
  inputFilled: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
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
  petCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  petCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.gray[700],
  },
  petPhotoSlot: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
  },
  petPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  addPetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 20,
  },
  addPetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
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
    backgroundColor: `${colors.primary}15`,
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
    backgroundColor: colors.primary,
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
    backgroundColor: colors.primary,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
