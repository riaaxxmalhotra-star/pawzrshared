import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';

interface ProviderData {
  id: string;
  name: string;
  type: 'vet' | 'groomer' | 'supplier';
  specialty?: string;
  rating: number;
  reviewCount: number;
  distance: string;
  address: string;
  phone: string;
  email?: string;
  googleMapsLink?: string;
  image?: string;
  bio?: string;
  experience?: string;
  services?: { name: string; price: string; duration?: string }[];
  openHours?: { day: string; hours: string }[];
  photos?: string[];
}

export default function ProviderProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { provider: routeProvider } = route.params || {};

  // Default provider data (mock) if not passed
  const provider: ProviderData = routeProvider || {
    id: '1',
    name: 'Dr. Amit Sharma',
    type: 'vet',
    specialty: 'General Veterinarian',
    rating: 4.9,
    reviewCount: 127,
    distance: '0.5 km',
    address: '123 Pet Care Lane, Sector 15, Gurgaon, Haryana 122001',
    phone: '+91 98765 43210',
    email: 'dr.amit@pawzrvet.com',
    googleMapsLink: 'https://maps.google.com/?q=28.4595,77.0266',
    bio: 'Dr. Amit Sharma is a highly experienced veterinarian with over 15 years of practice. He specializes in small animal medicine and surgery, with a particular focus on preventive care and pet wellness.',
    experience: '15+ years',
    services: [
      { name: 'General Checkup', price: '₹500', duration: '30 min' },
      { name: 'Vaccination', price: '₹800', duration: '15 min' },
      { name: 'Surgery Consultation', price: '₹1,000', duration: '45 min' },
      { name: 'Dental Cleaning', price: '₹2,500', duration: '1 hour' },
      { name: 'Emergency Care', price: '₹1,500', duration: 'Varies' },
    ],
    openHours: [
      { day: 'Monday - Friday', hours: '9:00 AM - 7:00 PM' },
      { day: 'Saturday', hours: '10:00 AM - 5:00 PM' },
      { day: 'Sunday', hours: 'Closed' },
    ],
    photos: [],
  };

  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'reviews'>('about');

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'vet':
        return { icon: 'medical', color: '#10B981', label: 'Veterinarian' };
      case 'groomer':
        return { icon: 'cut', color: '#8B5CF6', label: 'Pet Groomer' };
      case 'supplier':
        return { icon: 'storefront', color: '#3B82F6', label: 'Pet Supplier' };
      default:
        return { icon: 'business', color: colors.primary, label: 'Provider' };
    }
  };

  const typeConfig = getTypeConfig(provider.type);

  const handleCall = () => {
    const phoneUrl = `tel:${provider.phone.replace(/\s/g, '')}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Unable to make phone call');
        }
      })
      .catch((err) => console.error('Error opening phone:', err));
  };

  const handleMessage = () => {
    // Navigate to Messages tab and it will show the chat
    // We use reset to ensure the Messages screen loads fresh
    navigation.navigate('Messages');
    // The user can start a new chat from there
  };

  const handleOpenMaps = () => {
    const mapsUrl = provider.googleMapsLink ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.address)}`;

    Linking.canOpenURL(mapsUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(mapsUrl);
        } else {
          // Fallback to default maps app
          const fallbackUrl = Platform.OS === 'ios'
            ? `maps:?q=${encodeURIComponent(provider.address)}`
            : `geo:0,0?q=${encodeURIComponent(provider.address)}`;
          Linking.openURL(fallbackUrl).catch(() => {
            Alert.alert('Error', 'Unable to open maps');
          });
        }
      })
      .catch((err) => console.error('Error opening maps:', err));
  };

  const handleBookAppointment = () => {
    navigation.navigate('Home', {
      screen: 'BookAppointment',
      params: { provider }
    });
  };

  const renderAboutTab = () => (
    <View style={styles.tabContent}>
      {/* Bio */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.bioText}>{provider.bio}</Text>
      </View>

      {/* Experience */}
      {provider.experience && (
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={typeConfig.color} />
            <Text style={styles.infoLabel}>Experience</Text>
            <Text style={styles.infoValue}>{provider.experience}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="star" size={20} color="#F59E0B" />
            <Text style={styles.infoLabel}>Rating</Text>
            <Text style={styles.infoValue}>{provider.rating} ({provider.reviewCount})</Text>
          </View>
        </View>
      )}

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <TouchableOpacity style={styles.locationCard} onPress={handleOpenMaps}>
          <View style={styles.locationIcon}>
            <Ionicons name="location" size={24} color={typeConfig.color} />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationAddress}>{provider.address}</Text>
            <Text style={styles.locationDistance}>{provider.distance} away</Text>
          </View>
          <View style={styles.mapsButton}>
            <Ionicons name="navigate" size={20} color={colors.white} />
            <Text style={styles.mapsButtonText}>Open Maps</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Open Hours */}
      {provider.openHours && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hours</Text>
          <View style={styles.hoursCard}>
            {provider.openHours.map((item, index) => (
              <View key={index} style={styles.hoursRow}>
                <Text style={styles.hoursDay}>{item.day}</Text>
                <Text style={[styles.hoursTime, item.hours === 'Closed' && styles.closedText]}>
                  {item.hours}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact</Text>
        <View style={styles.contactCard}>
          <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
            <View style={styles.contactIcon}>
              <Ionicons name="call" size={18} color={typeConfig.color} />
            </View>
            <Text style={styles.contactText}>{provider.phone}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.gray[400]} />
          </TouchableOpacity>
          {provider.email && (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`mailto:${provider.email}`)}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="mail" size={18} color={typeConfig.color} />
              </View>
              <Text style={styles.contactText}>{provider.email}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderServicesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services Offered</Text>
        {provider.services?.map((service, index) => (
          <View key={index} style={styles.serviceCard}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              {service.duration && (
                <Text style={styles.serviceDuration}>{service.duration}</Text>
              )}
            </View>
            <Text style={[styles.servicePrice, { color: typeConfig.color }]}>
              {service.price}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderReviewsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <View style={styles.ratingOverview}>
          <Text style={styles.ratingBig}>{provider.rating}</Text>
          <View style={styles.ratingStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= Math.floor(provider.rating) ? 'star' : 'star-outline'}
                size={20}
                color="#F59E0B"
              />
            ))}
          </View>
          <Text style={styles.reviewCountText}>Based on {provider.reviewCount} reviews</Text>
        </View>

        {/* Mock reviews */}
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewAvatar}>
              <Text style={styles.reviewAvatarText}>P</Text>
            </View>
            <View style={styles.reviewInfo}>
              <Text style={styles.reviewName}>Priya Sharma</Text>
              <View style={styles.reviewStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons key={star} name="star" size={12} color="#F59E0B" />
                ))}
              </View>
            </View>
            <Text style={styles.reviewDate}>2 days ago</Text>
          </View>
          <Text style={styles.reviewText}>
            Excellent service! Dr. Sharma was very thorough and caring with my pet. Highly recommended!
          </Text>
        </View>

        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewAvatar}>
              <Text style={styles.reviewAvatarText}>R</Text>
            </View>
            <View style={styles.reviewInfo}>
              <Text style={styles.reviewName}>Rahul Kumar</Text>
              <View style={styles.reviewStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons key={star} name="star" size={12} color="#F59E0B" />
                ))}
              </View>
            </View>
            <Text style={styles.reviewDate}>1 week ago</Text>
          </View>
          <Text style={styles.reviewText}>
            Very professional and knowledgeable. The clinic is clean and well-maintained. Great experience!
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: `${typeConfig.color}15` }]}>
            {provider.image ? (
              <Image source={{ uri: provider.image }} style={styles.avatarImage} />
            ) : (
              <Ionicons name={typeConfig.icon as any} size={50} color={typeConfig.color} />
            )}
          </View>
          <Text style={styles.name}>{provider.name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: `${typeConfig.color}15` }]}>
            <Ionicons name={typeConfig.icon as any} size={14} color={typeConfig.color} />
            <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
              {provider.specialty || typeConfig.label}
            </Text>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={18} color="#F59E0B" />
            <Text style={styles.ratingText}>{provider.rating}</Text>
            <Text style={styles.reviewCount}>({provider.reviewCount} reviews)</Text>
            <Text style={styles.dot}>•</Text>
            <Ionicons name="location" size={16} color={colors.gray[500]} />
            <Text style={styles.distanceText}>{provider.distance}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
            <Ionicons name="call" size={22} color={typeConfig.color} />
            <Text style={[styles.actionBtnText, { color: typeConfig.color }]}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleMessage}>
            <Ionicons name="chatbubble" size={22} color={typeConfig.color} />
            <Text style={[styles.actionBtnText, { color: typeConfig.color }]}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleOpenMaps}>
            <Ionicons name="navigate" size={22} color={typeConfig.color} />
            <Text style={[styles.actionBtnText, { color: typeConfig.color }]}>Directions</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['about', 'services', 'reviews'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && { borderBottomColor: typeConfig.color }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && { color: typeConfig.color, fontWeight: '600' },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'about' && renderAboutTab()}
        {activeTab === 'services' && renderServicesTab()}
        {activeTab === 'reviews' && renderReviewsTab()}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Book Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bookButton, { backgroundColor: typeConfig.color }]}
          onPress={handleBookAppointment}
        >
          <Ionicons name="calendar" size={20} color={colors.white} />
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  reviewCount: {
    fontSize: 14,
    color: colors.gray[500],
  },
  dot: {
    fontSize: 14,
    color: colors.gray[400],
    marginHorizontal: 4,
  },
  distanceText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 15,
    color: colors.gray[500],
  },
  tabContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  infoItem: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 8,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
    marginTop: 4,
  },
  locationCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationInfo: {
    marginBottom: 16,
  },
  locationAddress: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
  },
  locationDistance: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  mapsButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  hoursCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  hoursDay: {
    fontSize: 14,
    color: colors.gray[700],
  },
  hoursTime: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[900],
  },
  closedText: {
    color: colors.error,
  },
  contactCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[700],
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  serviceDuration: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  ratingOverview: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ratingBig: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  reviewCountText: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 8,
  },
  reviewCard: {
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
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[600],
  },
  reviewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reviewName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  reviewStars: {
    flexDirection: 'row',
    marginTop: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.gray[500],
  },
  reviewText: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  bookButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
});
