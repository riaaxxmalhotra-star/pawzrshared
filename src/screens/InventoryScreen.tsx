import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';
import { productsApi } from '../lib/api';
import logger from '../lib/logger';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
  status: 'active' | 'low_stock' | 'out_of_stock';
}

// Stock bands are derived client-side so the screen works even when the
// backend only returns raw stock counts.
function statusForStock(stock: number): Product['status'] {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= 5) return 'low_stock';
  return 'active';
}

export default function InventoryScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'low_stock' | 'out_of_stock'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editStock, setEditStock] = useState('');
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingStock, setSavingStock] = useState(false);

  const loadInventory = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await productsApi.getMyProducts();
      const list = data.products || data.data || data || [];
      setInventory(
        (Array.isArray(list) ? list : [])
          .map((p: any) => {
            const id = p?.id ?? p?._id;
            if (id === undefined || id === null) return null;
            const stock = Number(p.stock ?? p.quantity ?? 0);
            return {
              id: String(id),
              name: String(p.name ?? 'Product'),
              category: String(p.category ?? ''),
              price: Number(p.price ?? 0),
              stock,
              image: p.image ?? p.photos?.[0],
              status: statusForStock(stock),
            } as Product;
          })
          .filter((p): p is Product => p !== null)
      );
    } catch (error) {
      logger.error('Failed to load inventory:', error);
      setInventory([]);
      setLoadError(error instanceof Error ? error.message : 'Could not load inventory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const tabs: { key: 'all' | 'active' | 'low_stock' | 'out_of_stock'; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: inventory.length },
    { key: 'active', label: 'In Stock', count: inventory.filter(p => p.status === 'active').length },
    { key: 'low_stock', label: 'Low Stock', count: inventory.filter(p => p.status === 'low_stock').length },
    { key: 'out_of_stock', label: 'Out of Stock', count: inventory.filter(p => p.status === 'out_of_stock').length },
  ];

  const filteredProducts = inventory
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
    loadInventory();
  };

  const handleUpdateStock = async (productId: string) => {
    const newStock = parseInt(editStock, 10);
    if (isNaN(newStock) || newStock < 0) {
      Alert.alert('Invalid', 'Please enter a valid stock quantity');
      return;
    }
    setSavingStock(true);
    try {
      await productsApi.updateProduct(productId, { stock: newStock });
      setInventory(prev =>
        prev.map(p => (p.id === productId ? { ...p, stock: newStock, status: statusForStock(newStock) } : p))
      );
      Alert.alert('Success', `Stock updated to ${newStock}`);
      setEditingProduct(null);
      setEditStock('');
    } catch (error) {
      logger.error('Stock update failed:', error);
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSavingStock(false);
    }
  };

  const stats = {
    totalProducts: inventory.length,
    lowStock: inventory.filter(p => p.status === 'low_stock').length,
    outOfStock: inventory.filter(p => p.status === 'out_of_stock').length,
    totalValue: inventory.reduce((sum, p) => sum + (p.price * p.stock), 0),
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerStateText}>Loading inventory...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.gray[300]} />
          <Text style={styles.centerStateTitle}>Could not load inventory</Text>
          <Text style={styles.centerStateText}>{loadError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => { setLoading(true); loadInventory(); }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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
                        style={[styles.saveStockBtn, savingStock && styles.saveStockBtnDisabled]}
                        onPress={() => handleUpdateStock(product.id)}
                        disabled={savingStock}
                      >
                        {savingStock ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Ionicons name="checkmark" size={18} color="#fff" />
                        )}
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
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  saveStockBtnDisabled: {
    opacity: 0.6,
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
