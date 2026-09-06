import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, roleColors } from '../theme/colors';
import { apiRequest } from '../lib/api';
import logger from '../lib/logger';

const { width } = Dimensions.get('window');

type UserRole = 'OWNER' | 'VET' | 'GROOMER' | 'SUPPLIER' | 'LOVER';

interface RoleOption {
  id: UserRole;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const roleOptions: RoleOption[] = [
  {
    id: 'OWNER',
    title: 'Pet Owner',
    description: 'I have pets and want to find services',
    icon: 'paw',
    color: roleColors.OWNER,
  },
  {
    id: 'VET',
    title: 'Veterinarian',
    description: 'I provide veterinary services',
    icon: 'medical',
    color: roleColors.VET,
  },
  {
    id: 'GROOMER',
    title: 'Pet Groomer',
    description: 'I provide grooming services',
    icon: 'cut',
    color: roleColors.GROOMER,
  },
  {
    id: 'SUPPLIER',
    title: 'Pet Supplier',
    description: 'I sell pet products',
    icon: 'storefront',
    color: roleColors.SUPPLIER,
  },
  {
    id: 'LOVER',
    title: 'Pet Lover',
    description: 'I offer pet walking & sitting',
    icon: 'heart',
    color: roleColors.LOVER,
  },
];

interface Props {
  onComplete: (role: string) => void;
  userId: string;
}

const vetSpecializations = ['General Practice', 'Surgery', 'Dermatology', 'Dentistry', 'Cardiology', 'Orthopedics', 'Emergency Care', 'Exotic Animals'];
const groomerServiceOptions = ['Bath & Brush', 'Full Grooming', 'Nail Trimming', 'Ear Cleaning', 'Teeth Cleaning', 'De-shedding', 'Flea Treatment', 'Creative Styling'];
const productCategoryOptions = ['Food & Treats', 'Toys', 'Beds & Furniture', 'Grooming Supplies', 'Health & Wellness', 'Clothing & Accessories', 'Training Supplies', 'Aquarium'];
const availabilityOptions = ['Weekday Mornings', 'Weekday Afternoons', 'Weekday Evenings', 'Weekend Mornings', 'Weekend Afternoons', 'Weekend Evenings'];

export default function OnboardingScreen({ onComplete, userId }: Props) {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Common profile fields
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  // Pet Owner fields
  const [petCount, setPetCount] = useState('1');

  // Vet fields
  const [vetLicense, setVetLicense] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [consultationFee, setConsultationFee] = useState('');
  const [experience, setExperience] = useState('');

  // Groomer fields
  const [businessName, setBusinessName] = useState('');
  const [groomerServices, setGroomerServices] = useState<string[]>([]);
  const [groomerExperience, setGroomerExperience] = useState('');
  const [homeService, setHomeService] = useState(false);

  // Supplier fields
  const [shopName, setShopName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);

  // Lover (Walker) fields
  const [aboutMe, setAboutMe] = useState('');
  const [walkerExperience, setWalkerExperience] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [availability, setAvailability] = useState<string[]>([]);

  const animateStep = (direction: 'next' | 'back') => {
    const toValue = direction === 'next' ? -width : width;
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const nextStep = () => {
    if (step === 1 && !selectedRole) {
      Alert.alert('Select Role', 'Please select what describes you best');
      return;
    }
    animateStep('next');
    setStep(step + 1);
  };

  const prevStep = () => {
    animateStep('back');
    setStep(step - 1);
  };

  const toggleArrayItem = (arr: string[], setArr: (a: string[]) => void, item: string) => {
    if (arr.includes(item)) {
      setArr(arr.filter(i => i !== item));
    } else {
      setArr([...arr, item]);
    }
  };

  const handleComplete = async () => {
    // Validate required fields based on role
    if (!phone || !city) {
      Alert.alert('Required Fields', 'Please fill in phone number and city');
      return;
    }

    if (selectedRole === 'VET' && (!vetLicense || !clinicName)) {
      Alert.alert('Required Fields', 'Please fill in license and clinic name');
      return;
    }

    if (selectedRole === 'GROOMER' && (!businessName || groomerServices.length === 0)) {
      Alert.alert('Required Fields', 'Please fill in business name and select services');
      return;
    }

    if (selectedRole === 'SUPPLIER' && (!shopName || productCategories.length === 0)) {
      Alert.alert('Required Fields', 'Please fill in shop name and select product categories');
      return;
    }

    if (selectedRole === 'LOVER' && (!hourlyRate || availability.length === 0)) {
      Alert.alert('Required Fields', 'Please fill in hourly rate and select availability');
      return;
    }

    setSaving(true);
    try {
      // Auth header is attached by apiRequest from the secure token store.
      const profileData = {
        userId,
        role: selectedRole,
        phone,
        address,
        city,
        pincode,
        onboardingCompleted: true,
        ...(selectedRole === 'OWNER' && { petCount: parseInt(petCount) }),
        ...(selectedRole === 'VET' && {
          vetLicense,
          clinicName,
          specializations,
          consultationFee: consultationFee ? parseInt(consultationFee) : null,
          experience: experience ? parseInt(experience) : null,
        }),
        ...(selectedRole === 'GROOMER' && {
          businessName,
          services: groomerServices,
          experience: groomerExperience ? parseInt(groomerExperience) : null,
          homeService,
        }),
        ...(selectedRole === 'SUPPLIER' && {
          shopName,
          gstNumber,
          productCategories,
          deliveryAvailable,
        }),
        ...(selectedRole === 'LOVER' && {
          aboutMe,
          experience: walkerExperience ? parseInt(walkerExperience) : null,
          hourlyRate: hourlyRate ? parseInt(hourlyRate) : null,
          availability,
        }),
      };

      await apiRequest('/users/update-profile', {
        method: 'POST',
        body: JSON.stringify(profileData),
      });

      onComplete(selectedRole!);
    } catch (error: any) {
      logger.error('Failed to save profile:', error);
      // Still complete even if API fails
      onComplete(selectedRole!);
    } finally {
      setSaving(false);
    }
  };

  // Local helper (not the theme role color): tint from the selected onboarding option.
  const getSelectedRoleColor = () => {
    if (!selectedRole) return colors.primary;
    return roleOptions.find(r => r.id === selectedRole)?.color || colors.primary;
  };

  const renderRoleSelection = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Welcome to Pawzr!</Text>
        <Text style={styles.stepSubtitle}>What best describes you?</Text>

        <View style={styles.roleGrid}>
          {roleOptions.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[
                styles.roleCard,
                selectedRole === role.id && { borderColor: role.color, borderWidth: 2 },
              ]}
              onPress={() => setSelectedRole(role.id)}
            >
              <View style={[styles.roleIcon, { backgroundColor: `${role.color}15` }]}>
                <Ionicons name={role.icon} size={28} color={role.color} />
              </View>
              <View style={styles.roleInfo}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </View>
              {selectedRole === role.id && (
                <View style={[styles.selectedCheck, { backgroundColor: role.color }]}>
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderContactInfo = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Contact Information</Text>
        <Text style={styles.stepSubtitle}>How can people reach you?</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 98765 43210"
            placeholderTextColor={colors.gray[400]}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Street address"
            placeholderTextColor={colors.gray[400]}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              placeholder="City"
              placeholderTextColor={colors.gray[400]}
              value={city}
              onChangeText={setCity}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>Pincode</Text>
            <TextInput
              style={styles.input}
              placeholder="560001"
              placeholderTextColor={colors.gray[400]}
              value={pincode}
              onChangeText={setPincode}
              keyboardType="number-pad"
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderOwnerForm = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>About Your Pets</Text>
        <Text style={styles.stepSubtitle}>Tell us about your furry friends</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>How many pets do you have?</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setPetCount(Math.max(1, parseInt(petCount) - 1).toString())}
            >
              <Ionicons name="remove" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{petCount}</Text>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setPetCount((parseInt(petCount) + 1).toString())}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            You can add detailed pet profiles with photos, medical records, and more after setup.
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderVetForm = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Veterinary Details</Text>
        <Text style={styles.stepSubtitle}>Professional information for verification</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Veterinary License Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="VET-KA-12345"
            placeholderTextColor={colors.gray[400]}
            value={vetLicense}
            onChangeText={setVetLicense}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Clinic/Hospital Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Happy Paws Veterinary Clinic"
            placeholderTextColor={colors.gray[400]}
            value={clinicName}
            onChangeText={setClinicName}
          />
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Experience (years)</Text>
            <TextInput
              style={styles.input}
              placeholder="5"
              placeholderTextColor={colors.gray[400]}
              value={experience}
              onChangeText={setExperience}
              keyboardType="number-pad"
            />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>Consultation Fee (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="500"
              placeholderTextColor={colors.gray[400]}
              value={consultationFee}
              onChangeText={setConsultationFee}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Specializations</Text>
          <View style={styles.chipGrid}>
            {vetSpecializations.map((spec) => (
              <TouchableOpacity
                key={spec}
                style={[
                  styles.chip,
                  specializations.includes(spec) && styles.chipSelected,
                ]}
                onPress={() => toggleArrayItem(specializations, setSpecializations, spec)}
              >
                <Text style={[
                  styles.chipText,
                  specializations.includes(spec) && styles.chipTextSelected,
                ]}>
                  {spec}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderGroomerForm = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Grooming Business</Text>
        <Text style={styles.stepSubtitle}>Tell us about your grooming services</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Business Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Paw Perfect Grooming"
            placeholderTextColor={colors.gray[400]}
            value={businessName}
            onChangeText={setBusinessName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Years of Experience</Text>
          <TextInput
            style={styles.input}
            placeholder="3"
            placeholderTextColor={colors.gray[400]}
            value={groomerExperience}
            onChangeText={setGroomerExperience}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Services Offered *</Text>
          <View style={styles.chipGrid}>
            {groomerServiceOptions.map((service) => (
              <TouchableOpacity
                key={service}
                style={[
                  styles.chip,
                  groomerServices.includes(service) && styles.chipSelectedGroomer,
                ]}
                onPress={() => toggleArrayItem(groomerServices, setGroomerServices, service)}
              >
                <Text style={[
                  styles.chipText,
                  groomerServices.includes(service) && styles.chipTextSelected,
                ]}>
                  {service}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Home Service Available</Text>
            <Text style={styles.switchDescription}>I can visit customer locations</Text>
          </View>
          <Switch
            value={homeService}
            onValueChange={setHomeService}
            trackColor={{ false: colors.gray[200], true: '#8B5CF650' }}
            thumbColor={homeService ? '#8B5CF6' : colors.gray[400]}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderSupplierForm = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Business Details</Text>
        <Text style={styles.stepSubtitle}>Information about your pet supply business</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Shop/Business Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Pet Paradise Store"
            placeholderTextColor={colors.gray[400]}
            value={shopName}
            onChangeText={setShopName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>GST Number (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="29AABCU9603R1ZM"
            placeholderTextColor={colors.gray[400]}
            value={gstNumber}
            onChangeText={setGstNumber}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Product Categories *</Text>
          <View style={styles.chipGrid}>
            {productCategoryOptions.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.chip,
                  productCategories.includes(category) && styles.chipSelectedSupplier,
                ]}
                onPress={() => toggleArrayItem(productCategories, setProductCategories, category)}
              >
                <Text style={[
                  styles.chipText,
                  productCategories.includes(category) && styles.chipTextSelected,
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Delivery Available</Text>
            <Text style={styles.switchDescription}>I can deliver products</Text>
          </View>
          <Switch
            value={deliveryAvailable}
            onValueChange={setDeliveryAvailable}
            trackColor={{ false: colors.gray[200], true: '#3B82F650' }}
            thumbColor={deliveryAvailable ? '#3B82F6' : colors.gray[400]}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderLoverForm = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Pet Lover Profile</Text>
        <Text style={styles.stepSubtitle}>Help pet owners get to know you</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>About Me</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell pet owners why you love animals..."
            placeholderTextColor={colors.gray[400]}
            value={aboutMe}
            onChangeText={setAboutMe}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Experience (years)</Text>
            <TextInput
              style={styles.input}
              placeholder="2"
              placeholderTextColor={colors.gray[400]}
              value={walkerExperience}
              onChangeText={setWalkerExperience}
              keyboardType="number-pad"
            />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>Hourly Rate (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="300"
              placeholderTextColor={colors.gray[400]}
              value={hourlyRate}
              onChangeText={setHourlyRate}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Availability *</Text>
          <View style={styles.chipGrid}>
            {availabilityOptions.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[
                  styles.chip,
                  availability.includes(slot) && styles.chipSelectedLover,
                ]}
                onPress={() => toggleArrayItem(availability, setAvailability, slot)}
              >
                <Text style={[
                  styles.chipText,
                  availability.includes(slot) && styles.chipTextSelected,
                ]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderRoleSpecificForm = () => {
    switch (selectedRole) {
      case 'OWNER':
        return renderOwnerForm();
      case 'VET':
        return renderVetForm();
      case 'GROOMER':
        return renderGroomerForm();
      case 'SUPPLIER':
        return renderSupplierForm();
      case 'LOVER':
        return renderLoverForm();
      default:
        return null;
    }
  };

  const getTotalSteps = () => 3;

  const getStepContent = () => {
    switch (step) {
      case 1:
        return renderRoleSelection();
      case 2:
        return renderContactInfo();
      case 3:
        return renderRoleSpecificForm();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          {step > 1 ? (
            <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}
          <View style={styles.progressContainer}>
            {Array.from({ length: getTotalSteps() }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index < step && { backgroundColor: getSelectedRoleColor() },
                  index === step - 1 && styles.progressDotCurrent,
                ]}
              />
            ))}
          </View>
          <View style={styles.backBtn} />
        </View>

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {getStepContent()}
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueBtn,
              { backgroundColor: getSelectedRoleColor() },
            ]}
            onPress={step === getTotalSteps() ? handleComplete : nextStep}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.continueBtnText}>
                  {step === getTotalSteps() ? 'Complete Setup' : 'Continue'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color={colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[200],
  },
  progressDotCurrent: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: colors.gray[500],
    marginBottom: 32,
  },
  roleGrid: {
    gap: 12,
  },
  roleCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[100],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[900],
  },
  roleDescription: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  selectedCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
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
    fontSize: 16,
    color: colors.gray[900],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  chipSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  chipSelectedGroomer: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  chipSelectedSupplier: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  chipSelectedLover: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  chipText: {
    fontSize: 13,
    color: colors.gray[700],
    fontWeight: '500',
  },
  chipTextSelected: {
    color: colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginTop: 8,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  switchDescription: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.gray[900],
    minWidth: 50,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  continueBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
});
