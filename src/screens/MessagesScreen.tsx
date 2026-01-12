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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { messagesApi } from '../lib/api';

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

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

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
        <TouchableOpacity style={styles.newChatButton}>
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
});
