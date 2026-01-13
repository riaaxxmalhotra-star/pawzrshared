import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';

export default function EditProfileScreen() {
  const { user, updateUserProfile } = useAuth();
  const navigation = useNavigation<any>();

  // Personal Info
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.image || '');

  // Address
  const [addressLine1, setAddressLine1] = useState(user?.addressLine1 || '');
  const [addressLine2, setAddressLine2] = useState(user?.addressLine2 || '');
  const [landmark, setLandmark] = useState(user?.landmark || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [city, setCity] = useState(user?.city || '');
  const [state, setState] = useState(user?.state || '');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-fill city and state from pincode
  const handlePincodeChange = async (value: string) => {
    setPincode(value);
    if (value.length === 6) {
      setIsLoading(true);
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${value}`);
        const data = await response.json();
        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const postOffice = data[0].PostOffice[0];
          setCity(postOffice.District || '');
          setState(postOffice.State || '');
        }
      } catch (error) {
        console.log('Pincode lookup failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChangePhoto = async () => {
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
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your name');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile({
        name: name.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        image: profilePhoto || undefined,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        landmark: landmark.trim(),
        pincode: pincode.trim(),
        city: city.trim(),
        state: state.trim(),
      });
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveButton}>
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Profile Photo */}
          <View style={styles.photoSection}>
            <TouchableOpacity onPress={handleChangePhoto} style={styles.photoContainer}>
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person" size={50} color={colors.gray[400]} />
                </View>
              )}
              <View style={styles.editPhotoButton}>
                <Ionicons name="camera" size={16} color={colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Tap to change photo</Text>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={user?.email || ''}
                editable={false}
              />
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor={colors.gray[400]}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself"
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Address Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address Line 1</Text>
              <TextInput
                style={styles.input}
                value={addressLine1}
                onChangeText={setAddressLine1}
                placeholder="House/Flat No., Building Name"
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address Line 2</Text>
              <TextInput
                style={styles.input}
                value={addressLine2}
                onChangeText={setAddressLine2}
                placeholder="Street, Area"
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Landmark</Text>
              <TextInput
                style={styles.input}
                value={landmark}
                onChangeText={setLandmark}
                placeholder="Nearby landmark"
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pincode</Text>
              <View style={styles.pincodeContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={pincode}
                  onChangeText={handlePincodeChange}
                  placeholder="Enter 6-digit pincode"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="numeric"
                  maxLength={6}
                />
                {isLoading && (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
                )}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={[styles.input, city && styles.autoFilledInput]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={[styles.input, state && styles.autoFilledInput]}
                  value={state}
                  onChangeText={setState}
                  placeholder="State"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollContent: {
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  changePhotoText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.gray[900],
  },
  disabledInput: {
    backgroundColor: colors.gray[50],
    color: colors.gray[500],
  },
  autoFilledInput: {
    backgroundColor: '#E8F5E9',
    borderColor: '#81C784',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  pincodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loader: {
    marginLeft: 12,
  },
});
