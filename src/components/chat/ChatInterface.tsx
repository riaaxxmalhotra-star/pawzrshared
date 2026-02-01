import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import {
  ChatMessage,
  ChatThread,
  BookingData,
  sendChatMessage,
  subscribeToMessages,
  subscribeToChatThread,
  setTypingIndicator,
  markMessagesAsRead,
  updateBookingStatus,
} from '../../lib/firebase';
import ScheduleWalkModal, { WalkScheduleData } from './ScheduleWalkModal';
import ScheduleHostingModal, { HostingScheduleData } from './ScheduleHostingModal';
import { useAuth } from '../../lib/auth';
import logger from '../../lib/logger';

interface ChatInterfaceProps {
  chatId: string;
  recipientId: string;
  recipientName: string;
  recipientPhoto?: string;
  petName?: string;
  petId?: string;
  onBack: () => void;
}

export default function ChatInterface({
  chatId,
  recipientId,
  recipientName,
  recipientPhoto,
  petName,
  petId,
  onBack,
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [showWalkModal, setShowWalkModal] = useState(false);
  const [showHostingModal, setShowHostingModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to messages
  useEffect(() => {
    if (!chatId) return;

    const unsubscribeMessages = subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    });

    const unsubscribeThread = subscribeToChatThread(chatId, (t) => {
      setThread(t);
    });

    // Mark messages as read
    if (user?.id) {
      markMessagesAsRead(chatId, user.id);
    }

    return () => {
      unsubscribeMessages();
      unsubscribeThread();
    };
  }, [chatId, user?.id]);

  // Handle typing indicator
  const handleTyping = useCallback((text: string) => {
    setMessageText(text);

    if (!chatId || !user?.id) return;

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing indicator
    if (text.length > 0) {
      setTypingIndicator(chatId, user.id, true);

      // Clear typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        setTypingIndicator(chatId, user.id, false);
      }, 2000);
    } else {
      setTypingIndicator(chatId, user.id, false);
    }
  }, [chatId, user?.id]);

  // Send text message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || sending) return;

    const text = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      await sendChatMessage(chatId, user.id, user.name || 'User', text, 'text');
      setTypingIndicator(chatId, user.id, false);
    } catch (error) {
      logger.error('Failed to send message:', error);
      setMessageText(text);
    } finally {
      setSending(false);
    }
  };

  // Schedule walk
  const handleScheduleWalk = async (data: WalkScheduleData) => {
    if (!user) return;

    setShowWalkModal(false);

    const bookingData: BookingData = {
      type: 'walk',
      status: 'pending',
      date: data.date.toISOString().split('T')[0],
      time: data.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      duration: data.duration,
      location: data.location,
      petId,
      petName,
    };

    const content = `Walk Request\n${data.date.toLocaleDateString()} at ${data.time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}\nDuration: ${data.duration} minutes\nLocation: ${data.location}${data.notes ? `\nNotes: ${data.notes}` : ''}`;

    try {
      await sendChatMessage(chatId, user.id, user.name || 'User', content, 'booking_request', bookingData);
    } catch (error) {
      logger.error('Failed to send walk request:', error);
    }
  };

  // Schedule hosting
  const handleScheduleHosting = async (data: HostingScheduleData) => {
    if (!user) return;

    setShowHostingModal(false);

    const bookingData: BookingData = {
      type: 'hosting',
      status: 'pending',
      checkIn: data.checkIn.toISOString().split('T')[0],
      checkOut: data.checkOut.toISOString().split('T')[0],
      specialInstructions: data.specialInstructions,
      petId,
      petName,
    };

    const nights = Math.ceil((data.checkOut.getTime() - data.checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const content = `Hosting Request\nCheck-in: ${data.checkIn.toLocaleDateString()}\nCheck-out: ${data.checkOut.toLocaleDateString()}\nDuration: ${nights} night${nights > 1 ? 's' : ''}${data.feedingSchedule ? `\nFeeding: ${data.feedingSchedule}` : ''}${data.specialInstructions ? `\nInstructions: ${data.specialInstructions}` : ''}`;

    try {
      await sendChatMessage(chatId, user.id, user.name || 'User', content, 'booking_request', bookingData);
    } catch (error) {
      logger.error('Failed to send hosting request:', error);
    }
  };

  // Handle booking response
  const handleBookingResponse = async (message: ChatMessage, accept: boolean) => {
    if (!user || !message.bookingData) return;

    const newStatus = accept ? 'confirmed' : 'declined';

    try {
      await updateBookingStatus(chatId, message.id, newStatus);

      const responseText = accept
        ? `Booking confirmed! Looking forward to it.`
        : `Booking declined. Let me know if you'd like to reschedule.`;

      await sendChatMessage(
        chatId,
        user.id,
        user.name || 'User',
        responseText,
        accept ? 'booking_confirmed' : 'system'
      );
    } catch (error) {
      logger.error('Failed to update booking:', error);
    }
  };

  // Check if other user is typing
  const isOtherUserTyping = thread?.typing?.[recipientId] ?? false;

  // Render message
  const renderMessage = (message: ChatMessage, index: number) => {
    const isOwnMessage = message.senderId === user?.id;
    const isBookingRequest = message.type === 'booking_request';
    const isBookingConfirmed = message.type === 'booking_confirmed';
    const showBookingActions = isBookingRequest && !isOwnMessage && message.bookingData?.status === 'pending';

    const messageTime = message.createdAt
      ? (message.createdAt as any).toDate?.()?.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }) || ''
      : '';

    return (
      <View
        key={message.id || index}
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
            isBookingRequest && styles.bookingBubble,
            isBookingConfirmed && styles.confirmedBubble,
          ]}
        >
          {isBookingRequest && (
            <View style={styles.bookingHeader}>
              <Ionicons
                name={message.bookingData?.type === 'walk' ? 'walk' : 'home'}
                size={18}
                color={isOwnMessage ? colors.white : colors.primary}
              />
              <Text style={[styles.bookingTitle, isOwnMessage && styles.ownBookingTitle]}>
                {message.bookingData?.type === 'walk' ? 'Walk Request' : 'Hosting Request'}
              </Text>
              {message.bookingData?.status === 'confirmed' && (
                <View style={styles.statusBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.statusText}>Confirmed</Text>
                </View>
              )}
              {message.bookingData?.status === 'declined' && (
                <View style={[styles.statusBadge, styles.declinedBadge]}>
                  <Ionicons name="close-circle" size={14} color="#EF4444" />
                  <Text style={[styles.statusText, styles.declinedText]}>Declined</Text>
                </View>
              )}
            </View>
          )}

          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
            {message.content || (message as any).text}
          </Text>

          <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
            {messageTime}
            {isOwnMessage && message.read && ' ✓✓'}
          </Text>

          {showBookingActions && (
            <View style={styles.bookingActions}>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => handleBookingResponse(message, false)}
              >
                <Text style={styles.declineBtnText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleBookingResponse(message, true)}
              >
                <Ionicons name="checkmark" size={18} color={colors.white} />
                <Text style={styles.acceptBtnText}>Accept</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {recipientPhoto || recipientName?.[0]?.toUpperCase() || '?'}
            </Text>
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.recipientName}>{recipientName}</Text>
            {petName && <Text style={styles.petName}>About {petName}</Text>}
          </View>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.gray[600]} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>Start the conversation!</Text>
            <Text style={styles.emptySubtext}>
              Send a message or schedule a walk/hosting
            </Text>
          </View>
        ) : (
          messages.map(renderMessage)
        )}

        {/* Typing indicator */}
        {isOtherUserTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => setShowWalkModal(true)}
        >
          <Ionicons name="walk" size={18} color={colors.primary} />
          <Text style={styles.quickActionText}>Schedule Walk</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => setShowHostingModal(true)}
        >
          <Ionicons name="home" size={18} color={colors.primary} />
          <Text style={styles.quickActionText}>Schedule Hosting</Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachBtn}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.gray[400]}
            value={messageText}
            onChangeText={handleTyping}
            multiline
            maxLength={1000}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="send" size={18} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <ScheduleWalkModal
        visible={showWalkModal}
        onClose={() => setShowWalkModal(false)}
        onSchedule={handleScheduleWalk}
        petName={petName}
        recipientName={recipientName}
      />

      <ScheduleHostingModal
        visible={showHostingModal}
        onClose={() => setShowHostingModal(false)}
        onSchedule={handleScheduleHosting}
        petName={petName}
        recipientName={recipientName}
      />
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backBtn: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
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
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  petName: {
    fontSize: 13,
    color: colors.gray[500],
  },
  moreBtn: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[700],
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
  },
  messageContainer: {
    marginBottom: 12,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bookingBubble: {
    borderWidth: 2,
    borderColor: `${colors.primary}30`,
  },
  confirmedBubble: {
    borderColor: '#10B98130',
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
  },
  ownBookingTitle: {
    color: colors.white,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  declinedBadge: {
    backgroundColor: '#EF444420',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  declinedText: {
    color: '#EF4444',
  },
  messageText: {
    fontSize: 15,
    color: colors.gray[900],
    lineHeight: 20,
  },
  ownMessageText: {
    color: colors.white,
  },
  messageTime: {
    fontSize: 11,
    color: colors.gray[400],
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  bookingActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  declineBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  typingContainer: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  typingBubble: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[400],
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
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
  attachBtn: {
    marginRight: 8,
    marginBottom: 4,
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
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: colors.gray[300],
  },
});
