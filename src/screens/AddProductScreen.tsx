import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';

const categoryOptions = ['Pet Food', 'Accessories', 'Toys', 'Grooming', 'Health', 'Beds & Furniture', 'Clothing', 'Aquarium'];

export default function AddProductScreen() {
  const navigation = useNavigation<any>();
  const { user, updateUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Product details
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  // Pet type
  const [petType, setPetType] = useState<string[]>([]);
  const petTypes = ['Dogs', 'Cats', 'Birds', 'Fish', 'Rabbits', 'All Pets'];

  const togglePetType = (type: string) => {
    if (petType.includes(type)) {
      setPetType(petType.filter(t => t !== type));
    } else {
      setPetType([...petType, type]);
    }
  };

  const handleAddPhoto = async () => {
    if (photos.length >= 6) {
      Alert.alert('Limit Reached', 'You can only add up to 6 photos per product');
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
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter product name');
      return;
    }
    if (!price.trim()) {
      Alert.alert('Required', 'Please enter product price');
      return;
    }
    if (!category) {
      Alert.alert('Required', 'Please select a category');
      return;
    }

    setIsLoading(true);
    try {
      const newProduct = {
        id: `product_${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        category,
        stock: parseInt(stock) || 0,
        sku: sku.trim(),
        photos,
        petType,
        createdAt: new Date().toISOString(),
        status: 'active',
      };

      const existingProducts = user?.products || [];
      await updateUserProfile({
        products: [...existingProducts, newProduct],
      });

      Alert.alert('Success', 'Product added successfully!', [
        { text: 'Add Another', onPress: () => resetForm() },
        { text: 'View Products', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setDiscountPrice('');
    setCategory('');
    setStock('');
    setSku('');
    setPhotos([]);
    setPetType([]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Product</Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading} style={styles.saveButton}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Photos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Photos ({photos.length}/6)</Text>
            <View style={styles.photosGrid}>
              {[...Array(6)].map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.photoSlot, index === 0 && styles.mainPhotoSlot]}
                  onPress={() => photos[index] ? handleRemovePhoto(index) : handleAddPhoto()}
                >
                  {photos[index] ? (
                    <View style={styles.photoContainer}>
                      <Image source={{ uri: photos[index] }} style={styles.photo} />
                      <View style={styles.removeBtn}>
                        <Ionicons name="close-circle" size={22} color={colors.error} />
                      </View>
                      {index === 0 && (
                        <View style={styles.mainBadge}>
                          <Text style={styles.mainBadgeText}>Main</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="camera-outline" size={24} color={colors.gray[400]} />
                      {index === 0 && <Text style={styles.addPhotoText}>Main</Text>}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter product name"
                value={name}
                onChangeText={setName}
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your product..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.optionsRow}>
                {categoryOptions.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.optionChip, category === cat && styles.optionChipSelected]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.optionChipText, category === cat && styles.optionChipTextSelected]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Suitable For</Text>
              <View style={styles.optionsRow}>
                {petTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.optionChip, petType.includes(type) && styles.optionChipSelected]}
                    onPress={() => togglePetType(type)}
                  >
                    <Text style={[styles.optionChipText, petType.includes(type) && styles.optionChipTextSelected]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing & Stock</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Price (Rs.) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Discount Price</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={discountPrice}
                  onChangeText={setDiscountPrice}
                  keyboardType="numeric"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Stock Quantity</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={stock}
                  onChangeText={setStock}
                  keyboardType="numeric"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>SKU (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Product SKU"
                  value={sku}
                  onChangeText={setSku}
                  placeholderTextColor={colors.gray[400]}
                />
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 16,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoSlot: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  mainPhotoSlot: {
    width: '48%',
  },
  photoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
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
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 11,
    color: colors.gray[400],
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.gray[900],
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  optionChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  optionChipText: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '500',
  },
  optionChipTextSelected: {
    color: colors.white,
  },
});
