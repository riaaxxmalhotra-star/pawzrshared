import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { colors, roleColors, getRoleColor } from '../theme/colors';

const { width } = Dimensions.get('window');

interface Customer {
  id: string;
  name: string;
  image?: string;
  phone: string; // Masked for privacy
  totalBookings: number;
  totalSpent: number;
  lastVisit: string;
  status: 'active' | 'at_risk' | 'churned' | 'new';
  pets: { name: string; type: string }[];
  notes?: string;
}

interface InsightCard {
  id: string;
  type: 'revenue' | 'retention' | 'growth' | 'alert';
  title: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  icon: string;
}

// Mock customers
const mockCustomers: Customer[] = [
  {
    id: 'CUS001',
    name: 'Rahul Kumar',
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    phone: '•••••43210',
    totalBookings: 12,
    totalSpent: 28500,
    lastVisit: '2 days ago',
    status: 'active',
    pets: [{ name: 'Bruno', type: 'Dog' }],
    notes: 'Prefers morning appointments',
  },
  {
    id: 'CUS002',
    name: 'Priya Sharma',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    phone: '•••••32109',
    totalBookings: 8,
    totalSpent: 18200,
    lastVisit: '1 week ago',
    status: 'active',
    pets: [{ name: 'Whiskers', type: 'Cat' }, { name: 'Mittens', type: 'Cat' }],
  },
  {
    id: 'CUS003',
    name: 'Amit Patel',
    phone: '•••••21098',
    totalBookings: 3,
    totalSpent: 4800,
    lastVisit: '3 weeks ago',
    status: 'at_risk',
    pets: [{ name: 'Rocky', type: 'Dog' }],
    notes: 'Hasn\'t booked in 3 weeks - send reminder',
  },
  {
    id: 'CUS004',
    name: 'Neha Gupta',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    phone: '•••••10987',
    totalBookings: 1,
    totalSpent: 1200,
    lastVisit: '2 months ago',
    status: 'churned',
    pets: [{ name: 'Coco', type: 'Dog' }],
  },
  {
    id: 'CUS005',
    name: 'Vikram Singh',
    phone: '•••••23456',
    totalBookings: 1,
    totalSpent: 2500,
    lastVisit: 'Today',
    status: 'new',
    pets: [{ name: 'Max', type: 'Dog' }],
  },
];

// Mock insights
const mockInsights: InsightCard[] = [
  {
    id: 'INS001',
    type: 'revenue',
    title: 'This Month',
    value: '₹48,500',
    change: '+23%',
    changeType: 'up',
    icon: 'cash',
  },
  {
    id: 'INS002',
    type: 'retention',
    title: 'Repeat Rate',
    value: '68%',
    change: '+5%',
    changeType: 'up',
    icon: 'refresh',
  },
  {
    id: 'INS003',
    type: 'growth',
    title: 'New Customers',
    value: '12',
    change: '+4',
    changeType: 'up',
    icon: 'people',
  },
  {
    id: 'INS004',
    type: 'alert',
    title: 'At Risk',
    value: '3',
    change: 'Need attention',
    changeType: 'neutral',
    icon: 'warning',
  },
];

// Automated campaigns
const automatedCampaigns = [
  {
    id: 'CAM001',
    name: 'Welcome Series',
    description: 'Auto-send welcome message to new customers',
    enabled: true,
    sent: 45,
    opened: 38,
  },
  {
    id: 'CAM002',
    name: 'Reminder Nudge',
    description: 'Remind inactive customers after 2 weeks',
    enabled: true,
    sent: 23,
    opened: 15,
  },
  {
    id: 'CAM003',
    name: 'Birthday Special',
    description: 'Send discount on pet\'s birthday',
    enabled: false,
    sent: 0,
    opened: 0,
  },
  {
    id: 'CAM004',
    name: 'Win-back Offer',
    description: 'Special offer to churned customers',
    enabled: true,
    sent: 8,
    opened: 3,
  },
];

