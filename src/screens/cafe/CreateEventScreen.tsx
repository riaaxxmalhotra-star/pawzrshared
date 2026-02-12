import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { colors } from '../../theme/colors';

const CAFE_COLOR = '#14B8A6';

const eventTypes = [
  { id: 'meetup', label: 'Pet Meetup', icon: 'people', emoji: '🐕' },
  { id: 'adoption', label: 'Adoption Event', icon: 'heart', emoji: '💕' },
  { id: 'birthday', label: 'Birthday Party', icon: 'gift', emoji: '🎂' },
  { id: 'workshop', label: 'Workshop', icon: 'school', emoji: '📚' },
  { id: 'photoshoot', label: 'Photo Shoot', icon: 'camera', emoji: '📸' },
  { id: 'grooming', label: 'Grooming', icon: 'cut', emoji: '✂️' },
  { id: 'competition', label: 'Competition', icon: 'trophy', emoji: '🏆' },
  { id: 'movie_night', label: 'Movie Night', icon: 'film', emoji: '🎬' },
];

const petTypes = ['Dogs', 'Cats', 'Birds', 'All Pets'];

export default function CreateEventScreen() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Event details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // Date & Time
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Capacity & Pricing
  const [capacity, setCapacity] = useState('');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);

  // Additional
  const [allowedPets, setAllowedPets] = useState<string[]>(['All Pets']);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [requirements, setRequirements] = useState('');

  const amenityOptions = [
    'Water Bowls',
    'Pet Treats',
    'Play Area',
    'Photo Booth',
    'Trainer Present',
    'Vet on Site',
    'AC Indoor',
    'Outdoor Space',
  ];

  const handleAddCover = async () => {
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
      setCoverImage(result.assets[0].uri);
    }
  };

  const togglePetType = (pet: string) => {
    if (pet === 'All Pets') {
      setAllowedPets(['All Pets']);
    } else {
      const newPets = allowedPets.includes(pet)
        ? allowedPets.filter(p => p !== pet)
        : [...allowedPets.filter(p => p !== 'All Pets'), pet];
      setAllowedPets(newPets.length ? newPets : ['All Pets']);
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter(a => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  };

  const handleCreate = async () => {
    if (!title || !eventType || !date || !startTime || !capacity) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: API call to create event
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert('Success', 'Event created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Event Details</Text>
      <Text style={styles.stepSubtitle}>What kind of event are you hosting?</Text>

      {/* Cover Image */}
      <TouchableOpacity style={styles.coverImagePicker} onPress={handleAddCover}>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="image" size={40} color={colors.gray[400]} />
            <Text style={styles.coverPlaceholderText}>Add Cover Image</Text>
          </View>
        )}
        <View style={styles.coverEditButton}>
          <Ionicons name="camera" size={16} color={colors.white} />
        </View>
      </TouchableOpacity>

      {/* Event Type */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Event Type *</Text>
        <View style={styles.typeGrid}>
          {eventTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[styles.typeCard, eventType === type.id && styles.typeCardSelected]}
              onPress={() => setEventType(type.id)}
            >
              <Text style={styles.typeEmoji}>{type.emoji}</Text>
              <Text style={[styles.typeLabel, eventType === type.id && styles.typeLabelSelected]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Title */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Event Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Give your event a catchy name"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell pet owners what to expect..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          placeholderTextColor={colors.gray[400]}
        />
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Date & Time</Text>
      <Text style={styles.stepSubtitle}>When is your event happening?</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Event Date *</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/YYYY"
          value={date}
          onChangeText={setDate}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Start Time *</Text>
          <TextInput
            style={styles.input}
            placeholder="10:00 AM"
            value={startTime}
            onChangeText={setStartTime}
            placeholderTextColor={colors.gray[400]}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>End Time</Text>
          <TextInput
            style={styles.input}
            placeholder="2:00 PM"
            value={endTime}
            onChangeText={setEndTime}
            placeholderTextColor={colors.gray[400]}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Capacity *</Text>
        <TextInput
          style={styles.input}
          placeholder="Maximum number of attendees"
          value={capacity}
          onChangeText={setCapacity}
          keyboardType="numeric"
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Pricing */}
      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Entry Price</Text>
          <TouchableOpacity
            style={styles.freeToggle}
            onPress={() => {
              setIsFree(!isFree);
              if (!isFree) setPrice('');
            }}
          >
            <View style={[styles.checkbox, isFree && styles.checkboxChecked]}>
              {isFree && <Ionicons name="checkmark" size={14} color={colors.white} />}
            </View>
            <Text style={styles.freeText}>Free Event</Text>
          </TouchableOpacity>
        </View>
        {!isFree && (
          <TextInput
            style={styles.input}
            placeholder="₹299"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholderTextColor={colors.gray[400]}
          />
        )}
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Additional Details</Text>
      <Text style={styles.stepSubtitle}>Help pet owners know what to expect</Text>

      {/* Allowed Pets */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Allowed Pets</Text>
        <View style={styles.optionsRow}>
          {petTypes.map((pet) => (
            <TouchableOpacity
              key={pet}
              style={[styles.optionChip, allowedPets.includes(pet) && styles.optionChipSelected]}
              onPress={() => togglePetType(pet)}
            >
              <Text style={[styles.optionChipText, allowedPets.includes(pet) && styles.optionChipTextSelected]}>
                {pet}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Amenities */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Event Amenities</Text>
        <View style={styles.optionsRow}>
          {amenityOptions.map((amenity) => (
            <TouchableOpacity
              key={amenity}
              style={[styles.optionChip, amenities.includes(amenity) && styles.optionChipSelected]}
              onPress={() => toggleAmenity(amenity)}
            >
              <Text style={[styles.optionChipText, amenities.includes(amenity) && styles.optionChipTextSelected]}>
                {amenity}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Requirements */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Requirements (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any specific requirements? E.g., vaccination proof, leash required..."
          value={requirements}
          onChangeText={setRequirements}
          multiline
          numberOfLines={3}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Preview Card */}
      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>Event Preview</Text>
        <View style={styles.previewContent}>
          {coverImage && <Image source={{ uri: coverImage }} style={styles.previewImage} />}
          <Text style={styles.previewEventTitle}>{title || 'Event Title'}</Text>
          <Text style={styles.previewMeta}>
            {date || 'Date'} • {startTime || 'Time'} • {capacity || '0'} spots
          </Text>
          <Text style={styles.previewPrice}>
            {isFree ? 'Free' : price ? `₹${price}` : 'Set price'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Step {step} of 3</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity style={styles.backStepButton} onPress={() => setStep(step - 1)}>
              <Text style={styles.backStepButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextButton, step === 1 && { flex: 1 }]}
            onPress={() => step < 3 ? setStep(step + 1) : handleCreate()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.nextButtonText}>
                {step === 3 ? 'Create Event' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900] },
  progressContainer: { paddingHorizontal: 20, paddingBottom: 8 },
  progressBar: { height: 4, backgroundColor: colors.gray[200], borderRadius: 2, marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: CAFE_COLOR },
  progressText: { fontSize: 12, color: colors.gray[500], textAlign: 'right' },
  content: { flex: 1, paddingHorizontal: 20 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', color: colors.gray[900], marginTop: 8, marginBottom: 4 },
  stepSubtitle: { fontSize: 15, color: colors.gray[500], marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.gray[700], marginBottom: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  input: { backgroundColor: colors.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.gray[900], borderWidth: 1, borderColor: colors.gray[200] },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  coverImagePicker: { height: 180, borderRadius: 16, overflow: 'hidden', marginBottom: 24, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { width: '100%', height: '100%', backgroundColor: colors.gray[100], borderWidth: 2, borderColor: colors.gray[200], borderStyle: 'dashed', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  coverPlaceholderText: { fontSize: 14, color: colors.gray[400], marginTop: 8 },
  coverEditButton: { position: 'absolute', bottom: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: CAFE_COLOR, justifyContent: 'center', alignItems: 'center' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: { width: '23%', aspectRatio: 1, backgroundColor: colors.white, borderRadius: 12, borderWidth: 2, borderColor: colors.gray[200], justifyContent: 'center', alignItems: 'center' },
  typeCardSelected: { borderColor: CAFE_COLOR, backgroundColor: `${CAFE_COLOR}10` },
  typeEmoji: { fontSize: 24, marginBottom: 4 },
  typeLabel: { fontSize: 10, color: colors.gray[600], textAlign: 'center' },
  typeLabelSelected: { color: CAFE_COLOR, fontWeight: '600' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.gray[100], borderWidth: 1, borderColor: colors.gray[200] },
  optionChipSelected: { backgroundColor: CAFE_COLOR, borderColor: CAFE_COLOR },
  optionChipText: { fontSize: 13, color: colors.gray[600], fontWeight: '500' },
  optionChipTextSelected: { color: colors.white },
  freeToggle: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: colors.gray[300], justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  checkboxChecked: { backgroundColor: CAFE_COLOR, borderColor: CAFE_COLOR },
  freeText: { fontSize: 14, color: colors.gray[600] },
  previewCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginTop: 8, borderWidth: 1, borderColor: colors.gray[200] },
  previewTitle: { fontSize: 14, fontWeight: '600', color: colors.gray[500], marginBottom: 12 },
  previewContent: { alignItems: 'center' },
  previewImage: { width: '100%', height: 100, borderRadius: 12, marginBottom: 12 },
  previewEventTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  previewMeta: { fontSize: 13, color: colors.gray[500], marginBottom: 8 },
  previewPrice: { fontSize: 20, fontWeight: '700', color: CAFE_COLOR },
  footer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 12, borderTopWidth: 1, borderTopColor: colors.gray[100] },
  backStepButton: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: colors.gray[100] },
  backStepButtonText: { fontSize: 16, fontWeight: '600', color: colors.gray[700] },
  nextButton: { flex: 2, paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: CAFE_COLOR },
  nextButtonText: { fontSize: 16, fontWeight: '600', color: colors.white },
});
