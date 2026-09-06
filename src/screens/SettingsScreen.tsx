import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { deleteAccount } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is permanent and cannot be undone. All your data, pets, bookings, and messages will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This will permanently delete your Pawzr account and all associated data. Are you absolutely sure?',
              [
                { text: 'Keep Account', style: 'cancel' },
                {
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAccount();
                    } catch {
                      Alert.alert('Error', 'Failed to delete account. Please try again or contact support@pawzr.com.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#8B5CF615' }]}>
                <Ionicons name="notifications" size={20} color="#8B5CF6" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDesc}>Receive push notifications</Text>
              </View>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: colors.gray[200], true: `${colors.primary}50` }}
              thumbColor={pushEnabled ? colors.primary : colors.gray[400]}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#3B82F615' }]}>
                <Ionicons name="mail" size={20} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Email Notifications</Text>
                <Text style={styles.settingDesc}>Receive email updates</Text>
              </View>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={setEmailEnabled}
              trackColor={{ false: colors.gray[200], true: `${colors.primary}50` }}
              thumbColor={emailEnabled ? colors.primary : colors.gray[400]}
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="location" size={20} color="#10B981" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Location Services</Text>
                <Text style={styles.settingDesc}>Allow location access</Text>
              </View>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: colors.gray[200], true: `${colors.primary}50` }}
              thumbColor={locationEnabled ? colors.primary : colors.gray[400]}
            />
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => WebBrowser.openBrowserAsync('https://pawzrpro.vercel.app/privacy')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#F59E0B15' }]}>
                <Ionicons name="shield" size={20} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Privacy Policy</Text>
                <Text style={styles.settingDesc}>Read our privacy policy</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => WebBrowser.openBrowserAsync('https://pawzrpro.vercel.app/terms')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#EF444415' }]}>
                <Ionicons name="document-text" size={20} color="#EF4444" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Terms of Service</Text>
                <Text style={styles.settingDesc}>Read our terms</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>App Version</Text>
                <Text style={styles.settingDesc}>v1.3.0</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#3B82F615' }]}>
                <Ionicons name="help-circle" size={20} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Help & Support</Text>
                <Text style={styles.settingDesc}>Get help with Pawzr</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#EF444415' }]}>
                <Ionicons name="trash" size={20} color="#EF4444" />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Delete Account</Text>
                <Text style={styles.settingDesc}>Permanently delete your account and data</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[50],
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray[900],
  },
  settingDesc: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
});
