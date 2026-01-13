import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { messagesApi } from '../lib/api';
import { useAuth } from '../lib/auth';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
  online: boolean;
  recipientId?: string;
}

interface Message {
  id: string;
  text: string;
  content?: string;
  sent: boolean;
  time: string;
  createdAt?: string;
}

interface Provider {
  id: string;
  name: string;
  type: 'vet' | 'groomer' | 'supplier' | 'lover' | 'owner';
  specialty?: string;
  rating: number;
  online: boolean;
}

// Mock providers for starting new conversations
const mockProviders: Provider[] = [
  { id: 'v1', name: 'Dr. Sarah Sharma', type: 'vet', specialty: 'General Medicine', rating: 4.9, online: true },
  { id: 'v2', name: 'Dr. Amit Kumar', type: 'vet', specialty: 'Surgery', rating: 4.8, online: false },
  { id: 'g1', name: 'PetSpa Studio', type: 'groomer', specialty: 'Full Grooming', rating: 4.7, online: true },
  { id: 'g2', name: 'Fluffy Tails', type: 'groomer', specialty: 'Dog Grooming', rating: 4.6, online: false },
  { id: 's1', name: 'Pet Paradise Store', type: 'supplier', specialty: 'Pet Food & Accessories', rating: 4.8, online: true },
  { id: 's2', name: 'Happy Paws Shop', type: 'supplier', specialty: 'Premium Pet Products', rating: 4.5, online: false },
  { id: 'l1', name: 'Priya Mehta', type: 'lover', specialty: 'Dog Walking & Pet Sitting', rating: 4.9, online: true },
  { id: 'l2', name: 'Rahul Singh', type: 'lover', specialty: 'Cat Care Specialist', rating: 4.7, online: false },
];

// Mock pet owners for providers to chat with
const mockPetOwners: Provider[] = [
  { id: 'o1', name: 'Anita Desai', type: 'owner', specialty: '2 Dogs, 1 Cat', rating: 5.0, online: true },
  { id: 'o2', name: 'Vikram Patel', type: 'owner', specialty: 'Golden Retriever', rating: 5.0, online: false },
  { id: 'o3', name: 'Meera Sharma', type: 'owner', specialty: '3 Cats', rating: 5.0, online: true },
];

