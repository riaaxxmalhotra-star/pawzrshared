import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  setDoc,
  getDoc,
  getDocs,
  where,
} from 'firebase/firestore';

// Firebase configuration - IMPORTANT: Replace with your actual config from Firebase Console
// Go to: Firebase Console > Project Settings > General > Your apps > Firebase SDK snippet
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",  // TODO: Replace with real API key
  authDomain: "pawzr-app.firebaseapp.com",
  projectId: "pawzr-app",
  storageBucket: "pawzr-app.appspot.com",
  messagingSenderId: "1094158533320",
  appId: "1:1094158533320:web:xxxxxxxxxxxxxx"  // TODO: Replace with real app ID
};

// Check if Firebase is properly configured
const isFirebaseConfigured = !firebaseConfig.apiKey.includes('xxxx') && !firebaseConfig.appId.includes('xxxx');

// Initialize Firebase with error handling
let app: any = null;
let db: any = null;

try {
  if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } else {
    console.warn('Firebase: Using placeholder configuration. Chat features will be limited.');
  }
} catch (error) {
  console.warn('Firebase initialization failed:', error);
}

// Types
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'booking_request' | 'booking_confirmed' | 'system';
  bookingData?: BookingData;
  createdAt: Timestamp | Date;
  read: boolean;
}

export interface BookingData {
  type: 'walk' | 'hosting';
  status: 'pending' | 'confirmed' | 'declined' | 'completed';
  // Walk specific
  date?: string;
  time?: string;
  duration?: number;
  location?: string;
  // Hosting specific
  checkIn?: string;
  checkOut?: string;
  specialInstructions?: string;
  // Common
  petId?: string;
  petName?: string;
  price?: number;
}

export interface ChatThread {
  id: string;
  participants: string[];
  participantNames: { [key: string]: string };
  participantPhotos: { [key: string]: string };
  petId?: string;
  petName?: string;
  matchId?: string;
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  createdAt: Timestamp;
  typing?: { [key: string]: boolean };
}

// Create or get existing chat thread
export const createOrGetChatThread = async (
  user1Id: string,
  user1Name: string,
  user1Photo: string,
  user2Id: string,
  user2Name: string,
  user2Photo: string,
  petId?: string,
  petName?: string,
  matchId?: string
): Promise<string> => {
  // Return a mock ID if Firebase isn't configured
  if (!db) {
    console.warn('Firebase not configured - returning mock chat ID');
    return `mock-chat-${user1Id}-${user2Id}`;
  }

  // Check if chat already exists between these users
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', user1Id)
  );

  const snapshot = await getDocs(q);
  let existingChatId: string | null = null;

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.participants.includes(user2Id)) {
      existingChatId = doc.id;
    }
  });

  if (existingChatId) {
    return existingChatId;
  }

  // Create new chat thread
  const chatData: Omit<ChatThread, 'id'> = {
    participants: [user1Id, user2Id],
    participantNames: {
      [user1Id]: user1Name,
      [user2Id]: user2Name,
    },
    participantPhotos: {
      [user1Id]: user1Photo || '',
      [user2Id]: user2Photo || '',
    },
    petId,
    petName,
    matchId,
    createdAt: serverTimestamp() as Timestamp,
    typing: {},
  };

  const docRef = await addDoc(chatsRef, chatData);
  return docRef.id;
};

// Send a message
export const sendChatMessage = async (
  chatId: string,
  senderId: string,
  senderName: string,
  content: string,
  type: ChatMessage['type'] = 'text',
  bookingData?: BookingData
): Promise<void> => {
  if (!db) {
    console.warn('Firebase not configured - message not sent');
    return;
  }
  const messagesRef = collection(db, 'chats', chatId, 'messages');

  await addDoc(messagesRef, {
    senderId,
    senderName,
    content,
    type,
    bookingData: bookingData || null,
    createdAt: serverTimestamp(),
    read: false,
  });

  // Update last message in chat thread
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    lastMessage: type === 'text' ? content : `[${type.replace('_', ' ')}]`,
    lastMessageAt: serverTimestamp(),
  });
};

// Subscribe to messages
export const subscribeToMessages = (
  chatId: string,
  callback: (messages: ChatMessage[]) => void
) => {
  if (!db) {
    console.warn('Firebase not configured - returning empty messages');
    callback([]);
    return () => {};
  }
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data(),
      } as ChatMessage);
    });
    callback(messages);
  });
};

// Subscribe to chat thread updates
export const subscribeToChatThread = (
  chatId: string,
  callback: (thread: ChatThread | null) => void
) => {
  const chatRef = doc(db, 'chats', chatId);

  return onSnapshot(chatRef, (doc) => {
    if (doc.exists()) {
      callback({
        id: doc.id,
        ...doc.data(),
      } as ChatThread);
    } else {
      callback(null);
    }
  });
};

// Set typing indicator
export const setTypingIndicator = async (
  chatId: string,
  userId: string,
  isTyping: boolean
): Promise<void> => {
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    [`typing.${userId}`]: isTyping,
  });
};

// Mark messages as read
export const markMessagesAsRead = async (
  chatId: string,
  userId: string
): Promise<void> => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(
    messagesRef,
    where('senderId', '!=', userId),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  const updates = snapshot.docs.map((docSnapshot) =>
    updateDoc(doc(db, 'chats', chatId, 'messages', docSnapshot.id), {
      read: true,
    })
  );

  await Promise.all(updates);
};

// Get user's chat threads
export const getUserChatThreads = async (userId: string): Promise<ChatThread[]> => {
  if (!db) {
    console.warn('Firebase not configured - returning empty threads');
    return [];
  }
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );

  const snapshot = await getDocs(q);
  const threads: ChatThread[] = [];

  snapshot.forEach((doc) => {
    threads.push({
      id: doc.id,
      ...doc.data(),
    } as ChatThread);
  });

  return threads;
};

// Update booking status
export const updateBookingStatus = async (
  chatId: string,
  messageId: string,
  status: BookingData['status']
): Promise<void> => {
  const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
  await updateDoc(messageRef, {
    'bookingData.status': status,
  });
};

export { db, serverTimestamp, Timestamp };
