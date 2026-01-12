import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { providersApi, productsApi } from '../lib/api';

const { width } = Dimensions.get('window');

const categories = [
  { id: 'vets', label: 'Vets', icon: 'medical', color: '#10B981' },
  { id: 'groomers', label: 'Groomers', icon: 'cut', color: '#8B5CF6' },
  { id: 'walkers', label: 'Pet Lovers', icon: 'heart', color: '#3B82F6' },
  { id: 'shop', label: 'Shop', icon: 'storefront', color: colors.primary },
];

interface Provider {
  id: string;
  name: string;
  type: string;
  specialty?: string;
  rating?: number;
  reviews?: number;
  price?: string;
  available?: boolean;
  distance?: string;
  city?: string;
  bio?: string;
}

interface Product {
  id: string;
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  image?: string;
  category?: string;
}

export default function BrowseScreen() {
  const [activeCategory, setActiveCategory] = useState('vets');
  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeCategory === 'shop') {
        const data = await productsApi.getProducts();
        setProducts(data.products || data || []);
      } else {
        let data;
        if (activeCategory === 'vets') {
          data = await providersApi.getVets();
          setProviders((data.vets || data || []).map((v: any) => ({ ...v, type: 'Veterinarian' })));
        } else if (activeCategory === 'groomers') {
          data = await providersApi.getGroomers();
          setProviders((data.groomers || data || []).map((g: any) => ({ ...g, type: 'Groomer' })));
        } else if (activeCategory === 'walkers') {
          data = await providersApi.getLovers();
          setProviders((data.lovers || data || []).map((l: any) => ({ ...l, type: 'Pet Lover' })));
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'veterinarian':
        return 'medical';
      case 'groomer':
        return 'cut';
      case 'pet walker':
        return 'walk';
      default:
        return 'person';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'veterinarian':
        return '#10B981';
      case 'groomer':
        return '#8B5CF6';
      case 'pet walker':
        return '#3B82F6';
      default:
        return colors.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={22} color={colors.gray[700]} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vets, groomers, products..."
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

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                activeCategory === cat.id && { backgroundColor: cat.color },
              ]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon as any}
                size={18}
                color={activeCategory === cat.id ? colors.white : cat.color}
              />
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === cat.id && { color: colors.white },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {/* Service Providers */}
        {!loading && activeCategory !== 'shop' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Near You</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            {providers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={48} color={colors.gray[300]} />
                <Text style={styles.emptyText}>No providers found</Text>
                <Text style={styles.emptySubtext}>Try changing your search or location</Text>
              </View>
            ) : (
              providers.map((provider) => (
                <TouchableOpacity key={provider.id} style={styles.providerCard}>
                  <View
                    style={[
                      styles.providerAvatar,
                      { backgroundColor: `${getTypeColor(provider.type)}15` },
                    ]}
                  >
                    <Ionicons
                      name={getTypeIcon(provider.type) as any}
                      size={28}
                      color={getTypeColor(provider.type)}
                    />
                  </View>
                  <View style={styles.providerInfo}>
                    <View style={styles.providerHeader}>
                      <Text style={styles.providerName}>{provider.name}</Text>
                      {provider.available ? (
                        <View style={styles.availableBadge}>
                          <Text style={styles.availableText}>Available</Text>
                        </View>
                      ) : (
                        <View style={styles.unavailableBadge}>
                          <Text style={styles.unavailableText}>Busy</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.providerSpecialty}>{provider.specialty}</Text>
                    <View style={styles.providerMeta}>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text style={styles.ratingText}>{provider.rating}</Text>
                        <Text style={styles.reviewsText}>({provider.reviews})</Text>
                      </View>
                      <View style={styles.distanceContainer}>
                        <Ionicons name="location" size={14} color={colors.gray[400]} />
                        <Text style={styles.distanceText}>{provider.distance}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.providerPrice}>
                    <Text style={styles.priceText}>{provider.price}</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Products */}
        {!loading && activeCategory === 'shop' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Products</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            {products.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cart" size={48} color={colors.gray[300]} />
                <Text style={styles.emptyText}>No products found</Text>
                <Text style={styles.emptySubtext}>Check back later for new items</Text>
              </View>
            ) : (
              <View style={styles.productsGrid}>
                {products.map((product) => (
                  <TouchableOpacity key={product.id} style={styles.productCard}>
                    <View style={styles.productImage}>
                      <Ionicons name="cube" size={40} color={colors.primary} />
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productBrand}>{product.brand || 'Brand'}</Text>
                      <Text style={styles.productName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <View style={styles.productPricing}>
                        <Text style={styles.productPrice}>₹{product.price}</Text>
                        {product.originalPrice && (
                          <Text style={styles.originalPrice}>₹{product.originalPrice}</Text>
                        )}
                      </View>
                      {product.rating && (
                        <View style={styles.productRating}>
                          <Ionicons name="star" size={12} color="#F59E0B" />
                          <Text style={styles.productRatingText}>{product.rating}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: colors.gray[900],
  },
  categoriesContainer: {
    paddingVertical: 16,
    paddingLeft: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: colors.white,
    marginRight: 10,
    gap: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  providerInfo: {
    flex: 1,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  availableBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  availableText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
  },
  unavailableBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unavailableText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EF4444',
  },
  providerSpecialty: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  providerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[700],
  },
  reviewsText: {
    fontSize: 12,
    color: colors.gray[400],
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  providerPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: (width - 52) / 2,
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productImage: {
    height: 120,
    backgroundColor: `${colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productBrand: {
    fontSize: 11,
    color: colors.gray[400],
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginTop: 2,
    lineHeight: 18,
  },
  productPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 12,
    color: colors.gray[400],
    textDecorationLine: 'line-through',
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  productRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[600],
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.gray[500],
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.white,
    borderRadius: 16,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: colors.gray[500],
  },
});
