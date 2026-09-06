import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  commission: string;
  popular?: boolean;
  description: string;
  features: PlanFeature[];
  color: string;
  icon: string;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    period: 'Forever Free',
    commission: '10%',
    description: 'Perfect for getting started on Pawzr',
    color: '#6B7280',
    icon: 'leaf-outline',
    features: [
      { text: 'Listing on Pawzr', included: true },
      { text: 'Up to 10 bookings/month', included: true },
      { text: 'Basic profile & services', included: true },
      { text: 'Standard search ranking', included: true },
      { text: 'Pawzr payment processing', included: true },
      { text: 'Priority listing', included: false },
      { text: 'Analytics dashboard', included: false },
      { text: 'CRM & retention tools', included: false },
      { text: 'Verified badge', included: false },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 2999,
    period: '/month',
    commission: '5%',
    popular: true,
    description: 'For growing pet care businesses',
    color: '#F97316',
    icon: 'trending-up',
    features: [
      { text: 'Everything in Starter', included: true },
      { text: 'Unlimited bookings', included: true, highlight: true },
      { text: 'Lower commission (5%)', included: true, highlight: true },
      { text: 'Priority listing in search', included: true },
      { text: 'Booking calendar + reminders', included: true },
      { text: 'Basic analytics & insights', included: true },
      { text: 'Pawzr chat access', included: true },
      { text: 'Loyalty program participation', included: true },
      { text: 'Verified Partner badge', included: true, highlight: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro Partner',
    price: 7999,
    period: '/month',
    commission: '3%',
    description: 'For clinics, chains & premium brands',
    color: '#8B5CF6',
    icon: 'diamond',
    features: [
      { text: 'Everything in Growth', included: true },
      { text: 'Lowest commission (3%)', included: true, highlight: true },
      { text: 'Top placement + featured', included: true, highlight: true },
      { text: 'Advanced analytics & CRM', included: true },
      { text: 'Customer retention tools', included: true },
      { text: 'Custom discounts & bundles', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Early access to features', included: true },
      { text: 'Premium Partner badge', included: true, highlight: true },
    ],
  },
];

export default function SubscriptionScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const userRole = (user?.role || 'VET').toUpperCase();
  const [selectedPlan, setSelectedPlan] = useState<string>('growth');
  const [currentPlan] = useState<string>('starter'); // Mock current plan

  const getRoleConfig = () => {
    switch (userRole) {
      case 'VET':
        return { color: '#10B981', title: 'Clinic' };
      case 'GROOMER':
        return { color: '#8B5CF6', title: 'Salon' };
      case 'SUPPLIER':
        return { color: '#3B82F6', title: 'Store' };
      default:
        return { color: '#F97316', title: 'Business' };
    }
  };

  const config = getRoleConfig();

  const handleSubscribe = (planId: string) => {
    if (planId === currentPlan) {
      Alert.alert('Current Plan', 'You are already on this plan.');
      return;
    }

    const plan = subscriptionPlans.find(p => p.id === planId);
    if (plan) {
      // No checkout backend exists — never claim the user was charged or that
      // benefits are active. Plans are a preview until payments land.
      Alert.alert(
        'Subscriptions coming soon',
        `${plan.name} (₹${plan.price.toLocaleString()}${plan.period}) is a preview. Checkout is not available yet, so no payment was taken and no plan was changed.`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pawzr Plans</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.heroIcon, { backgroundColor: `${config.color}15` }]}>
            <Ionicons name="rocket" size={32} color={config.color} />
          </View>
          <Text style={styles.heroTitle}>Grow Your {config.title}</Text>
          <Text style={styles.heroSubtitle}>
            Choose a plan that helps you get more bookings, retain customers, and increase revenue.
          </Text>
        </View>

        {/* Current Plan Badge */}
        <View style={styles.currentPlanBadge}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          <Text style={styles.currentPlanText}>
            Current Plan: <Text style={styles.currentPlanName}>Starter (Free)</Text>
          </Text>
        </View>

        {/* Plans */}
        {subscriptionPlans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              selectedPlan === plan.id && { borderColor: plan.color, borderWidth: 2 },
              plan.popular && styles.popularPlan,
            ]}
            onPress={() => setSelectedPlan(plan.id)}
            activeOpacity={0.8}
          >
            {plan.popular && (
              <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                <Ionicons name="star" size={12} color="#fff" />
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <View style={[styles.planIcon, { backgroundColor: `${plan.color}15` }]}>
                <Ionicons name={plan.icon as any} size={24} color={plan.color} />
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>
              </View>
              <View style={styles.planPricing}>
                {plan.price === 0 ? (
                  <Text style={[styles.planPrice, { color: plan.color }]}>Free</Text>
                ) : (
                  <>
                    <Text style={[styles.planPrice, { color: plan.color }]}>₹{plan.price.toLocaleString()}</Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </>
                )}
              </View>
            </View>

            {/* Commission Badge */}
            <View style={[styles.commissionBadge, { backgroundColor: `${plan.color}10` }]}>
              <Ionicons name="receipt-outline" size={16} color={plan.color} />
              <Text style={[styles.commissionText, { color: plan.color }]}>
                {plan.commission} commission per booking
              </Text>
            </View>

            {/* Features */}
            <View style={styles.featuresList}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons
                    name={feature.included ? 'checkmark-circle' : 'close-circle'}
                    size={18}
                    color={feature.included ? (feature.highlight ? plan.color : '#10B981') : colors.gray[300]}
                  />
                  <Text style={[
                    styles.featureText,
                    !feature.included && styles.featureTextDisabled,
                    feature.highlight && { color: plan.color, fontWeight: '600' },
                  ]}>
                    {feature.text}
                  </Text>
                </View>
              ))}
            </View>

            {/* Subscribe Button */}
            <TouchableOpacity
              style={[
                styles.subscribeButton,
                { backgroundColor: selectedPlan === plan.id ? plan.color : colors.gray[100] },
                currentPlan === plan.id && styles.currentPlanButton,
              ]}
              onPress={() => handleSubscribe(plan.id)}
              disabled={currentPlan === plan.id}
            >
              <Text style={[
                styles.subscribeButtonText,
                { color: selectedPlan === plan.id ? '#fff' : colors.gray[600] },
                currentPlan === plan.id && { color: colors.gray[500] },
              ]}>
                {currentPlan === plan.id ? 'Current Plan' : plan.price === 0 ? 'Get Started' : 'Subscribe Now'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <Text style={styles.previewNote}>
          Plans shown are a preview — checkout is not live yet, so tapping a plan changes nothing.
        </Text>

        {/* Value Props */}
        <View style={styles.valueSection}>
          <Text style={styles.valueSectionTitle}>Why Pawzr Subscription?</Text>

          <View style={styles.valueCard}>
            <View style={[styles.valueIcon, { backgroundColor: '#FEF3C715' }]}>
              <Ionicons name="cash-outline" size={24} color="#F59E0B" />
            </View>
            <View style={styles.valueContent}>
              <Text style={styles.valueTitle}>Lower Commission = Higher Profits</Text>
              <Text style={styles.valueText}>Save up to 7% on every booking. Recover subscription cost in just 2-3 bookings.</Text>
            </View>
          </View>

          <View style={styles.valueCard}>
            <View style={[styles.valueIcon, { backgroundColor: '#DBEAFE15' }]}>
              <Ionicons name="eye-outline" size={24} color="#3B82F6" />
            </View>
            <View style={styles.valueContent}>
              <Text style={styles.valueTitle}>Priority Visibility</Text>
              <Text style={styles.valueText}>Appear at the top of search results. Get 3x more views than free listings.</Text>
            </View>
          </View>

          <View style={styles.valueCard}>
            <View style={[styles.valueIcon, { backgroundColor: '#D1FAE515' }]}>
              <Ionicons name="repeat-outline" size={24} color="#10B981" />
            </View>
            <View style={styles.valueContent}>
              <Text style={styles.valueTitle}>Customer Retention Tools</Text>
              <Text style={styles.valueText}>CRM, analytics, and automated follow-ups to keep customers coming back.</Text>
            </View>
          </View>

          <View style={styles.valueCard}>
            <View style={[styles.valueIcon, { backgroundColor: '#EDE9FE15' }]}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.valueContent}>
              <Text style={styles.valueTitle}>Trust & Credibility</Text>
              <Text style={styles.valueText}>Verified badges increase booking rate by 40%. Stand out from competition.</Text>
            </View>
          </View>
        </View>

        {/* ROI Calculator */}
        <View style={styles.roiCard}>
          <Text style={styles.roiTitle}>Quick ROI Check</Text>
          <View style={styles.roiContent}>
            <View style={styles.roiRow}>
              <Text style={styles.roiLabel}>Average booking value</Text>
              <Text style={styles.roiValue}>₹1,200</Text>
            </View>
            <View style={styles.roiRow}>
              <Text style={styles.roiLabel}>Monthly bookings</Text>
              <Text style={styles.roiValue}>30</Text>
            </View>
            <View style={styles.roiDivider} />
            <View style={styles.roiRow}>
              <Text style={styles.roiLabel}>Free plan commission (10%)</Text>
              <Text style={[styles.roiValue, { color: '#EF4444' }]}>-₹3,600</Text>
            </View>
            <View style={styles.roiRow}>
              <Text style={styles.roiLabel}>Growth plan cost</Text>
              <Text style={[styles.roiValue, { color: '#F59E0B' }]}>-₹2,999 + ₹1,800</Text>
            </View>
            <View style={styles.roiDivider} />
            <View style={styles.roiRow}>
              <Text style={[styles.roiLabel, { fontWeight: '700', color: '#10B981' }]}>Your monthly savings</Text>
              <Text style={[styles.roiValue, { fontWeight: '700', color: '#10B981' }]}>₹801+</Text>
            </View>
          </View>
          <Text style={styles.roiNote}>+ Priority visibility = more bookings = even higher returns</Text>
        </View>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Common Questions</Text>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I cancel anytime?</Text>
            <Text style={styles.faqAnswer}>Yes! No lock-in period. Cancel anytime from settings.</Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>When do I get charged?</Text>
            <Text style={styles.faqAnswer}>Subscription is charged monthly. Commission is deducted per booking.</Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What happens if I downgrade?</Text>
            <Text style={styles.faqAnswer}>Your benefits will adjust at the next billing cycle. No penalty.</Text>
          </View>
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
  scrollContent: {
    padding: 16,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
  },
  currentPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  currentPlanText: {
    fontSize: 14,
    color: '#065F46',
  },
  currentPlanName: {
    fontWeight: '700',
  },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray[100],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  popularPlan: {
    paddingTop: 36,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  planDescription: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  planPricing: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  planPeriod: {
    fontSize: 12,
    color: colors.gray[500],
  },
  commissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  commissionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  featureTextDisabled: {
    color: colors.gray[400],
  },
  subscribeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  previewNote: {
    fontSize: 13,
    color: colors.gray[500],
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  subscribeButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  currentPlanButton: {
    backgroundColor: colors.gray[100],
  },
  valueSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  valueSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 16,
  },
  valueCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  valueIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  valueContent: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  valueText: {
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 18,
  },
  roiCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  roiTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 16,
  },
  roiContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  roiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  roiLabel: {
    fontSize: 14,
    color: colors.gray[700],
  },
  roiValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
  },
  roiDivider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 10,
  },
  roiNote: {
    fontSize: 12,
    color: '#92400E',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  faqSection: {
    marginBottom: 20,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 16,
  },
  faqItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 18,
  },
});
