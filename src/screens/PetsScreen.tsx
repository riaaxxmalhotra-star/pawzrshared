import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { petsApi, providersApi } from '../lib/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 60;
const CARD_HEIGHT = 320;
const SWIPE_THRESHOLD = 100;

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

interface Walker {
  id: string;
  name: string;
  age?: number;
  distance: string;
  rating: number;
  reviews: number;
  bio?: string;
  pricePerHour?: string;
  verified?: boolean;
}

export default function PetsScreen() {
  const [activeTab, setActiveTab] = useState<'pets' | 'walkers'>('pets');
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

  // Walker matching state
  const [walkers, setWalkers] = useState<Walker[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<Walker[]>([]);
  const [walkersLoading, setWalkersLoading] = useState(true);

  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });
  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadPets();
    loadWalkers();
  }, []);

  const loadPets = async () => {
    try {
      const data = await petsApi.getMyPets();
      setPets(data.pets || data || []);
    } catch (error: any) {
      console.error('Failed to load pets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadWalkers = async () => {
    try {
      const data = await providersApi.getLovers();
      const walkersList = (data.lovers || data || []).map((w: any) => ({
        id: w.id,
        name: w.name || 'Walker',
        age: w.age || Math.floor(Math.random() * 15) + 20,
        distance: w.distance || `${(Math.random() * 5).toFixed(1)} km`,
        rating: w.rating || (4 + Math.random()).toFixed(1),
        reviews: w.reviews || Math.floor(Math.random() * 50) + 10,
        bio: w.bio || 'Animal lover with experience in pet care',
        pricePerHour: w.pricePerHour || `₹${Math.floor(Math.random() * 300) + 200}`,
        verified: w.verified !== false,
      }));
      setWalkers(walkersList.length > 0 ? walkersList : generateMockWalkers());
    } catch (error) {
      console.error('Failed to load walkers:', error);
      setWalkers(generateMockWalkers());
    } finally {
      setWalkersLoading(false);
    }
  };

  const generateMockWalkers = (): Walker[] => [
    { id: '1', name: 'Priya Sharma', age: 24, distance: '0.8 km', rating: 4.9, reviews: 47, bio: 'Certified pet care specialist with 3+ years of experience', pricePerHour: '₹300', verified: true },
    { id: '2', name: 'Rahul Verma', age: 28, distance: '1.2 km', rating: 4.8, reviews: 32, bio: 'Former vet assistant, loves all animals', pricePerHour: '₹350', verified: true },
    { id: '3', name: 'Ananya Reddy', age: 22, distance: '2.1 km', rating: 4.7, reviews: 28, bio: 'Animal science student, gentle with pets', pricePerHour: '₹250', verified: true },
    { id: '4', name: 'Vikram Singh', age: 30, distance: '0.5 km', rating: 4.9, reviews: 63, bio: 'Professional dog trainer & walker', pricePerHour: '₹400', verified: true },
    { id: '5', name: 'Sneha Patel', age: 26, distance: '1.8 km', rating: 4.6, reviews: 19, bio: 'Cat and dog lover, weekend availability', pricePerHour: '₹280', verified: false },
  ];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.5 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -width - 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => nextCard());
  };

  const swipeRight = () => {
    const currentWalker = walkers[currentIndex];
    if (currentWalker) {
      setMatches([...matches, currentWalker]);
    }
    Animated.timing(position, {
      toValue: { x: width + 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => nextCard());
  };

  const nextCard = () => {
    setCurrentIndex((prev) => prev + 1);
    position.setValue({ x: 0, y: 0 });
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'pets') {
      loadPets();
    } else {
      setCurrentIndex(0);
      setMatches([]);
      loadWalkers();
      setRefreshing(false);
    }
  };

  const handleAddPet = async () => {
    if (!newPet.name || !newPet.breed) {
      Alert.alert('Error', 'Please fill in name and breed');
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
      'Delete Pet',
      'Are you sure you want to remove this pet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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

  const getSpeciesIcon = (species: string) => {
    switch (species.toLowerCase()) {
      case 'dog':
        return '🐕';
      case 'cat':
        return '🐱';
      case 'bird':
        return '🐦';
      case 'fish':
        return '🐠';
      default:
        return '🐾';
    }
  };

  const renderSwipeCard = () => {
    if (currentIndex >= walkers.length) {
      return (
        <View style={styles.noMoreCards}>
          <View style={styles.noMoreIcon}>
            <Ionicons name="heart" size={48} color={colors.gray[300]} />
          </View>
          <Text style={styles.noMoreTitle}>No more walkers nearby</Text>
          <Text style={styles.noMoreSubtext}>Check back later or expand your search area</Text>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => { setCurrentIndex(0); setMatches([]); }}
          >
            <Ionicons name="refresh" size={20} color={colors.white} />
            <Text style={styles.resetBtnText}>Start Over</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return walkers
      .slice(currentIndex, currentIndex + 2)
      .reverse()
      .map((walker, index) => {
        const isFirst = index === walkers.slice(currentIndex, currentIndex + 2).length - 1;
        const animatedStyle = isFirst
          ? { transform: [{ rotate }, ...position.getTranslateTransform()] }
          : { transform: [{ scale: 0.95 }], opacity: 0.7, top: 10 };

        return (
          <Animated.View
            key={walker.id}
            style={[styles.swipeCard, animatedStyle]}
            {...(isFirst ? panResponder.panHandlers : {})}
          >
            <View style={styles.cardTop}>
              <View style={styles.cardAvatar}>
                <Text style={styles.avatarText}>{walker.name.charAt(0)}</Text>
              </View>
              {walker.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                </View>
              )}
            </View>

            <Text style={styles.cardName}>{walker.name}, {walker.age}</Text>

            <View style={styles.cardInfoRow}>
              <View style={styles.infoChip}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={styles.infoText}>{walker.distance}</Text>
              </View>
              <View style={styles.infoChip}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.infoText}>{walker.rating} ({walker.reviews})</Text>
              </View>
            </View>

            <View style={styles.priceChip}>
              <Text style={styles.priceText}>{walker.pricePerHour}/hr</Text>
            </View>

            <Text style={styles.cardBio} numberOfLines={3}>{walker.bio}</Text>

            {isFirst && (
              <>
                <Animated.View style={[styles.likeStamp, { opacity: likeOpacity }]}>
                  <Text style={styles.stampText}>LIKE</Text>
                </Animated.View>
                <Animated.View style={[styles.nopeStamp, { opacity: nopeOpacity }]}>
                  <Text style={styles.stampTextNope}>NOPE</Text>
                </Animated.View>
              </>
            )}
          </Animated.View>
        );
      });
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
      {/* Header with Tabs */}
      <View style={styles.header}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pets' && styles.activeTab]}
            onPress={() => setActiveTab('pets')}
          >
            <Ionicons
              name="paw"
              size={18}
              color={activeTab === 'pets' ? colors.primary : colors.gray[500]}
            />
            <Text style={[styles.tabText, activeTab === 'pets' && styles.activeTabText]}>
              My Pets
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'walkers' && styles.activeTab]}
            onPress={() => setActiveTab('walkers')}
          >
            <Ionicons
              name="heart"
              size={18}
              color={activeTab === 'walkers' ? colors.primary : colors.gray[500]}
            />
            <Text style={[styles.tabText, activeTab === 'walkers' && styles.activeTabText]}>
              Find Walkers
            </Text>
            {matches.length > 0 && (
              <View style={styles.matchCountBadge}>
                <Text style={styles.matchCountText}>{matches.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        {activeTab === 'pets' && (
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* My Pets Tab */}
      {activeTab === 'pets' && (
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
              onPress={() => setSelectedPet(pet)}
            >
              <View style={styles.petImageContainer}>
                <Text style={styles.petEmoji}>{getSpeciesIcon(pet.species)}</Text>
              </View>
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petBreed}>{pet.breed}</Text>
                <View style={styles.petMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.gray[400]} />
                    <Text style={styles.metaText}>{pet.age}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="fitness-outline" size={14} color={colors.gray[400]} />
                    <Text style={styles.metaText}>{pet.weight}</Text>
                  </View>
                </View>
                <View style={styles.badges}>
                  {pet.vaccinated && (
                    <View style={[styles.badge, styles.badgeGreen]}>
                      <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                      <Text style={[styles.badgeText, { color: '#10B981' }]}>Vaccinated</Text>
                    </View>
                  )}
                  {pet.neutered && (
                    <View style={[styles.badge, styles.badgeBlue]}>
                      <Ionicons name="checkmark-circle" size={12} color="#3B82F6" />
                      <Text style={[styles.badgeText, { color: '#3B82F6' }]}>Neutered</Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          ))}

          {/* Add Pet Card */}
          <TouchableOpacity style={styles.addPetCard} onPress={() => setShowAddModal(true)}>
            <View style={styles.addPetIcon}>
              <Ionicons name="add" size={32} color={colors.primary} />
            </View>
            <Text style={styles.addPetText}>Add New Pet</Text>
            <Text style={styles.addPetSubtext}>Keep track of all your furry friends</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Find Walkers Tab */}
      {activeTab === 'walkers' && (
        <View style={styles.walkersContainer}>
          {walkersLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Finding walkers near you...</Text>
            </View>
          ) : (
            <>
              {/* Swipe Instructions */}
              <View style={styles.swipeHeader}>
                <Text style={styles.swipeTitle}>Find Pet Walkers</Text>
                <Text style={styles.swipeSubtitle}>Swipe right to like, left to pass</Text>
              </View>

              {/* Swipe Cards */}
              <View style={styles.swipeContainer}>
                {renderSwipeCard()}
              </View>

              {/* Action Buttons */}
              {currentIndex < walkers.length && (
                <View style={styles.swipeActions}>
                  <TouchableOpacity style={styles.nopeBtn} onPress={swipeLeft}>
                    <Ionicons name="close" size={30} color={colors.error} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.superBtn}>
                    <Ionicons name="star" size={24} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.likeBtn} onPress={swipeRight}>
                    <Ionicons name="heart" size={30} color="#10B981" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Matches Section */}
              {matches.length > 0 && (
                <View style={styles.matchesSection}>
                  <Text style={styles.matchesTitle}>Your Matches ({matches.length})</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {matches.map((match) => (
                      <TouchableOpacity key={match.id} style={styles.matchItem}>
                        <View style={styles.matchAvatar}>
                          <Text style={styles.matchAvatarText}>{match.name.charAt(0)}</Text>
                        </View>
                        <Text style={styles.matchName} numberOfLines={1}>{match.name.split(' ')[0]}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Pet Detail Modal */}
      <Modal visible={!!selectedPet} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedPet?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedPet(null)}>
                <Ionicons name="close" size={24} color={colors.gray[700]} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailImageContainer}>
              <Text style={styles.detailEmoji}>{getSpeciesIcon(selectedPet?.species || '')}</Text>
            </View>

            <View style={styles.detailGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Species</Text>
                <Text style={styles.detailValue}>{selectedPet?.species}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Breed</Text>
                <Text style={styles.detailValue}>{selectedPet?.breed}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Age</Text>
                <Text style={styles.detailValue}>{selectedPet?.age}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Weight</Text>
                <Text style={styles.detailValue}>{selectedPet?.weight}</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => selectedPet && handleDeletePet(selectedPet.id)}
              >
                <Ionicons name="trash" size={20} color={colors.error} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.bookButton}>
                <Ionicons name="calendar" size={20} color={colors.white} />
                <Text style={styles.bookButtonText}>Book Service</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Pet Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Pet</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.gray[700]} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Pet Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter pet name"
                  placeholderTextColor={colors.gray[400]}
                  value={newPet.name}
                  onChangeText={(text) => setNewPet({ ...newPet, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Species</Text>
                <View style={styles.speciesOptions}>
                  {['Dog', 'Cat', 'Bird', 'Fish', 'Other'].map((species) => (
                    <TouchableOpacity
                      key={species}
                      style={[
                        styles.speciesOption,
                        newPet.species === species && styles.speciesOptionSelected,
                      ]}
                      onPress={() => setNewPet({ ...newPet, species })}
                    >
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
                  placeholder="Enter breed"
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

              <View style={styles.formGroup}>
                <View style={styles.checkboxRow}>
                  <TouchableOpacity
                    style={[styles.checkbox, newPet.vaccinated && styles.checkboxChecked]}
                    onPress={() => setNewPet({ ...newPet, vaccinated: !newPet.vaccinated })}
                  >
                    {newPet.vaccinated && <Ionicons name="checkmark" size={16} color={colors.white} />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>Vaccinated</Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.checkboxRow}>
                  <TouchableOpacity
                    style={[styles.checkbox, newPet.neutered && styles.checkboxChecked]}
                    onPress={() => setNewPet({ ...newPet, neutered: !newPet.neutered })}
                  >
                    {newPet.neutered && <Ionicons name="checkmark" size={16} color={colors.white} />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>Neutered/Spayed</Text>
                </View>
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
                    <Ionicons name="paw" size={20} color={colors.white} />
                    <Text style={styles.submitButtonText}>Add Pet</Text>
                  </>
                )}
              </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 4,
    flex: 1,
    marginRight: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  activeTab: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
  },
  activeTabText: {
    color: colors.primary,
  },
  matchCountBadge: {
    backgroundColor: colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  matchCountText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
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
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  petImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  petEmoji: {
    fontSize: 36,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  petBreed: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 2,
  },
  petMeta: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  badges: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeGreen: {
    backgroundColor: '#D1FAE5',
  },
  badgeBlue: {
    backgroundColor: '#DBEAFE',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  addPetText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  addPetSubtext: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
  // Walkers Tab Styles
  walkersContainer: {
    flex: 1,
  },
  swipeHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  swipeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
  },
  swipeSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
  },
  swipeContainer: {
    height: CARD_HEIGHT + 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeCard: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTop: {
    alignItems: 'center',
    marginBottom: 12,
  },
  cardAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
    marginTop: 4,
  },
  cardInfoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  priceChip: {
    alignSelf: 'center',
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 12,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  cardBio: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 22,
  },
  likeStamp: {
    position: 'absolute',
    top: 24,
    left: 24,
    borderWidth: 4,
    borderColor: '#10B981',
    borderRadius: 10,
    padding: 8,
    transform: [{ rotate: '-15deg' }],
  },
  stampText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10B981',
  },
  nopeStamp: {
    position: 'absolute',
    top: 24,
    right: 24,
    borderWidth: 4,
    borderColor: colors.error,
    borderRadius: 10,
    padding: 8,
    transform: [{ rotate: '15deg' }],
  },
  stampTextNope: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.error,
  },
  swipeActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 16,
  },
  nopeBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.error,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  superBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#3B82F6',
  },
  likeBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#10B981',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  noMoreCards: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noMoreIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  noMoreTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[700],
  },
  noMoreSubtext: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 8,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  resetBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  matchesSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  matchesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
  },
  matchItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  matchAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#10B981',
  },
  matchAvatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
  },
  matchName: {
    fontSize: 12,
    color: colors.gray[700],
    marginTop: 6,
    fontWeight: '600',
    maxWidth: 60,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  detailImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  detailEmoji: {
    fontSize: 60,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  detailItem: {
    width: (width - 72) / 2,
    backgroundColor: colors.gray[50],
    padding: 16,
    borderRadius: 12,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    gap: 8,
    marginLeft: 12,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
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
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    gap: 8,
  },
  speciesOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  speciesOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  speciesOptionText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  speciesOptionTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 15,
    color: colors.gray[700],
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
