import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

// Mock pet lovers data
const petLovers = [
  {
    id: '1',
    name: 'Priya Sharma',
    age: 25,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    rating: 4.9,
    reviews: 47,
    distance: '0.8 km',
    services: ['Dog Walking', 'Pet Sitting'],
    verified: true,
    bio: 'Animal lover with 3 years experience. Your pets are in safe hands!',
  },
  {
    id: '2',
    name: 'Rahul Kumar',
    age: 28,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    rating: 4.8,
    reviews: 32,
    distance: '1.2 km',
    services: ['Day Care', 'Overnight Stay'],
    verified: true,
    bio: 'Dog dad to 2 golden retrievers. Love all pets equally!',
  },
  {
    id: '3',
    name: 'Anita Desai',
    age: 32,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    rating: 5.0,
    reviews: 89,
    distance: '1.5 km',
    services: ['Pet Sitting', 'Dog Walking', 'Grooming'],
    verified: true,
    bio: 'Professional pet sitter. Certified in pet first aid!',
  },
  {
    id: '4',
    name: 'Vikram Singh',
    age: 24,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    rating: 4.7,
    reviews: 21,
    distance: '2.1 km',
    services: ['Dog Walking', 'Pet Meetup'],
    verified: false,
    bio: 'Active runner looking to walk your dogs!',
  },
];

export default function BrowseScreen() {
  const [searchQuery, setSearchQuery] = useState('');

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
        <TouchableOpacity style={[styles.filterPill, styles.filterPillActive]}>
          <Text style={[styles.filterText, styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterPill}>
          <Text style={styles.filterText}>Dog Walking</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterPill}>
          <Text style={styles.filterText}>Pet Sitting</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterPill}>
          <Text style={styles.filterText}>Day Care</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterPill}>
          <Text style={styles.filterText}>Overnight</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Results */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Near You</Text>

        {petLovers.map((lover) => (
          <TouchableOpacity key={lover.id} style={styles.loverCard} activeOpacity={0.8}>
            <Image source={{ uri: lover.image }} style={styles.loverImage} />

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
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.ratingText}>{lover.rating}</Text>
                </View>
              </View>

              <Text style={styles.loverBio} numberOfLines={2}>{lover.bio}</Text>

              <View style={styles.servicesRow}>
                {lover.services.slice(0, 2).map((service) => (
                  <View key={service} style={styles.serviceBadge}>
                    <Text style={styles.serviceText}>{service}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={14} color={colors.gray[400]} />
                  <Text style={styles.metaText}>{lover.distance}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="chatbubble-outline" size={14} color={colors.gray[400]} />
                  <Text style={styles.metaText}>{lover.reviews} reviews</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.heartBtn}>
              <Ionicons name="heart-outline" size={22} color="#EC4899" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

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
    backgroundColor: '#EC489915',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  serviceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EC4899',
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
    backgroundColor: '#EC489910',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
});
