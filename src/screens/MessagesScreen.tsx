import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { messagesApi, likesApi } from '../lib/api';
import { useAuth } from '../lib/auth';
import logger from '../lib/logger';

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

interface Message {
  id: string;
  text: string;
  sent: boolean;
  time: string;
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
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [initialized, setInitialized] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
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

  // Process navigation params IMMEDIATELY when screen focuses
  useFocusEffect(
    useCallback(() => {
      const params = route.params || {};
      const { conversationId, matchedUser, petName, petId } = params;

      logger.log('MessagesScreen focused');
      logger.log('Params received');

      // Only process if we have matchedUser and haven't processed this exact params
      const paramsKey = matchedUser ? `${matchedUser.id}-${conversationId}` : null;

      if (matchedUser && paramsKey && paramsProcessedRef.current !== paramsKey) {
        paramsProcessedRef.current = paramsKey;

        logger.log('Opening chat with matched user');

        // IMMEDIATELY create and set the conversation - no waiting!
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

        // Set conversation IMMEDIATELY
        setSelectedConversation(newConversation);
        setMessages([]);
        setLoadingMessages(false);
        setInitialized(true);

        // Clear navigation params
        navigation.setParams({
          conversationId: undefined,
          matchedUser: undefined,
          petName: undefined,
          petId: undefined,
        });

        // Try to create real conversation in background
        if (!conversationId || conversationId.startsWith('new-')) {
          createConversationInBackground(matchedUser.id, newConversation);
        }
      } else if (!initialized && !matchedUser) {
        // No params, load conversations list
        setInitialized(true);
        loadConversations();
      }
    }, [route.params])
  );

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

  // Auto-refresh messages when in chat
  useEffect(() => {
    if (selectedConversation && !selectedConversation.id.startsWith('new-')) {
      loadMessages(selectedConversation.id);

      const interval = setInterval(() => {
        if (!sending) {
          loadMessages(selectedConversation.id, false);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [selectedConversation?.id]);

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

  const loadMessages = async (conversationId: string, showLoading = true) => {
    if (conversationId.startsWith('new-')) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    if (showLoading && messages.length === 0) {
      setLoadingMessages(true);
    }

    try {
      const data = await messagesApi.getMessages(conversationId);
      const msgs = (data.messages || data || []).map((m: any) => ({
        id: m.id,
        text: m.content || m.text,
        sent: m.sent || m.isOwn || m.senderId === user?.id || false,
        time: formatMessageTime(m.createdAt),
      }));
      setMessages(msgs);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      logger.error('Failed to load messages');
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

    if (diffMins < 1) return 'Just now';
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

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || sending) return;

    const tempMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sent: true,
      time: 'Sending...',
    };

    setMessages(prev => [...prev, tempMessage]);
    const messageToSend = messageText;
    setMessageText('');
    setSending(true);

    try {
      const recipientId = selectedConversation.recipientId || selectedConversation.id.replace('new-', '');

      if (selectedConversation.id.startsWith('new-')) {
        logger.log('Starting new conversation with recipient:', recipientId);

        const response = await messagesApi.startConversation(recipientId, messageToSend);
        const newConvId = response.conversationId || response.conversation?.id || response.id;

        logger.log('New conversation created:', newConvId);

        if (newConvId) {
          setSelectedConversation(prev => prev ? { ...prev, id: newConvId } : null);
          // Reload messages to get the server's version
          setTimeout(() => loadMessages(newConvId), 500);
        }
      } else {
        logger.log('Sending message to conversation:', selectedConversation.id, 'recipient:', recipientId);
        await messagesApi.sendMessage(selectedConversation.id, messageToSend, recipientId);
        // Reload messages to get the server's version with proper timestamps
        setTimeout(() => loadMessages(selectedConversation.id, false), 500);
      }

      setMessages(prev => prev.map(m =>
        m.id === tempMessage.id ? { ...m, time: 'Just now' } : m
      ));
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error: any) {
      logger.error('Failed to send message:', error?.message || error);
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setMessageText(messageToSend);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleScheduleWalk = () => {
    setMessageText(`🚶 Walk Request\n\nI'd like to schedule a walk!\n\nPlease let me know your availability.`);
  };

  const handleScheduleHosting = () => {
    setMessageText(`🏠 Hosting Request\n\nI'd like to schedule pet hosting!\n\nPlease let me know your availability and rates.`);
  };

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ============ CHAT VIEW ============
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
              onPress={() => {
                setSelectedConversation(null);
                paramsProcessedRef.current = null;
                loadConversations();
              }}
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
                {selectedConversation.petName ? (
                  <Text style={styles.chatPetName}>About {selectedConversation.petName}</Text>
                ) : (
                  <Text style={styles.chatStatus}>
                    {selectedConversation.online ? 'Online' : 'Offline'}
                  </Text>
                )}
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
                <Ionicons name="chatbubbles-outline" size={64} color={colors.gray[300]} />
                <Text style={styles.emptyTitle}>Start the conversation!</Text>
                <Text style={styles.emptySubtext}>
                  Say hello to {selectedConversation.name}
                </Text>
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

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionBtn} onPress={handleScheduleWalk}>
              <Ionicons name="walk" size={18} color={colors.primary} />
              <Text style={styles.quickActionText}>Schedule Walk</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={handleScheduleHosting}>
              <Ionicons name="home" size={18} color={colors.primary} />
              <Text style={styles.quickActionText}>Schedule Hosting</Text>
            </TouchableOpacity>
          </View>

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
              style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!messageText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="send" size={20} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
