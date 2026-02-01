import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';
import { apiRequest } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../lib/logger';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration?: number; // in minutes
  category?: string;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  isActive: boolean;
}

type ListingType = 'service' | 'product';

const serviceCategories = {
  VET: ['Consultation', 'Vaccination', 'Surgery', 'Dental Care', 'Emergency', 'Grooming', 'Lab Tests', 'X-Ray'],
  GROOMER: ['Bath & Brush', 'Full Grooming', 'Nail Trimming', 'Ear Cleaning', 'Teeth Cleaning', 'De-shedding', 'Flea Treatment', 'Creative Styling'],
  LOVER: ['Dog Walking', 'Pet Sitting', 'Overnight Stay', 'Day Care', 'Pet Taxi', 'Training', 'Exercise', 'Socialization'],
};

const productCategories = ['Food & Treats', 'Toys', 'Beds & Furniture', 'Grooming Supplies', 'Health & Wellness', 'Clothing & Accessories', 'Training Supplies', 'Bowls & Feeders', 'Carriers & Crates', 'Aquarium'];

export default function ProviderListingsScreen() {
  const { user } = useAuth();
  const userRole = (user?.role || 'OWNER').toUpperCase();
  const isSupplier = userRole === 'SUPPLIER';

  const [listings, setListings] = useState<(Service | Product)[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Service | Product | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    stock: '',
    category: '',
    isActive: true,
  });

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const endpoint = isSupplier ? '/products/my-products' : '/services/my-services';
      const data = await apiRequest(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setListings(isSupplier ? (data.products || []) : (data.services || []));
    } catch (error) {
      logger.error('Failed to load listings:', error);
      // Use mock data for demo
      setListings(getMockListings());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getMockListings = (): (Service | Product)[] => {
    if (isSupplier) {
      return [
        { id: '1', name: 'Premium Dog Food', description: 'High-quality nutrition for adult dogs', price: 1299, stock: 50, category: 'Food & Treats', isActive: true },
        { id: '2', name: 'Squeaky Toy Ball', description: 'Durable rubber ball with squeaker', price: 299, stock: 100, category: 'Toys', isActive: true },
        { id: '3', name: 'Cozy Pet Bed', description: 'Soft cushioned bed for medium dogs', price: 1899, stock: 25, category: 'Beds & Furniture', isActive: false },
      ];
    }

    const categories = serviceCategories[userRole as keyof typeof serviceCategories] || serviceCategories.VET;
    return [
      { id: '1', name: categories[0], description: `Professional ${categories[0].toLowerCase()} service`, price: 500, duration: 30, category: categories[0], isActive: true },
      { id: '2', name: categories[1], description: `Quality ${categories[1].toLowerCase()} for your pet`, price: 800, duration: 45, category: categories[1], isActive: true },
    ];
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadListings();
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      stock: '',
      category: '',
      isActive: true,
    });
    setEditingItem(null);
    setShowAddModal(true);
  };

  const openEditModal = (item: Service | Product) => {
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      duration: 'duration' in item ? (item.duration?.toString() || '') : '',
      stock: 'stock' in item ? item.stock.toString() : '',
      category: item.category || '',
      isActive: item.isActive,
    });
    setEditingItem(item);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      Alert.alert('Required Fields', 'Please fill in name and price');
      return;
    }

    if (isSupplier && !formData.stock) {
      Alert.alert('Required Fields', 'Please fill in stock quantity');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const endpoint = isSupplier ? '/products' : '/services';
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;

      const payload = isSupplier
        ? {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock),
            category: formData.category,
            isActive: formData.isActive,
          }
        : {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            duration: formData.duration ? parseInt(formData.duration) : null,
            category: formData.category,
            isActive: formData.isActive,
          };

      await apiRequest(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      setShowAddModal(false);
      loadListings();
      Alert.alert('Success', editingItem ? 'Listing updated!' : 'Listing added!');
    } catch (error) {
      logger.error('Failed to save:', error);
      // For demo, just update locally
      if (editingItem) {
        setListings(listings.map(l => l.id === editingItem.id ? {
          ...l,
          ...formData,
          price: parseFloat(formData.price),
          ...(formData.stock ? { stock: parseInt(formData.stock) } : {}),
          ...(formData.duration ? { duration: parseInt(formData.duration) } : {}),
        } : l) as (Service | Product)[]);
      } else {
        const newItem = {
          id: Date.now().toString(),
          ...formData,
          price: parseFloat(formData.price),
          ...(isSupplier ? { stock: parseInt(formData.stock) } : { duration: formData.duration ? parseInt(formData.duration) : undefined }),
        };
        setListings([...listings, newItem as any]);
      }
      setShowAddModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: Service | Product) => {
    Alert.alert(
      'Delete Listing',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const endpoint = isSupplier ? '/products' : '/services';
              await apiRequest(`${endpoint}/${item.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              loadListings();
            } catch (error) {
              // For demo, just remove locally
              setListings(listings.filter(l => l.id !== item.id));
            }
          },
        },
      ]
    );
  };

  const toggleActive = async (item: Service | Product) => {
    const updatedListings = listings.map(l =>
      l.id === item.id ? { ...l, isActive: !l.isActive } : l
    );
    setListings(updatedListings as any);
  };

  const getCategories = () => {
    if (isSupplier) return productCategories;
    return serviceCategories[userRole as keyof typeof serviceCategories] || serviceCategories.VET;
  };

  const getRoleConfig = () => {
    switch (userRole) {
      case 'VET':
        return { title: 'My Services', icon: 'medical', color: '#10B981', addText: 'Add Service' };
      case 'GROOMER':
        return { title: 'My Services', icon: 'cut', color: '#8B5CF6', addText: 'Add Service' };
      case 'SUPPLIER':
        return { title: 'My Products', icon: 'storefront', color: '#3B82F6', addText: 'Add Product' };
      case 'LOVER':
        return { title: 'My Services', icon: 'heart', color: '#F97316', addText: 'Add Service' };
      default:
        return { title: 'My Listings', icon: 'list', color: colors.primary, addText: 'Add Listing' };
    }
  };

  const config = getRoleConfig();

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={config.color} />
          <Text style={styles.loadingText}>Loading listings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{config.title}</Text>
          <Text style={styles.headerSubtitle}>{listings.length} {isSupplier ? 'products' : 'services'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: config.color }]}
          onPress={openAddModal}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{listings.filter(l => l.isActive).length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{listings.filter(l => !l.isActive).length}</Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>
        {isSupplier && (
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {(listings as Product[]).reduce((sum, p) => sum + (p.stock || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Total Stock</Text>
          </View>
        )}
      </View>

      {/* Listings */}
      <ScrollView
        style={styles.listingsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={config.color} />
        }
      >
        {listings.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: `${config.color}15` }]}>
              <Ionicons name={config.icon as any} size={48} color={config.color} />
            </View>
            <Text style={styles.emptyTitle}>No {isSupplier ? 'products' : 'services'} yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first {isSupplier ? 'product to start receiving orders' : 'service to start receiving bookings'}
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: config.color }]}
              onPress={openAddModal}
            >
              <Ionicons name="add" size={20} color={colors.white} />
              <Text style={styles.emptyButtonText}>{config.addText}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          listings.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.listingCard, !item.isActive && styles.listingCardInactive]}
              onPress={() => openEditModal(item)}
            >
              <View style={styles.listingHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: `${config.color}15` }]}>
                  <Text style={[styles.categoryText, { color: config.color }]}>
                    {item.category || (isSupplier ? 'Product' : 'Service')}
                  </Text>
                </View>
                <View style={styles.listingActions}>
                  <Switch
                    value={item.isActive}
                    onValueChange={() => toggleActive(item)}
                    trackColor={{ false: colors.gray[200], true: `${config.color}50` }}
                    thumbColor={item.isActive ? config.color : colors.gray[400]}
                    style={styles.activeSwitch}
                  />
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.listingName}>{item.name}</Text>
              <Text style={styles.listingDescription} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.listingFooter}>
                <Text style={[styles.listingPrice, { color: config.color }]}>
                  ₹{item.price.toLocaleString()}
                  {!isSupplier && <Text style={styles.priceUnit}>/session</Text>}
                </Text>
                <View style={styles.listingMeta}>
                  {isSupplier ? (
                    <View style={styles.metaItem}>
                      <Ionicons name="cube-outline" size={14} color={colors.gray[500]} />
                      <Text style={styles.metaText}>{(item as Product).stock} in stock</Text>
                    </View>
                  ) : (
                    (item as Service).duration && (
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color={colors.gray[500]} />
                        <Text style={styles.metaText}>{(item as Service).duration} min</Text>
                      </View>
                    )
                  )}
                </View>
              </View>

              {!item.isActive && (
                <View style={styles.inactiveBanner}>
                  <Ionicons name="eye-off" size={14} color={colors.gray[500]} />
                  <Text style={styles.inactiveText}>Hidden from customers</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit' : 'Add'} {isSupplier ? 'Product' : 'Service'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.gray[700]} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={isSupplier ? 'Product name' : 'Service name'}
                  placeholderTextColor={colors.gray[400]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe your offering..."
                  placeholderTextColor={colors.gray[400]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {getCategories().map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        formData.category === cat && { backgroundColor: config.color, borderColor: config.color },
                      ]}
                      onPress={() => setFormData({ ...formData, category: cat })}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        formData.category === cat && { color: colors.white },
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Price (₹) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="500"
                    placeholderTextColor={colors.gray[400]}
                    value={formData.price}
                    onChangeText={(text) => setFormData({ ...formData, price: text })}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                  {isSupplier ? (
                    <>
                      <Text style={styles.label}>Stock *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="100"
                        placeholderTextColor={colors.gray[400]}
                        value={formData.stock}
                        onChangeText={(text) => setFormData({ ...formData, stock: text })}
                        keyboardType="number-pad"
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.label}>Duration (min)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="30"
                        placeholderTextColor={colors.gray[400]}
                        value={formData.duration}
                        onChangeText={(text) => setFormData({ ...formData, duration: text })}
                        keyboardType="number-pad"
                      />
                    </>
                  )}
                </View>
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Active</Text>
                  <Text style={styles.switchDescription}>
                    Make this {isSupplier ? 'product' : 'service'} visible to customers
                  </Text>
                </View>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                  trackColor={{ false: colors.gray[200], true: `${config.color}50` }}
                  thumbColor={formData.isActive ? config.color : colors.gray[400]}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: config.color }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color={colors.white} />
                    <Text style={styles.saveButtonText}>
                      {editingItem ? 'Update' : 'Add'} {isSupplier ? 'Product' : 'Service'}
                    </Text>
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
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  listingsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  listingCard: {
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
  listingCardInactive: {
    opacity: 0.7,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeSwitch: {
    transform: [{ scale: 0.8 }],
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${colors.error}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  listingDescription: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
    lineHeight: 20,
  },
  listingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  listingPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.gray[500],
  },
  listingMeta: {
    flexDirection: 'row',
    gap: 12,
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
  inactiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  inactiveText: {
    fontSize: 12,
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
    padding: 24,
    maxHeight: '85%',
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
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray[900],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  textArea: {
    height: 80,
    paddingTop: 14,
  },
  categoryScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 13,
    color: colors.gray[700],
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginBottom: 20,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
});
