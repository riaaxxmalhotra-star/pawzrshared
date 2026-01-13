import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
  status: 'active' | 'low_stock' | 'out_of_stock';
}

// Mock inventory data
const mockInventory: Product[] = [
  {
    id: '1',
    name: 'Premium Dog Food 5kg',
    category: 'Pet Food',
    price: 1200,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=200',
    status: 'active',
  },
  {
    id: '2',
    name: 'Cat Litter 10kg',
    category: 'Pet Food',
    price: 800,
    stock: 5,
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=200',
    status: 'low_stock',
  },
  {
    id: '3',
    name: 'Chew Toys Set',
    category: 'Toys',
    price: 450,
    stock: 0,
    image: 'https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=200',
    status: 'out_of_stock',
  },
  {
    id: '4',
    name: 'Pet Grooming Kit',
    category: 'Grooming',
    price: 1500,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=200',
    status: 'active',
  },
  {
    id: '5',
    name: 'Dog Bed Large',
    category: 'Beds & Furniture',
    price: 2500,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=200',
    status: 'active',
  },
  {
    id: '6',
    name: 'Pet Shampoo 500ml',
    category: 'Grooming',
    price: 350,
    stock: 3,
    image: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=200',
    status: 'low_stock',
  },
];

export default function InventoryScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'low_stock' | 'out_of_stock'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editStock, setEditStock] = useState('');

  const tabs: { key: 'all' | 'active' | 'low_stock' | 'out_of_stock'; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: mockInventory.length },
    { key: 'active', label: 'In Stock', count: mockInventory.filter(p => p.status === 'active').length },
    { key: 'low_stock', label: 'Low Stock', count: mockInventory.filter(p => p.status === 'low_stock').length },
    { key: 'out_of_stock', label: 'Out of Stock', count: mockInventory.filter(p => p.status === 'out_of_stock').length },
  ];

  const filteredProducts = mockInventory
    .filter(p => selectedTab === 'all' || p.status === selectedTab)
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'low_stock': return '#F59E0B';
      case 'out_of_stock': return '#EF4444';
      default: return colors.gray[500];
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleUpdateStock = (productId: string) => {
    const newStock = parseInt(editStock);
    if (isNaN(newStock) || newStock < 0) {
      Alert.alert('Invalid', 'Please enter a valid stock quantity');
      return;
    }
    Alert.alert('Success', `Stock updated to ${newStock}`);
    setEditingProduct(null);
    setEditStock('');
  };

  const stats = {
    totalProducts: mockInventory.length,
    lowStock: mockInventory.filter(p => p.status === 'low_stock').length,
    outOfStock: mockInventory.filter(p => p.status === 'out_of_stock').length,
    totalValue: mockInventory.reduce((sum, p) => sum + (p.price * p.stock), 0),
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Ionicons name="add" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
          <Ionicons name="cube-outline" size={24} color="#3B82F6" />
          <Text style={[styles.statNumber, { color: '#1D4ED8' }]}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="alert-circle-outline" size={24} color="#D97706" />
          <Text style={[styles.statNumber, { color: '#D97706' }]}>{stats.lowStock}</Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name="close-circle-outline" size={24} color="#DC2626" />
          <Text style={[styles.statNumber, { color: '#DC2626' }]}>{stats.outOfStock}</Text>
          <Text style={styles.statLabel}>Out of Stock</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <Ionicons name="cash-outline" size={24} color="#059669" />
          <Text style={[styles.statNumber, { color: '#059669' }]}>Rs.{(stats.totalValue / 1000).toFixed(0)}k</Text>
          <Text style={styles.statLabel}>Stock Value</Text>
        </View>
      </ScrollView>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.gray[400]}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.tabSelected]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextSelected]}>
              {tab.label}
            </Text>
            <View style={[styles.tabBadge, selectedTab === tab.key && styles.tabBadgeSelected]}>
              <Text style={[styles.tabBadgeText, selectedTab === tab.key && styles.tabBadgeTextSelected]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={60} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>Add products to manage your inventory</Text>
            <TouchableOpacity
              style={styles.addProductBtn}
              onPress={() => navigation.navigate('AddProduct')}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addProductBtnText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredProducts.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productRow}>
                {product.image ? (
                  <Image source={{ uri: product.image }} style={styles.productImage} />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons name="cube-outline" size={24} color={colors.gray[400]} />
                  </View>
                )}

                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productCategory}>{product.category}</Text>
                  <Text style={styles.productPrice}>Rs.{product.price}</Text>
                </View>

                <View style={styles.stockSection}>
                  {editingProduct === product.id ? (
                    <View style={styles.editStockContainer}>
                      <TextInput
                        style={styles.stockInput}
                        value={editStock}
                        onChangeText={setEditStock}
                        keyboardType="numeric"
                        autoFocus
                        placeholder="Qty"
                      />
                      <TouchableOpacity
                        style={styles.saveStockBtn}
                        onPress={() => handleUpdateStock(product.id)}
                      >
                        <Ionicons name="checkmark" size={18} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelStockBtn}
                        onPress={() => {
                          setEditingProduct(null);
                          setEditStock('');
                        }}
                      >
                        <Ionicons name="close" size={18} color={colors.gray[600]} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.stockDisplay}
                      onPress={() => {
                        setEditingProduct(product.id);
                        setEditStock(product.stock.toString());
                      }}
                    >
                      <View style={[styles.stockBadge, { backgroundColor: `${getStatusColor(product.status)}15` }]}>
                        <Text style={[styles.stockNumber, { color: getStatusColor(product.status) }]}>
                          {product.stock}
                        </Text>
                        <Text style={[styles.stockLabel, { color: getStatusColor(product.status) }]}>
                          in stock
                        </Text>
                      </View>
                      <Ionicons name="pencil-outline" size={14} color={colors.gray[400]} style={{ marginTop: 4 }} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.quickActionBtn}>
                  <Ionicons name="eye-outline" size={16} color={colors.gray[600]} />
                  <Text style={styles.quickActionText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionBtn}>
                  <Ionicons name="create-outline" size={16} color={colors.gray[600]} />
                  <Text style={styles.quickActionText}>Edit</Text>
                </TouchableOpacity>
                {product.status === 'out_of_stock' && (
                  <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: '#3B82F615' }]}>
                    <Ionicons name="refresh-outline" size={16} color="#3B82F6" />
                    <Text style={[styles.quickActionText, { color: '#3B82F6' }]}>Restock</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
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
  addButton: {
    padding: 8,
  },
  statsRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statCard: {
    width: 100,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginRight: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray[600],
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[900],
  },
  tabsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    gap: 6,
  },
  tabSelected: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[600],
  },
  tabTextSelected: {
    color: colors.white,
  },
  tabBadge: {
    backgroundColor: colors.gray[200],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[600],
  },
  tabBadgeTextSelected: {
    color: colors.white,
  },
  scrollContent: {
    padding: 16,
  },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  stockSection: {
    alignItems: 'center',
  },
  stockDisplay: {
    alignItems: 'center',
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  stockNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  stockLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  editStockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockInput: {
    width: 50,
    height: 36,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  saveStockBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelStockBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: 8,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.gray[50],
    gap: 4,
  },
  quickActionText: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: 8,
  },
  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    gap: 6,
  },
  addProductBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
});
