import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { petsApi } from '../lib/api';
import logger from '../lib/logger';

const { width } = Dimensions.get('window');

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  image?: string;
  vaccinated: boolean;
  neutered: boolean;
  medicalNotes?: string;
  behaviorNotes?: string;
}

export default function PetsScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [saving, setSaving] = useState(false);
  const [newPet, setNewPet] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    age: '',
    weight: '',
    vaccinated: false,
    neutered: false,
  });

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      const data = await petsApi.getMyPets();
      setPets(data.pets || data || []);
    } catch (error: any) {
      logger.error('Failed to load pets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPets();
  };

  const handleAddPet = async () => {
    if (!newPet.name || !newPet.breed) {
      Alert.alert('Missing Info', 'Please fill in name and breed');
      return;
    }

    setSaving(true);
    try {
      await petsApi.createPet(newPet);
      setShowAddModal(false);
      setNewPet({
        name: '',
        species: 'Dog',
        breed: '',
        age: '',
        weight: '',
        vaccinated: false,
        neutered: false,
      });
      loadPets();
      Alert.alert('Success', 'Pet added successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add pet');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePet = async (petId: string) => {
    Alert.alert(
      'Remove Pet',
      'Are you sure you want to remove this pet from your profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await petsApi.deletePet(petId);
              setSelectedPet(null);
              loadPets();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete pet');
            }
          },
        },
      ]
    );
  };

  const getSpeciesEmoji = (species: string) => {
    switch (species?.toLowerCase()) {
      case 'dog':
        return '🐕';
      case 'cat':
        return '🐱';
      case 'bird':
        return '🐦';
      case 'fish':
        return '🐠';
      case 'rabbit':
        return '🐰';
      default:
        return '🐾';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your pets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>pawzr</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>My Pets</Text>
        <Text style={styles.subtitle}>
          {pets.length === 0 ? 'Add your furry friends' : `${pets.length} pet${pets.length !== 1 ? 's' : ''} in your family`}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Pet Cards */}
        {pets.map((pet) => (
          <TouchableOpacity
            key={pet.id}
            style={styles.petCard}
            activeOpacity={0.8}
            onPress={() => setSelectedPet(pet)}
          >
            <View style={styles.petImageContainer}>
              {pet.image ? (
                <Image source={{ uri: pet.image }} style={styles.petImage} />
              ) : (
                <Text style={styles.petEmoji}>{getSpeciesEmoji(pet.species)}</Text>
              )}
            </View>

            <View style={styles.petInfo}>
              <View style={styles.petHeader}>
                <Text style={styles.petName}>{pet.name}</Text>
                <View style={styles.speciesBadge}>
                  <Text style={styles.speciesText}>{pet.species}</Text>
                </View>
              </View>

              <Text style={styles.petBreed}>{pet.breed}</Text>

              <View style={styles.petMeta}>
                {pet.age && (
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.gray[400]} />
                    <Text style={styles.metaText}>{pet.age}</Text>
                  </View>
                )}
                {pet.weight && (
                  <View style={styles.metaItem}>
                    <Ionicons name="fitness-outline" size={14} color={colors.gray[400]} />
                    <Text style={styles.metaText}>{pet.weight}</Text>
                  </View>
                )}
              </View>

              <View style={styles.badges}>
                {pet.vaccinated && (
                  <View style={styles.badge}>
                    <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                    <Text style={styles.badgeText}>Vaccinated</Text>
                  </View>
                )}
                {pet.neutered && (
                  <View style={[styles.badge, styles.badgeBlue]}>
                    <Ionicons name="medical" size={12} color="#3B82F6" />
                    <Text style={[styles.badgeText, { color: '#3B82F6' }]}>Neutered</Text>
                  </View>
                )}
              </View>
            </View>

            <Ionicons name="chevron-forward" size={22} color={colors.gray[300]} />
          </TouchableOpacity>
        ))}

        {/* Empty State / Add Pet Card */}
        <TouchableOpacity style={styles.addPetCard} onPress={() => setShowAddModal(true)}>
          <View style={styles.addPetIcon}>
            <Ionicons name="add" size={36} color={colors.primary} />
          </View>
          <Text style={styles.addPetTitle}>Add a Pet</Text>
          <Text style={styles.addPetSubtext}>Keep track of all your furry friends</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Pet Detail Modal */}
      <Modal visible={!!selectedPet} animationType="slide" transparent onRequestClose={() => setSelectedPet(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedPet?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedPet(null)} accessibilityRole="button" accessibilityLabel="Close pet details">
                <Ionicons name="close" size={26} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailImageContainer}>
              {selectedPet?.image ? (
                <Image source={{ uri: selectedPet.image }} style={styles.detailImage} />
              ) : (
                <Text style={styles.detailEmoji}>{getSpeciesEmoji(selectedPet?.species || '')}</Text>
              )}
            </View>

            <View style={styles.detailGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Species</Text>
                <Text style={styles.detailValue}>{selectedPet?.species || 'N/A'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Breed</Text>
                <Text style={styles.detailValue}>{selectedPet?.breed || 'N/A'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Age</Text>
                <Text style={styles.detailValue}>{selectedPet?.age || 'N/A'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Weight</Text>
                <Text style={styles.detailValue}>{selectedPet?.weight || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.healthSection}>
              <Text style={styles.healthTitle}>Health Status</Text>
              <View style={styles.healthBadges}>
                <View style={[styles.healthBadge, selectedPet?.vaccinated ? styles.healthBadgeActive : styles.healthBadgeInactive]}>
                  <Ionicons name="shield-checkmark" size={18} color={selectedPet?.vaccinated ? '#10B981' : colors.gray[400]} />
                  <Text style={[styles.healthBadgeText, { color: selectedPet?.vaccinated ? '#10B981' : colors.gray[400] }]}>
                    Vaccinated
                  </Text>
                </View>
                <View style={[styles.healthBadge, selectedPet?.neutered ? styles.healthBadgeActive : styles.healthBadgeInactive]}>
                  <Ionicons name="medical" size={18} color={selectedPet?.neutered ? '#3B82F6' : colors.gray[400]} />
                  <Text style={[styles.healthBadgeText, { color: selectedPet?.neutered ? '#3B82F6' : colors.gray[400] }]}>
                    Neutered
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => selectedPet && handleDeletePet(selectedPet.id)}
              >
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.editButton}>
                <Ionicons name="create-outline" size={22} color={colors.white} />
                <Text style={styles.editButtonText}>Edit Pet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Pet Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Pet</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} accessibilityRole="button" accessibilityLabel="Close add pet form">
                <Ionicons name="close" size={26} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Pet Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="What's your pet's name?"
                  placeholderTextColor={colors.gray[400]}
                  value={newPet.name}
                  onChangeText={(text) => setNewPet({ ...newPet, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Species</Text>
                <View style={styles.speciesOptions}>
                  {['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Other'].map((species) => (
                    <TouchableOpacity
                      key={species}
                      style={[
                        styles.speciesOption,
                        newPet.species === species && styles.speciesOptionSelected,
                      ]}
                      onPress={() => setNewPet({ ...newPet, species })}
                    >
                      <Text style={styles.speciesEmoji}>{getSpeciesEmoji(species)}</Text>
                      <Text
                        style={[
                          styles.speciesOptionText,
                          newPet.species === species && styles.speciesOptionTextSelected,
                        ]}
                      >
                        {species}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Breed *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Golden Retriever"
                  placeholderTextColor={colors.gray[400]}
                  value={newPet.breed}
                  onChangeText={(text) => setNewPet({ ...newPet, breed: text })}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Age</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., 2 years"
                    placeholderTextColor={colors.gray[400]}
                    value={newPet.age}
                    onChangeText={(text) => setNewPet({ ...newPet, age: text })}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.formLabel}>Weight</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., 10 kg"
                    placeholderTextColor={colors.gray[400]}
                    value={newPet.weight}
                    onChangeText={(text) => setNewPet({ ...newPet, weight: text })}
                  />
                </View>
              </View>

              <View style={styles.healthOptions}>
                <TouchableOpacity
                  style={[styles.healthOption, newPet.vaccinated && styles.healthOptionSelected]}
                  onPress={() => setNewPet({ ...newPet, vaccinated: !newPet.vaccinated })}
                >
                  <Ionicons
                    name={newPet.vaccinated ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={newPet.vaccinated ? colors.primary : colors.gray[400]}
                  />
                  <Text style={[styles.healthOptionText, newPet.vaccinated && styles.healthOptionTextSelected]}>
                    Vaccinated
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.healthOption, newPet.neutered && styles.healthOptionSelected]}
                  onPress={() => setNewPet({ ...newPet, neutered: !newPet.neutered })}
                >
                  <Ionicons
                    name={newPet.neutered ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={newPet.neutered ? colors.primary : colors.gray[400]}
                  />
                  <Text style={[styles.healthOptionText, newPet.neutered && styles.healthOptionTextSelected]}>
                    Neutered/Spayed
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, saving && styles.submitButtonDisabled]}
                onPress={handleAddPet}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="paw" size={22} color={colors.white} />
                    <Text style={styles.submitButtonText}>Add Pet</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ height: 20 }} />
            </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.gray[500],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  logoContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray[500],
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 20,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  petImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  petEmoji: {
    fontSize: 40,
  },
  petInfo: {
    flex: 1,
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  petName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  speciesBadge: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  speciesText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[600],
  },
  petBreed: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 8,
  },
  petMeta: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98115',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  badgeBlue: {
    backgroundColor: '#3B82F615',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  addPetCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addPetIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  addPetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  addPetSubtext: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 6,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.gray[900],
  },
  detailImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  detailEmoji: {
    fontSize: 60,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  detailItem: {
    width: (width - 72) / 2,
    backgroundColor: colors.gray[50],
    padding: 16,
    borderRadius: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  healthSection: {
    marginBottom: 24,
  },
  healthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
  },
  healthBadges: {
    flexDirection: 'row',
    gap: 12,
  },
  healthBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  healthBadgeActive: {
    backgroundColor: colors.gray[50],
  },
  healthBadgeInactive: {
    backgroundColor: colors.gray[100],
    opacity: 0.6,
  },
  healthBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.primary,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  // Form Styles
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 10,
  },
  formInput: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.gray[900],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  formRow: {
    flexDirection: 'row',
  },
  speciesOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  speciesOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.gray[50],
    borderWidth: 2,
    borderColor: colors.gray[200],
    gap: 8,
  },
  speciesOptionSelected: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  speciesEmoji: {
    fontSize: 20,
  },
  speciesOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
  },
  speciesOptionTextSelected: {
    color: colors.primary,
  },
  healthOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  healthOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.gray[50],
    borderWidth: 2,
    borderColor: colors.gray[200],
    gap: 10,
  },
  healthOptionSelected: {
    backgroundColor: `${colors.primary}10`,
    borderColor: colors.primary,
  },
  healthOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
  },
  healthOptionTextSelected: {
    color: colors.primary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
});
