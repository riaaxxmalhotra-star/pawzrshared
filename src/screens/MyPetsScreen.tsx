import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';
import { petsApi } from '../lib/api';
import logger from '../lib/logger';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  birthday?: string;
  gender: string;
  vaccinated: boolean;
  photos: string[];
}

export default function MyPetsScreen() {
  const { user, updateUserProfile } = useAuth();
  const navigation = useNavigation<any>();
  // Single source of truth shared with PetsScreen: the server roster.
  // (user.pets is the offline cache, not the list shown here.)
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const loadPets = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await petsApi.getMyPets();
      const list = data.pets || data || [];
      setPets(Array.isArray(list) ? list : []);
      // Refresh the offline cache so other screens stay consistent.
      if (Array.isArray(list)) {
        updateUserProfile({ pets: list }).catch(() => {});
      }
    } catch (error) {
      logger.error('Failed to load pets:', error);
      setPets([]);
      setLoadError(error instanceof Error ? error.message : 'Could not load your pets.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPets();
  };

  // Photo edits apply locally AND sync to the server (best-effort).
  // NOTE: URIs stay local until a media-upload endpoint exists (Wave 4
  // follow-up); the server stores the URI strings meanwhile.
  const syncPetPhotos = async (petId: string, photos: string[]) => {
    const updatedPets = pets.map(p => (p.id === petId ? { ...p, photos } : p));
    setPets(updatedPets);
    setEditingPet(updatedPets.find(p => p.id === petId) || null);
    updateUserProfile({ pets: updatedPets }).catch(() => {});
    try {
      await petsApi.updatePet(petId, { photos });
    } catch (error) {
      logger.error('Pet photo sync failed:', error);
      Alert.alert(
        'Saved on this device',
        'Photos were saved locally, but server sync failed. They will retry next time you edit.'
      );
    }
  };

  const handleAddPhoto = async (petId: string) => {
    const pet = pets.find(p => p.id === petId);
    if (!pet) return;

    if (pet.photos.length >= 6) {
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
      const pet = pets.find(p => p.id === petId);
      if (!pet) return;
      await syncPetPhotos(petId, [...(pet.photos || []), result.assets[0].uri]);
    }
  };

  const handleRemovePhoto = async (petId: string, photoIndex: number) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const pet = pets.find(p => p.id === petId);
            if (!pet) return;
            const newPhotos = (pet.photos || []).filter((_, i) => i !== photoIndex);
            await syncPetPhotos(petId, newPhotos);
          }
        }
      ]
    );
  };

  const openPhotoEditor = (pet: Pet) => {
    setEditingPet(pet);
    setShowPhotoModal(true);
  };

  const getSpeciesIcon = (species: string) => {
    switch (species.toLowerCase()) {
      case 'dog':
        return '🐕';
      case 'cat':
        return '🐈';
      case 'bird':
        return '🦜';
      case 'fish':
        return '🐠';
      case 'rabbit':
        return '🐰';
      default:
        return '🐾';
    }
  };

  const getAgeText = (age: string) => {
    const ageNum = parseInt(age);
    if (ageNum === 1) return '1 year old';
    if (ageNum < 1) return 'Less than 1 year';
    return `${age} years old`;
  };

  const formatBirthday = (birthday?: string) => {
    if (!birthday) return null;
    try {
      const date = new Date(birthday);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return birthday;
    }
  };

  if (pets.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Pets</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="paw" size={60} color={colors.gray[300]} />
          </View>
          <Text style={styles.emptyTitle}>No Pets Yet</Text>
          <Text style={styles.emptyText}>
            Add your furry friends during onboarding to see them here!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Pets</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.centerStateText}>Loading your pets...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.centerState}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.centerStateTitle}>Could not load pets</Text>
            <Text style={styles.centerStateText}>{loadError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => { setLoading(true); loadPets(); }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
        <>
        {/* Pet Count */}
        <View style={styles.countCard}>
          <Text style={styles.countNumber}>{pets.length}</Text>
          <Text style={styles.countLabel}>{pets.length === 1 ? 'Pet' : 'Pets'}</Text>
        </View>

        {/* Pet Cards */}
        {pets.map((pet, index) => (
          <TouchableOpacity
            key={pet.id || index}
            style={styles.petCard}
            onPress={() => setSelectedPet(selectedPet?.id === pet.id ? null : pet)}
            activeOpacity={0.8}
          >
            {/* Pet Header */}
            <View style={styles.petHeader}>
              {pet.photos && pet.photos.length > 0 ? (
                <Image source={{ uri: pet.photos[0] }} style={styles.petImage} />
              ) : (
                <View style={styles.petImagePlaceholder}>
                  <Text style={styles.petEmoji}>{getSpeciesIcon(pet.species)}</Text>
                </View>
              )}
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petBreed}>{pet.breed}</Text>
                <View style={styles.petTags}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{pet.species}</Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{pet.gender}</Text>
                  </View>
                  {pet.vaccinated && (
                    <View style={[styles.tag, styles.vaccinatedTag]}>
                      <Ionicons name="checkmark-circle" size={12} color="#059669" />
                      <Text style={[styles.tagText, styles.vaccinatedText]}>Vaccinated</Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons
                name={selectedPet?.id === pet.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.gray[400]}
              />
            </View>

            {/* Expanded Details */}
            {selectedPet?.id === pet.id && (
              <View style={styles.petDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                    <Text style={styles.detailLabel}>Age</Text>
                    <Text style={styles.detailValue}>{getAgeText(pet.age)}</Text>
                  </View>
                  {pet.birthday && (
                    <View style={styles.detailItem}>
                      <Ionicons name="gift-outline" size={18} color={colors.primary} />
                      <Text style={styles.detailLabel}>Birthday</Text>
                      <Text style={styles.detailValue}>{formatBirthday(pet.birthday)}</Text>
                    </View>
                  )}
                </View>

                {/* Pet Photos Gallery */}
                <View style={styles.photosSection}>
                  <View style={styles.photosSectionHeader}>
                    <Text style={styles.photosTitle}>Photos ({pet.photos?.length || 0}/6)</Text>
                    <TouchableOpacity
                      style={styles.editPhotosBtn}
                      onPress={() => openPhotoEditor(pet)}
                    >
                      <Ionicons name="pencil" size={16} color={colors.primary} />
                      <Text style={styles.editPhotosBtnText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                  {pet.photos && pet.photos.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {pet.photos.map((photo, photoIndex) => (
                        <Image
                          key={photoIndex}
                          source={{ uri: photo }}
                          style={styles.galleryImage}
                        />
                      ))}
                      {pet.photos.length < 6 && (
                        <TouchableOpacity
                          style={styles.addPhotoBtn}
                          onPress={() => handleAddPhoto(pet.id)}
                        >
                          <Ionicons name="add" size={24} color={colors.gray[400]} />
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  ) : (
                    <TouchableOpacity
                      style={styles.noPhotosBtn}
                      onPress={() => handleAddPhoto(pet.id)}
                    >
                      <Ionicons name="camera-outline" size={24} color={colors.gray[400]} />
                      <Text style={styles.noPhotosBtnText}>Add Photos</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={{ height: 100 }} />
        </>
        )}
      </ScrollView>

      {/* Photo Edit Modal */}
      <Modal
        visible={showPhotoModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Photos</Text>
              <TouchableOpacity onPress={() => setShowPhotoModal(false)}>
                <Ionicons name="close" size={24} color={colors.gray[700]} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              {editingPet?.name}'s photos ({editingPet?.photos?.length || 0}/6)
            </Text>

            <View style={styles.photoGrid}>
              {[...Array(6)].map((_, index) => {
                const photo = editingPet?.photos?.[index];
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.photoSlot, index === 0 && styles.mainPhotoSlot]}
                    onPress={() => {
                      if (photo) {
                        handleRemovePhoto(editingPet!.id, index);
                      } else if (editingPet) {
                        handleAddPhoto(editingPet.id);
                      }
                    }}
                  >
                    {photo ? (
                      <View style={styles.photoWrapper}>
                        <Image source={{ uri: photo }} style={styles.gridPhoto} />
                        <View style={styles.removePhotoBtn}>
                          <Ionicons name="close-circle" size={24} color={colors.error} />
                        </View>
                        {index === 0 && (
                          <View style={styles.mainBadge}>
                            <Text style={styles.mainBadgeText}>Main</Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.emptySlot}>
                        <Ionicons name="add" size={32} color={colors.gray[400]} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setShowPhotoModal(false)}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    padding: 20,
  },
  centerState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  centerStateTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[800],
    marginTop: 16,
    textAlign: 'center',
  },
  centerStateText: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  countCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  countNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.white,
  },
  countLabel: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  petCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  petImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  petEmoji: {
    fontSize: 32,
  },
  petInfo: {
    flex: 1,
    marginLeft: 14,
  },
  petName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  petBreed: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 8,
  },
  petTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    color: colors.gray[600],
  },
  vaccinatedTag: {
    backgroundColor: '#D1FAE5',
  },
  vaccinatedText: {
    color: '#059669',
  },
  petDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  detailRow: {
    flexDirection: 'row',
    gap: 20,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginTop: 2,
    textAlign: 'center',
  },
  photosSection: {
    marginTop: 16,
  },
  photosSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  photosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  editPhotosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editPhotosBtnText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  galleryImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 8,
  },
  addPhotoBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
  },
  noPhotosBtnText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 20,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  photoSlot: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
  },
  mainPhotoSlot: {
    width: '48%',
  },
  photoWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  gridPhoto: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  mainBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
  },
  emptySlot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  doneBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
});