export default function MessagesScreen() {
  const { user } = useAuth();
  const userRole = (user?.role || 'OWNER').toUpperCase();
  const isOwner = !['VET', 'GROOMER', 'SUPPLIER', 'LOVER'].includes(userRole);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [providerFilter, setProviderFilter] = useState<'all' | 'vet' | 'groomer' | 'supplier' | 'lover' | 'owner'>('all');
  const scrollViewRef = useRef<ScrollView>(null);

  // Get contacts based on user role
  const getContactsList = () => {
    if (isOwner) {
      // Pet owners can chat with vets, groomers, suppliers, and pet lovers
      if (providerFilter === 'all') return mockProviders;
      return mockProviders.filter(p => p.type === providerFilter);
    } else {
      // Providers can chat with pet owners and other providers
      if (providerFilter === 'all') return [...mockPetOwners, ...mockProviders.filter(p => p.type !== userRole.toLowerCase())];
      if (providerFilter === 'owner') return mockPetOwners;
      return mockProviders.filter(p => p.type === providerFilter);
    }
  };

  const filteredProviders = getContactsList();

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'vet': return 'medical';
      case 'groomer': return 'cut';
      case 'supplier': return 'storefront';
      case 'lover': return 'heart';
      case 'owner': return 'paw';
      default: return 'person';
    }
  };

  const getProviderColor = (type: string) => {
    switch (type) {
      case 'vet': return '#10B981';
      case 'groomer': return '#8B5CF6';
      case 'supplier': return '#3B82F6';
      case 'lover': return '#EC4899';
      case 'owner': return '#F59E0B';
      default: return colors.primary;
    }
  };

  const startConversation = (provider: Provider) => {
    // Create a new conversation with the provider
    const newConversation: Conversation = {
      id: `conv_${provider.id}_${Date.now()}`,
      name: provider.name,
      lastMessage: '',
      time: 'Just now',
      unread: 0,
      avatar: getAvatarEmoji(provider.type),
      online: provider.online,
      recipientId: provider.id,
    };

    setConversations([newConversation, ...conversations]);
    setSelectedConversation(newConversation);
    setShowNewChatModal(false);
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const data = await messagesApi.getConversations();
      const convos = (data.conversations || data || []).map((c: any) => ({
        id: c.id,
        name: c.otherUser?.name || c.name || 'Unknown',
        lastMessage: c.lastMessage?.content || c.lastMessage || '',
        time: formatTime(c.updatedAt || c.lastMessage?.createdAt),
        unread: c.unreadCount || 0,
        avatar: getAvatarEmoji(c.otherUser?.role || c.type),
        online: c.otherUser?.online || false,
        recipientId: c.otherUser?.id,
      }));
      setConversations(convos);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const data = await messagesApi.getMessages(conversationId);
      const msgs = (data.messages || data || []).map((m: any) => ({
        id: m.id,
        text: m.content || m.text,
        sent: m.sent || m.isOwn || false,
        time: formatMessageTime(m.createdAt),
      }));
      setMessages(msgs);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const formatTime = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString();
  };

  const formatMessageTime = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAvatarEmoji = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'vet': return '👩‍⚕️';
      case 'groomer': return '✂️';
      case 'lover': return '🚶';
      case 'supplier': return '🏪';
      default: return '👤';
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || sending) return;

    const tempMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sent: true,
      time: 'Sending...',
    };

    setMessages([...messages, tempMessage]);
    const messageToSend = messageText;
    setMessageText('');
    setSending(true);

    try {
      await messagesApi.sendMessage(selectedConversation.id, messageToSend);
      tempMessage.time = 'Just now';
      setMessages(prev => prev.map(m => m.id === tempMessage.id ? tempMessage : m));
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setMessageText(messageToSend);
    } finally {
      setSending(false);
    }
  };

  if (selectedConversation) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedConversation(null)}
            >
              <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
            </TouchableOpacity>
            <View style={styles.chatHeaderInfo}>
              <View style={styles.chatAvatar}>
                <Text style={styles.chatAvatarText}>{selectedConversation.avatar}</Text>
                {selectedConversation.online && <View style={styles.onlineDot} />}
              </View>
              <View>
                <Text style={styles.chatName}>{selectedConversation.name}</Text>
                <Text style={styles.chatStatus}>
                  {selectedConversation.online ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <Ionicons name="videocam" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {loadingMessages ? (
              <View style={styles.loadingMessages}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Loading messages...</Text>
              </View>
            ) : messages.length === 0 ? (
              <View style={styles.emptyMessages}>
                <Ionicons name="chatbubble-outline" size={48} color={colors.gray[300]} />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Start the conversation!</Text>
              </View>
            ) : (
              messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.sent ? styles.sentBubble : styles.receivedBubble,
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.sent ? styles.sentText : styles.receivedText,
                ]}>
                  {message.text}
                </Text>
                <Text style={[
                  styles.messageTime,
                  message.sent ? styles.sentTime : styles.receivedTime,
                ]}>
                  {message.time}
                </Text>
              </View>
            ))
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor={colors.gray[400]}
                value={messageText}
                onChangeText={setMessageText}
                multiline
              />
            </View>
            <TouchableOpacity
              style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!messageText.trim()}
            >
              <Ionicons name="send" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newChatButton} onPress={() => setShowNewChatModal(true)}>
          <Ionicons name="create-outline" size={22} color={colors.gray[700]} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Conversations */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {conversations.length === 0 ? (
          <View style={styles.emptyConversations}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>Start chatting with vets, groomers, and more!</Text>
          </View>
        ) : (
          conversations.map((conversation) => (
          <TouchableOpacity
            key={conversation.id}
            style={styles.conversationCard}
            onPress={() => setSelectedConversation(conversation)}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>{conversation.avatar}</Text>
              {conversation.online && <View style={styles.onlineIndicator} />}
            </View>
            <View style={styles.conversationInfo}>
              <View style={styles.conversationHeader}>
                <Text style={styles.conversationName}>{conversation.name}</Text>
                <Text style={styles.conversationTime}>{conversation.time}</Text>
              </View>
              <View style={styles.conversationFooter}>
                <Text
                  style={[
                    styles.lastMessage,
                    conversation.unread > 0 && styles.unreadMessage,
                  ]}
                  numberOfLines={1}
                >
                  {conversation.lastMessage}
                </Text>
                {conversation.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{conversation.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))
        )}
      </ScrollView>

      {/* New Chat Modal */}
      <Modal visible={showNewChatModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Start a Chat</Text>
              <TouchableOpacity onPress={() => setShowNewChatModal(false)}>
                <Ionicons name="close" size={24} color={colors.gray[700]} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {isOwner
                ? 'Chat with vets, groomers, suppliers, and pet lovers'
                : 'Chat with pet owners and other service providers'}
            </Text>

            {/* Provider Type Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {(isOwner ? [
                { key: 'all', label: 'All', icon: 'apps' },
                { key: 'vet', label: 'Vets', icon: 'medical' },
                { key: 'groomer', label: 'Groomers', icon: 'cut' },
                { key: 'supplier', label: 'Suppliers', icon: 'storefront' },
                { key: 'lover', label: 'Pet Lovers', icon: 'heart' },
              ] : [
                { key: 'all', label: 'All', icon: 'apps' },
                { key: 'owner', label: 'Pet Owners', icon: 'paw' },
                { key: 'vet', label: 'Vets', icon: 'medical' },
                { key: 'groomer', label: 'Groomers', icon: 'cut' },
                { key: 'supplier', label: 'Suppliers', icon: 'storefront' },
              ]).map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.filterChip,
                    providerFilter === item.key && styles.filterChipActive,
                  ]}
                  onPress={() => setProviderFilter(item.key as any)}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={16}
                    color={providerFilter === item.key ? colors.white : colors.gray[600]}
                  />
                  <Text style={[
                    styles.filterChipText,
                    providerFilter === item.key && styles.filterChipTextActive,
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Providers List */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.providersList}>
              {filteredProviders.map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  style={styles.providerCard}
                  onPress={() => startConversation(provider)}
                >
                  <View style={[
                    styles.providerIcon,
                    { backgroundColor: `${getProviderColor(provider.type)}15` }
                  ]}>
                    <Ionicons
                      name={getProviderIcon(provider.type) as any}
                      size={22}
                      color={getProviderColor(provider.type)}
                    />
                    {provider.online && <View style={styles.providerOnlineDot} />}
                  </View>
                  <View style={styles.providerInfo}>
                    <Text style={styles.providerName}>{provider.name}</Text>
                    <Text style={styles.providerSpecialty}>{provider.specialty}</Text>
                    <View style={styles.providerMeta}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.providerRating}>{provider.rating}</Text>
                      <Text style={styles.providerStatus}>
                        {provider.online ? '• Online' : '• Offline'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.chatBtn, { backgroundColor: getProviderColor(provider.type) }]}
                    onPress={() => startConversation(provider)}
                  >
                    <Ionicons name="chatbubble" size={18} color={colors.white} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  loadingMessages: {
    padding: 40,
    alignItems: 'center',
  },
  emptyMessages: {
    padding: 40,
    alignItems: 'center',
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
  emptyConversations: {
    padding: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[700],
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
  },
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
  newChatButton: {
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
    marginBottom: 16,
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
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: colors.white,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  conversationTime: {
    fontSize: 12,
    color: colors.gray[400],
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[500],
  },
  unreadMessage: {
    fontWeight: '600',
    color: colors.gray[700],
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    marginRight: 12,
  },
  chatHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatAvatarText: {
    fontSize: 22,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: colors.white,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  chatStatus: {
    fontSize: 12,
    color: colors.gray[500],
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  sentBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  sentText: {
    color: colors.white,
  },
  receivedText: {
    color: colors.gray[900],
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  sentTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  receivedTime: {
    color: colors.gray[400],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  attachButton: {
    marginRight: 8,
    marginBottom: 6,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  input: {
    fontSize: 15,
    color: colors.gray[900],
    maxHeight: 80,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray[300],
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 20,
  },
  filterScroll: {
    marginBottom: 16,
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    marginRight: 8,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[600],
  },
  filterChipTextActive: {
    color: colors.white,
  },
  providersList: {
    maxHeight: 400,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  providerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  providerOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: colors.white,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  providerSpecialty: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  providerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  providerRating: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[700],
  },
  providerStatus: {
    fontSize: 12,
    color: colors.gray[500],
    marginLeft: 4,
  },
  chatBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
