import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { providersApi, likesApi } from '../lib/api';
import { useLocation } from '../hooks/useLocation';
import logger from '../lib/logger';

const { width } = Dimensions.get('window');

interface Lover {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  distance: string;
  services: string[];
  verified: boolean;
  bio: string;
  raw: any;
}

const FILTERS = ['All', 'Dog Walking', 'Pet Sitting', 'Day Care', 'Overnight Stay'];

// Backend shapes vary by endpoint version — normalize defensively so a new
// field name degrades to an empty string, never to a crash.
function normalizeLover(item: any): Lover | null {
  const id = item?.id ?? item?.userId ?? item?._id;
  if (id === undefined || id === null) return null;
  const distance =
    typeof item.distance === 'string'
      ? item.distance
      : typeof item.distanceKm === 'number'
        ? `${item.distanceKm.toFixed(1)} km`
        : '';
  return {
    id: String(id),
    name: item.name ?? item.user?.name ?? 'Pet Lover',
    image: item.image ?? item.photo ?? item.user?.image ?? '',
    rating: Number(item.rating ?? item.averageRating ?? 0),
    reviews: Number(item.reviewCount ?? item.reviews ?? 0),
    distance,
    services: Array.isArray(item.services) ? item.services.map(String) : [],
    verified: Boolean(item.verified ?? item.aadhaarVerified ?? false),
    bio: item.bio ?? '',
    raw: item,
  };
}

export default function BrowseScreen() {
  const navigation = useNavigation<any>();
  const { location } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [lovers, setLovers] = useState<Lover[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadLovers = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await providersApi.getLovers();
      const list = data.lovers || data.data || data || [];
      setLovers((Array.isArray(list) ? list : []).map(normalizeLover).filter((l): l is Lover => l !== null));
    } catch (error) {
      logger.error('Failed to load pet lovers:', error);
      setLovers([]);
      setLoadError(error instanceof Error ? error.message : 'Could not load pet lovers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLovers();
  }, [loadLovers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLovers();
  };

  const toggleLike = async (lover: Lover) => {
    const nextLiked = !likedIds.has(lover.id);
    setLikedIds(prev => {
      const next = new Set(prev);
      if (nextLiked) next.add(lover.id);
      else next.delete(lover.id);
      return next;
    });
    try {
      await likesApi.sendLike(lover.id, nextLiked);
    } catch (error) {
      // Revert the optimistic toggle — the server is the source of truth.
      setLikedIds(prev => {
        const next = new Set(prev);
        if (nextLiked) next.delete(lover.id);
        else next.add(lover.id);
        return next;
      });
      logger.error('Failed to send like:', error);
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const openProfile = (lover: Lover) => {
    navigation.navigate('ProviderProfile', {
      provider: {
        ...(lover.raw ?? {}),
        id: lover.id,
        type: 'lover',
        name: lover.name,
        image: lover.image,
        rating: lover.rating,
        reviewCount: lover.reviews,
        bio: lover.bio,
        services: lover.services,
        distance: lover.distance,
      },
    });
  };

  const query = searchQuery.trim().toLowerCase();
  const visible = lovers.filter(lover => {
    if (activeFilter !== 'All' && !lover.services.some(s => s.toLowerCase().includes(activeFilter.toLowerCase()))) {
      return false;
    }
    if (!query) return true;
    return (
      lover.name.toLowerCase().includes(query) ||
      lover.bio.toLowerCase().includes(query) ||
      lover.services.some(s => s.toLowerCase().includes(query))
    );
  });

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerStateText}>Finding pet lovers near you...</Text>
        </View>
      );
    }
    if (loadError) {
      return (
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.gray[300]} />
          <Text style={styles.centerStateTitle}>Could not load pet lovers</Text>
          <Text style={styles.centerStateText}>{loadError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => { setLoading(true); loadLovers(); }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (visible.length === 0) {
      return (
        <View style={styles.centerState}>
          <Ionicons name="heart-outline" size={48} color={colors.gray[300]} />
          <Text style={styles.centerStateTitle}>
            {lovers.length === 0 ? 'No pet lovers yet' : 'No matches for your search'}
          </Text>
          <Text style={styles.centerStateText}>
            {lovers.length === 0
              ? 'Check back soon — new pet lovers join every day.'
              : 'Try a different name, service, or filter.'}
          </Text>
        </View>
      );
    }
    return (
      <>
        <Text style={styles.resultsTitle}>
          Near You{location ? '' : ' (enable location for distances)'}
        </Text>
        {visible.map((lover) => {
          const liked = likedIds.has(lover.id);
          return (
            <TouchableOpacity key={lover.id} style={styles.loverCard} activeOpacity={0.8} onPress={() => openProfile(lover)}>
              {lover.image ? (
                <Image source={{ uri: lover.image }} style={styles.loverImage} />
              ) : (
                <View style={[styles.loverImage, styles.loverImageFallback]}>
                  <Ionicons name="person" size={32} color={colors.gray[400]} />
                </View>
              )}

              <View style={styles.loverInfo}>
                <View style={styles.loverHeader}>
                  <View style={styles.nameRow}>
                    <Text style={styles.loverName}>{lover.name}</Text>
                    {lover.verified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                      </View>
                    )}
                  </View>
                  {lover.rating > 0 && (
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.ratingText}>{lover.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>

                {!!lover.bio && <Text style={styles.loverBio} numberOfLines={2}>{lover.bio}</Text>}

                {lover.services.length > 0 && (
                  <View style={styles.servicesRow}>
                    {lover.services.slice(0, 2).map((service) => (
                      <View key={service} style={styles.serviceBadge}>
                        <Text style={styles.serviceText}>{service}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.metaRow}>
                  {!!lover.distance && (
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={14} color={colors.gray[400]} />
                      <Text style={styles.metaText}>{lover.distance}</Text>
                    </View>
                  )}
                  {lover.reviews > 0 && (
                    <View style={styles.metaItem}>
                      <Ionicons name="chatbubble-outline" size={14} color={colors.gray[400]} />
                      <Text style={styles.metaText}>{lover.reviews} reviews</Text>
                    </View>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={styles.heartBtn}
                onPress={() => toggleLike(lover)}
                accessibilityLabel={liked ? `Unlike ${lover.name}` : `Like ${lover.name}`}
              >
                <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color="#F97316" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>pawzr</Text>
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>Find Pet Lovers</Text>
        <Text style={styles.subtitle}>Trusted people who'll care for your pets</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or service..."
          placeholderTextColor={colors.gray[400]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Service Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {FILTERS.map((filter) => {
          const active = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.resultsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {renderBody()}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'center',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.gray[900],
  },
  filterScroll: {
    marginTop: 16,
    marginBottom: 8,
  },
  filterContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
  },
  filterTextActive: {
    color: colors.white,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 16,
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
  loverCard: {
    flexDirection: 'row',
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
  loverImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: colors.gray[200],
  },
  loverImageFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loverInfo: {
    flex: 1,
    marginLeft: 14,
  },
  loverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loverName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[900],
  },
  verifiedBadge: {
    backgroundColor: '#10B98115',
    padding: 2,
    borderRadius: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  loverBio: {
    fontSize: 13,
    color: colors.gray[500],
    lineHeight: 18,
    marginBottom: 10,
  },
  servicesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  serviceBadge: {
    backgroundColor: '#F9731615',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  serviceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F97316',
  },
  metaRow: {
    flexDirection: 'row',
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
  heartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9731610',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
});