export default function VendorCRMScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const userRole = (user?.role || 'VET').toUpperCase();
  const [activeTab, setActiveTab] = useState<'customers' | 'campaigns' | 'insights'>('customers');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'at_risk' | 'churned' | 'new'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [messageText, setMessageText] = useState('');
  const [offerText, setOfferText] = useState('');
  const [offerDiscount, setOfferDiscount] = useState('');

  const getRoleConfig = () => {
    const roleColor = getRoleColor(userRole);
    switch (userRole) {
      case 'VET':
        return { color: roleColor, title: 'Patients' };
      case 'GROOMER':
        return { color: roleColor, title: 'Clients' };
      case 'SUPPLIER':
        return { color: roleColor, title: 'Customers' };
      default:
        return { color: roleColor, title: 'Customers' };
    }
  };

  const config = getRoleConfig();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'at_risk': return '#F59E0B';
      case 'churned': return '#EF4444';
      case 'new': return '#3B82F6';
      default: return colors.gray[500];
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'at_risk': return 'At Risk';
      case 'churned': return 'Churned';
      case 'new': return 'New';
      default: return status;
    }
  };

  const filteredCustomers = selectedFilter === 'all'
    ? mockCustomers
    : mockCustomers.filter(c => c.status === selectedFilter);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  // Handler functions for CRM actions
  const handleMessage = (customer: Customer) => {
    setSelectedCustomer(customer);
    setMessageText('');
    setMessageModalVisible(true);
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedCustomer) return;

    Alert.alert(
      'Message Sent',
      `Your message has been sent to ${selectedCustomer.name}.`,
      [{ text: 'OK' }]
    );
    setMessageModalVisible(false);
    setMessageText('');
    setSelectedCustomer(null);
  };

  const handleOffer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setOfferText('');
    setOfferDiscount('10');
    setOfferModalVisible(true);
  };

  const handleSendOffer = () => {
    if (!selectedCustomer) return;

    Alert.alert(
      'Offer Sent',
      `${offerDiscount}% discount offer sent to ${selectedCustomer.name}!`,
      [{ text: 'OK' }]
    );
    setOfferModalVisible(false);
    setOfferText('');
    setOfferDiscount('');
    setSelectedCustomer(null);
  };

  const handleBook = (customer: Customer) => {
    setSelectedCustomer(customer);
    setBookingModalVisible(true);
  };

  const handleConfirmBooking = (time: string) => {
    if (!selectedCustomer) return;

    Alert.alert(
      'Booking Request Sent',
      `Booking request for ${time} sent to ${selectedCustomer.name}. They'll receive a notification to confirm.`,
      [{ text: 'OK' }]
    );
    setBookingModalVisible(false);
    setSelectedCustomer(null);
  };

  // Render Message Modal
  const renderMessageModal = () => (
    <Modal
      visible={messageModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setMessageModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Message {selectedCustomer?.name}
            </Text>
            <TouchableOpacity onPress={() => setMessageModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.gray[500]} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {selectedCustomer?.pets && selectedCustomer.pets.length > 0 && (
              <View style={styles.petInfo}>
                <Ionicons name="paw" size={16} color={config.color} />
                <Text style={styles.petInfoText}>
                  About: {selectedCustomer.pets.map(p => p.name).join(', ')}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.messageInput}
              placeholder="Type your message..."
              placeholderTextColor={colors.gray[400]}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              numberOfLines={4}
            />

            <View style={styles.quickReplies}>
              <Text style={styles.quickRepliesLabel}>Quick replies:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={styles.quickReplyChip}
                  onPress={() => setMessageText("Hi! Just checking in. How is your pet doing?")}
                >
                  <Text style={styles.quickReplyText}>Check in</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickReplyChip}
                  onPress={() => setMessageText("Time for your pet's regular checkup! Would you like to book an appointment?")}
                >
                  <Text style={styles.quickReplyText}>Reminder</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickReplyChip}
                  onPress={() => setMessageText("Thank you for visiting us! We hope your pet is doing well.")}
                >
                  <Text style={styles.quickReplyText}>Thank you</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: config.color }, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <Ionicons name="send" size={18} color="#fff" />
            <Text style={styles.sendButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Render Offer Modal
  const renderOfferModal = () => (
    <Modal
      visible={offerModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setOfferModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Send Offer to {selectedCustomer?.name}
            </Text>
            <TouchableOpacity onPress={() => setOfferModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.gray[500]} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Discount Percentage</Text>
            <View style={styles.discountRow}>
              {['10', '15', '20', '25'].map((discount) => (
                <TouchableOpacity
                  key={discount}
                  style={[
                    styles.discountChip,
                    offerDiscount === discount && { backgroundColor: config.color },
                  ]}
                  onPress={() => setOfferDiscount(discount)}
                >
                  <Text style={[
                    styles.discountChipText,
                    offerDiscount === discount && { color: '#fff' },
                  ]}>
                    {discount}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Personal Message (Optional)</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Add a personal note..."
              placeholderTextColor={colors.gray[400]}
              value={offerText}
              onChangeText={setOfferText}
              multiline
              numberOfLines={3}
            />

            <View style={styles.offerPreview}>
              <Ionicons name="gift" size={20} color="#F59E0B" />
              <Text style={styles.offerPreviewText}>
                {selectedCustomer?.name} will receive a {offerDiscount}% discount code valid for 7 days
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: '#F59E0B' }]}
            onPress={handleSendOffer}
          >
            <Ionicons name="gift" size={18} color="#fff" />
            <Text style={styles.sendButtonText}>Send Offer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Render Booking Modal
  const renderBookingModal = () => (
    <Modal
      visible={bookingModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setBookingModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Schedule with {selectedCustomer?.name}
            </Text>
            <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.gray[500]} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {selectedCustomer?.pets && selectedCustomer.pets.length > 0 && (
              <View style={styles.petInfo}>
                <Ionicons name="paw" size={16} color={config.color} />
                <Text style={styles.petInfoText}>
                  For: {selectedCustomer.pets.map(p => `${p.name} (${p.type})`).join(', ')}
                </Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Select Time Slot</Text>
            <View style={styles.timeSlots}>
              {['Today, 2:00 PM', 'Today, 4:00 PM', 'Tomorrow, 10:00 AM', 'Tomorrow, 2:00 PM'].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={styles.timeSlot}
                  onPress={() => handleConfirmBooking(time)}
                >
                  <Ionicons name="time-outline" size={18} color={config.color} />
                  <Text style={styles.timeSlotText}>{time}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.gray[400]} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.customTimeButton}>
              <Ionicons name="calendar-outline" size={18} color={config.color} />
              <Text style={[styles.customTimeText, { color: config.color }]}>Choose Custom Date & Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderCustomersTab = () => (
    <>
      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
        {['all', 'active', 'at_risk', 'churned', 'new'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && { backgroundColor: config.color },
            ]}
            onPress={() => setSelectedFilter(filter as any)}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === filter && { color: colors.white },
            ]}>
              {filter === 'all' ? 'All' : getStatusLabel(filter)}
            </Text>
            <View style={[
              styles.filterBadge,
              selectedFilter === filter && { backgroundColor: 'rgba(255,255,255,0.3)' },
            ]}>
              <Text style={[
                styles.filterBadgeText,
                selectedFilter === filter && { color: colors.white },
              ]}>
                {filter === 'all' ? mockCustomers.length : mockCustomers.filter(c => c.status === filter).length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Customer List */}
      {filteredCustomers.map((customer) => (
        <TouchableOpacity key={customer.id} style={styles.customerCard} activeOpacity={0.8}>
          <View style={styles.customerHeader}>
            {customer.image ? (
              <Image source={{ uri: customer.image }} style={styles.customerImage} />
            ) : (
              <View style={[styles.customerImagePlaceholder, { backgroundColor: config.color }]}>
                <Text style={styles.customerInitial}>{customer.name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.customerInfo}>
              <View style={styles.customerNameRow}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(customer.status)}15` }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(customer.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(customer.status) }]}>
                    {getStatusLabel(customer.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.customerPhone}>{customer.phone} • Last: {customer.lastVisit}</Text>
              <View style={styles.petTags}>
                {customer.pets.map((pet, idx) => (
                  <View key={idx} style={styles.petTag}>
                    <Ionicons name="paw" size={12} color={config.color} />
                    <Text style={styles.petTagText}>{pet.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.customerStats}>
            <View style={styles.customerStat}>
              <Text style={styles.customerStatValue}>{customer.totalBookings}</Text>
              <Text style={styles.customerStatLabel}>Bookings</Text>
            </View>
            <View style={styles.customerStatDivider} />
            <View style={styles.customerStat}>
              <Text style={styles.customerStatValue}>₹{customer.totalSpent.toLocaleString()}</Text>
              <Text style={styles.customerStatLabel}>Total Spent</Text>
            </View>
            <View style={styles.customerStatDivider} />
            <View style={styles.customerStat}>
              <Text style={styles.customerStatValue}>₹{Math.round(customer.totalSpent / customer.totalBookings).toLocaleString()}</Text>
              <Text style={styles.customerStatLabel}>Avg Value</Text>
            </View>
          </View>

          {customer.notes && (
            <View style={styles.noteCard}>
              <Ionicons name="document-text-outline" size={16} color={colors.gray[500]} />
              <Text style={styles.noteText}>{customer.notes}</Text>
            </View>
          )}

          <View style={styles.customerActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: `${config.color}15` }]}
              onPress={() => handleMessage(customer)}
            >
              <Ionicons name="chatbubble-outline" size={18} color={config.color} />
              <Text style={[styles.actionButtonText, { color: config.color }]}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FEF3C715' }]}
              onPress={() => handleOffer(customer)}
            >
              <Ionicons name="gift-outline" size={18} color="#F59E0B" />
              <Text style={[styles.actionButtonText, { color: '#F59E0B' }]}>Offer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.gray[100] }]}
              onPress={() => handleBook(customer)}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.gray[700]} />
              <Text style={[styles.actionButtonText, { color: colors.gray[700] }]}>Book</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </>
  );

  const renderCampaignsTab = () => (
    <>
      <View style={styles.campaignHeader}>
        <Text style={styles.campaignTitle}>Automated Campaigns</Text>
        <Text style={styles.campaignSubtitle}>Set up once, run forever. Pawzr handles customer engagement for you.</Text>
      </View>

      {automatedCampaigns.map((campaign) => (
        <View key={campaign.id} style={styles.campaignCard}>
          <View style={styles.campaignInfo}>
            <View style={styles.campaignNameRow}>
              <Text style={styles.campaignName}>{campaign.name}</Text>
              <TouchableOpacity
                style={[
                  styles.campaignToggle,
                  { backgroundColor: campaign.enabled ? '#10B981' : colors.gray[300] },
                ]}
              >
                <View style={[
                  styles.campaignToggleKnob,
                  { alignSelf: campaign.enabled ? 'flex-end' : 'flex-start' },
                ]} />
              </TouchableOpacity>
            </View>
            <Text style={styles.campaignDescription}>{campaign.description}</Text>
          </View>

          {campaign.enabled && campaign.sent > 0 && (
            <View style={styles.campaignStats}>
              <View style={styles.campaignStat}>
                <Text style={styles.campaignStatValue}>{campaign.sent}</Text>
                <Text style={styles.campaignStatLabel}>Sent</Text>
              </View>
              <View style={styles.campaignStat}>
                <Text style={styles.campaignStatValue}>{campaign.opened}</Text>
                <Text style={styles.campaignStatLabel}>Opened</Text>
              </View>
              <View style={styles.campaignStat}>
                <Text style={[styles.campaignStatValue, { color: '#10B981' }]}>
                  {Math.round((campaign.opened / campaign.sent) * 100)}%
                </Text>
                <Text style={styles.campaignStatLabel}>Rate</Text>
              </View>
            </View>
          )}
        </View>
      ))}

      {/* Pro Feature Teaser */}
      <View style={styles.proFeatureCard}>
        <View style={styles.proFeatureHeader}>
          <View style={styles.proBadge}>
            <Ionicons name="diamond" size={14} color="#fff" />
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
          <Text style={styles.proFeatureTitle}>Advanced Automation</Text>
        </View>
        <Text style={styles.proFeatureText}>
          Create custom campaigns, A/B test messages, and get detailed analytics with Pro Partner plan.
        </Text>
        <TouchableOpacity style={styles.upgradeButton}>
          <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
          <Ionicons name="arrow-forward" size={16} color="#8B5CF6" />
        </TouchableOpacity>
      </View>
    </>
  );

  const renderInsightsTab = () => (
    <>
      {/* Insight Cards */}
      <View style={styles.insightsGrid}>
        {mockInsights.map((insight) => (
          <View key={insight.id} style={styles.insightCard}>
            <View style={[
              styles.insightIcon,
              {
                backgroundColor: insight.type === 'alert' ? '#FEF3C715' :
                  insight.type === 'revenue' ? '#D1FAE515' :
                  insight.type === 'retention' ? '#DBEAFE15' : '#EDE9FE15'
              }
            ]}>
              <Ionicons
                name={insight.icon as any}
                size={20}
                color={
                  insight.type === 'alert' ? '#F59E0B' :
                  insight.type === 'revenue' ? '#10B981' :
                  insight.type === 'retention' ? '#3B82F6' : '#8B5CF6'
                }
              />
            </View>
            <Text style={styles.insightValue}>{insight.value}</Text>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <View style={[
              styles.insightChange,
              {
                backgroundColor: insight.changeType === 'up' ? '#D1FAE5' :
                  insight.changeType === 'down' ? '#FEE2E2' : '#FEF3C7'
              }
            ]}>
              {insight.changeType === 'up' && <Ionicons name="trending-up" size={12} color="#10B981" />}
              {insight.changeType === 'down' && <Ionicons name="trending-down" size={12} color="#EF4444" />}
              <Text style={[
                styles.insightChangeText,
                {
                  color: insight.changeType === 'up' ? '#10B981' :
                    insight.changeType === 'down' ? '#EF4444' : '#D97706'
                }
              ]}>
                {insight.change}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Key Metrics */}
      <Text style={styles.sectionTitle}>Key Metrics</Text>
      <View style={styles.metricCard}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Average Booking Value</Text>
          <Text style={styles.metricValue}>₹1,850</Text>
        </View>
        <View style={styles.metricBar}>
          <View style={[styles.metricBarFill, { width: '75%', backgroundColor: config.color }]} />
        </View>
      </View>
      <View style={styles.metricCard}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Customer Lifetime Value</Text>
          <Text style={styles.metricValue}>₹12,400</Text>
        </View>
        <View style={styles.metricBar}>
          <View style={[styles.metricBarFill, { width: '60%', backgroundColor: '#10B981' }]} />
        </View>
      </View>
      <View style={styles.metricCard}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Booking Conversion Rate</Text>
          <Text style={styles.metricValue}>42%</Text>
        </View>
        <View style={styles.metricBar}>
          <View style={[styles.metricBarFill, { width: '42%', backgroundColor: '#F59E0B' }]} />
        </View>
      </View>

      {/* Recommendations */}
      <Text style={styles.sectionTitle}>AI Recommendations</Text>
      <View style={styles.recommendationCard}>
        <View style={[styles.recommendationIcon, { backgroundColor: '#FEF3C715' }]}>
          <Ionicons name="bulb" size={20} color="#F59E0B" />
        </View>
        <View style={styles.recommendationContent}>
          <Text style={styles.recommendationTitle}>Send Reminder to At-Risk Customers</Text>
          <Text style={styles.recommendationText}>3 customers haven't visited in 2+ weeks. A quick message could bring them back.</Text>
        </View>
        <TouchableOpacity style={styles.recommendationAction}>
          <Ionicons name="send" size={18} color={config.color} />
        </TouchableOpacity>
      </View>
      <View style={styles.recommendationCard}>
        <View style={[styles.recommendationIcon, { backgroundColor: '#D1FAE515' }]}>
          <Ionicons name="gift" size={20} color="#10B981" />
        </View>
        <View style={styles.recommendationContent}>
          <Text style={styles.recommendationTitle}>Loyalty Reward Ready</Text>
          <Text style={styles.recommendationText}>2 customers reached 10+ bookings. Send a thank you offer!</Text>
        </View>
        <TouchableOpacity style={styles.recommendationAction}>
          <Ionicons name="arrow-forward" size={18} color={config.color} />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Modals */}
      {renderMessageModal()}
      {renderOfferModal()}
      {renderBookingModal()}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CRM Dashboard</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'customers' && { borderBottomColor: config.color }]}
          onPress={() => setActiveTab('customers')}
        >
          <Ionicons
            name="people-outline"
            size={20}
            color={activeTab === 'customers' ? config.color : colors.gray[500]}
          />
          <Text style={[styles.tabText, activeTab === 'customers' && { color: config.color }]}>
            {config.title}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'campaigns' && { borderBottomColor: config.color }]}
          onPress={() => setActiveTab('campaigns')}
        >
          <Ionicons
            name="megaphone-outline"
            size={20}
            color={activeTab === 'campaigns' ? config.color : colors.gray[500]}
          />
          <Text style={[styles.tabText, activeTab === 'campaigns' && { color: config.color }]}>
            Campaigns
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'insights' && { borderBottomColor: config.color }]}
          onPress={() => setActiveTab('insights')}
        >
          <Ionicons
            name="analytics-outline"
            size={20}
            color={activeTab === 'insights' ? config.color : colors.gray[500]}
          />
          <Text style={[styles.tabText, activeTab === 'insights' && { color: config.color }]}>
            Insights
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={config.color} />
        }
      >
        {activeTab === 'customers' && renderCustomersTab()}
        {activeTab === 'campaigns' && renderCampaignsTab()}
        {activeTab === 'insights' && renderInsightsTab()}

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
  settingsButton: {
    padding: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
  },
  scrollContent: {
    padding: 16,
  },
  filterTabs: {
    marginBottom: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    gap: 6,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[600],
  },
  filterBadge: {
    backgroundColor: colors.gray[200],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[700],
  },
  customerCard: {
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
  customerHeader: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  customerImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  customerImagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  customerInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  customerInfo: {
    flex: 1,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  customerPhone: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 8,
  },
  petTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  petTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  petTagText: {
    fontSize: 12,
    color: colors.gray[700],
  },
  customerStats: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  customerStat: {
    flex: 1,
    alignItems: 'center',
  },
  customerStatDivider: {
    width: 1,
    backgroundColor: colors.gray[200],
  },
  customerStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
  },
  customerStatLabel: {
    fontSize: 11,
    color: colors.gray[500],
    marginTop: 2,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  customerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  campaignHeader: {
    marginBottom: 20,
  },
  campaignTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 6,
  },
  campaignSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
  campaignCard: {
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
  campaignInfo: {
    marginBottom: 12,
  },
  campaignNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  campaignName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  campaignToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  campaignToggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  campaignDescription: {
    fontSize: 13,
    color: colors.gray[600],
  },
  campaignStats: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    borderRadius: 10,
    padding: 10,
  },
  campaignStat: {
    flex: 1,
    alignItems: 'center',
  },
  campaignStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
  },
  campaignStatLabel: {
    fontSize: 11,
    color: colors.gray[500],
  },
  proFeatureCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 14,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  proFeatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  proFeatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B21B6',
  },
  proFeatureText: {
    fontSize: 13,
    color: '#6D28D9',
    lineHeight: 18,
    marginBottom: 14,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderRadius: 10,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  insightCard: {
    width: (width - 42) / 2,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  insightValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  insightTitle: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 8,
  },
  insightChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  insightChangeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
  },
  metricCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 14,
    color: colors.gray[700],
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
  },
  metricBar: {
    height: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 3,
  },
  metricBarFill: {
    height: 6,
    borderRadius: 3,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  recommendationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    color: colors.gray[600],
    lineHeight: 16,
  },
  recommendationAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  modalBody: {
    padding: 20,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.gray[50],
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  petInfoText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  messageInput: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: colors.gray[900],
    minHeight: 100,
    textAlignVertical: 'top',
  },
  quickReplies: {
    marginTop: 16,
  },
  quickRepliesLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 8,
  },
  quickReplyChip: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  quickReplyText: {
    fontSize: 13,
    color: colors.gray[700],
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: 10,
  },
  discountRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  discountChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  discountChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  offerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
  },
  offerPreviewText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  timeSlots: {
    gap: 8,
    marginBottom: 16,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.gray[50],
    padding: 14,
    borderRadius: 12,
  },
  timeSlotText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[900],
  },
  customTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  customTimeText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
