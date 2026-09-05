import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { messagesApi, likesApi } from '../lib/api';
import { useAuth } from '../lib/auth';
import logger from '../lib/logger';
import ChatInterface from '../components/chat/ChatInterface';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
  online: boolean;
  recipientId?: string;
  petName?: string;
  petId?: string;
}

interface MatchedUser {
  id: string;
  name: string;
  type: 'lover' | 'owner';
  photo?: string;
  online?: boolean;
  verified?: boolean;
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [initialized, setInitialized] = useState(false);
  const paramsProcessedRef = useRef<string | null>(null);

  // Role-based configuration
  const userRole = (user?.role || 'OWNER').toUpperCase();
  const isProvider = ['VET', 'GROOMER', 'SUPPLIER'].includes(userRole);

  const getRoleConfig = () => {
    switch (userRole) {
      case 'VET':
        return {
          color: '#10B981',
          emptyTitle: 'No patient messages yet',
          emptySubtitle: 'Pet owners will message you when they need veterinary care',
          searchPlaceholder: 'Search patient chats...',
        };
      case 'GROOMER':
        return {
          color: '#8B5CF6',
          emptyTitle: 'No client messages yet',
          emptySubtitle: 'Pet owners will contact you for grooming appointments',
          searchPlaceholder: 'Search client chats...',
        };
      case 'SUPPLIER':
        return {
          color: '#3B82F6',
          emptyTitle: 'No customer inquiries yet',
          emptySubtitle: 'Customers will reach out with product questions and orders',
          searchPlaceholder: 'Search customer chats...',
        };
      case 'LOVER':
        return {
          color: '#F97316',
          emptyTitle: 'No matches yet',
          emptySubtitle: 'Swipe right on pets you love to connect with their owners!',
          searchPlaceholder: 'Search conversations...',
        };
      default:
        return {
          color: '#F97316',
          emptyTitle: 'No matches yet',
          emptySubtitle: 'Find pet lovers to connect with for walks, hosting, and more!',
          searchPlaceholder: 'Search conversations...',
        };
    }
  };

  const roleConfig = getRoleConfig();

  // Process chat params - called when navigating with matchedUser
  const processMatchedUserParams = useCallback((params: any) => {
    const { conversationId, matchedUser, petName, petId } = params;

    if (!matchedUser) return false;

    logger.log('Opening chat with matched user:', matchedUser.name);

    // Create conversation object immediately
    const newConversation: Conversation = {
      id: conversationId || `new-${matchedUser.id}`,
      name: matchedUser.name || 'New Match',
      lastMessage: '',
      time: 'Just now',
      unread: 0,
      avatar: getAvatarEmoji(matchedUser.type || 'lover'),
      online: matchedUser.online ?? true,
      recipientId: matchedUser.id,
      petName,
      petId,
    };

    // Set conversation state - this will render ChatInterface
    setSelectedConversation(newConversation);
    setInitialized(true);

    // Clear params AFTER setting state to prevent re-processing
    setTimeout(() => {
      navigation.setParams({
        conversationId: undefined,
        matchedUser: undefined,
        petName: undefined,
        petId: undefined,
      });
    }, 0);

    // Create real conversation in background if needed
    if (!conversationId || conversationId.startsWith('new-')) {
      createConversationInBackground(matchedUser.id, newConversation);
    }

    return true;
  }, [navigation]);

  // Watch for route params changes - this handles navigation with params
  useEffect(() => {
    const params = route.params || {};
    if (params.matchedUser) {
      logger.log('Route params received with matchedUser:', params.matchedUser.name);
      processMatchedUserParams(params);
    }
  }, [route.params]);

  // Load conversations on mount if no params
  useEffect(() => {
    if (!route.params?.matchedUser && !initialized && !selectedConversation) {
      setInitialized(true);
      loadConversations();
    }
  }, [initialized, selectedConversation]);

  // Create conversation in background (don't block UI)
  const createConversationInBackground = async (userId: string, currentConv: Conversation) => {
    try {
      logger.log('Creating conversation in background');
      const response = await likesApi.createConversation(userId);
      const newId = response.conversationId || response.conversation?.id || response.id;

      if (newId && newId !== currentConv.id) {
        logger.log('Got real conversation ID');
        setSelectedConversation(prev => prev ? { ...prev, id: newId } : null);
      }
    } catch (error) {
      logger.log('Background conversation creation failed (using temp)');
    }
  };

  const loadConversations = async () => {
    setLoading(true);
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
      logger.error('Failed to load conversations');
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString();
  };

  const getAvatarEmoji = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'vet': return '👩‍⚕️';
      case 'groomer': return '✂️';
      case 'lover': return '🐾';
      case 'supplier': return '🏪';
      case 'owner': return '🏠';
      default: return '💬';
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ============ CHAT VIEW (Using ChatInterface component) ============
  if (selectedConversation) {
    const handleBackFromChat = () => {
      setSelectedConversation(null);
      paramsProcessedRef.current = null;
      loadConversations();
    };

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ChatInterface
          chatId={selectedConversation.id}
          recipientId={selectedConversation.recipientId || selectedConversation.id.replace('new-', '')}
          recipientName={selectedConversation.name}
          recipientPhoto={selectedConversation.avatar}
          petName={selectedConversation.petName}
          petId={selectedConversation.petId}
          onBack={handleBackFromChat}
        />
      </SafeAreaView>
    );
  }

  // ============ LOADING STATE ============
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

  // ============ CONVERSATIONS LIST ============
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder={roleConfig.searchPlaceholder}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {filteredConversations.length === 0 ? (
          <View style={styles.emptyConversations}>
            <Ionicons
              name={isProvider ? "chatbubbles-outline" : "heart-outline"}
              size={64}
              color={colors.gray[300]}
            />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No results found' : roleConfig.emptyTitle}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try a different search' : roleConfig.emptySubtitle}
            </Text>
          </View>
        ) : (
          filteredConversations.map((conversation) => (
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
                    style={[styles.lastMessage, conversation.unread > 0 && styles.unreadMessage]}
                    numberOfLines={1}
                  >
                    {conversation.lastMessage || 'Start chatting!'}
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
  loadingMessages: {
    padding: 40,
    alignItems: 'center',
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[700],
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
  },
  emptyConversations: {
    padding: 60,
    alignItems: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    paddingHorizontal: 20,
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
  chatPetName: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
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
    flexGrow: 1,
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
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: `${colors.primary}10`,
    gap: 6,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
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
});
