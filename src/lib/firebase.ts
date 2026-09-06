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
  limit,
  limitToLast,
} from 'firebase/firestore';
import ENV from '../config/env';

// Firebase configuration from environment variables only — no project
// fallbacks. Fallbacks would defeat isFirebaseConfigured and silently bind
// the bundle to the wrong project. Empty values = honest degraded chat.
const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: ENV.FIREBASE_PROJECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID,
};

// Check if Firebase is properly configured (API key and App ID are required)
export const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.appId;

// Bounds for realtime snapshots (Wave 3): an unbounded orderBy + full-list
// render degrades on long threads. Cursor pagination is a follow-up; the
// tail cap keeps snapshots and renders bounded today.
export const MESSAGES_PAGE_SIZE = 50;
export const THREADS_PAGE_SIZE = 30;

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

// Deterministic 1:1 thread IDs (Wave 0 decision: Firestore-first).
// Both participants compute the SAME document ID from the pair alone, so no
// backend mapping table is needed and duplicate threads are impossible.
// Deliberately pair-only (no pet/match context): list-entry and match-entry
// points must converge on one thread. Per-pet threads need a backend-issued
// thread ID (future: `firestoreChatId` on the conversations API).
function sanitizeIdPart(value: string): string {
  return String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
}

export function buildThreadId(user1Id: string, user2Id: string): string {
  const [a, b] = [sanitizeIdPart(user1Id), sanitizeIdPart(user2Id)].sort();
  return `thread_${a}_${b}`;
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
  const threadId = buildThreadId(user1Id, user2Id);

  // Return a deterministic mock ID if Firebase isn't configured so callers
  // keep one code path (subscriptions degrade to empty + banner).
  if (!db) {
    console.warn('Firebase not configured - returning mock chat ID');
    return `mock-${threadId}`;
  }

  // Deterministic doc: whoever opens first creates it, the other merges in.
  // setDoc-with-merge is idempotent — concurrent opens cannot fork threads.
  const chatRef = doc(db, 'chats', threadId);
  const existing = await getDoc(chatRef);

  if (!existing.exists()) {
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
    await setDoc(chatRef, chatData);
  } else {
    // Refresh display names/photos and context without clobbering history.
    await setDoc(
      chatRef,
      {
        participantNames: {
          [user1Id]: user1Name,
          [user2Id]: user2Name,
        },
        participantPhotos: {
          [user1Id]: user1Photo || '',
          [user2Id]: user2Photo || '',
        },
        ...(petId !== undefined ? { petId } : {}),
        ...(petName !== undefined ? { petName } : {}),
        ...(matchId !== undefined ? { matchId } : {}),
      },
      { merge: true }
    );
  }

  return threadId;
};

// Send a message — throws when Firebase is unavailable so the UI can keep
// the draft and show a failure state instead of silently swallowing the send.
export const sendChatMessage = async (
  chatId: string,
  senderId: string,
  senderName: string,
  content: string,
  type: ChatMessage['type'] = 'text',
  bookingData?: BookingData
): Promise<void> => {
  if (!db) {
    throw new Error('Chat is unavailable. Please check your connection and try again.');
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

// Subscribe to messages (most recent page). The onError callback fires on
// permission/network failures so the UI can stop its spinner honestly.
export const subscribeToMessages = (
  chatId: string,
  callback: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void
) => {
  if (!db) {
    console.warn('Firebase not configured - returning empty messages');
    callback([]);
    return () => {};
  }
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'), limitToLast(MESSAGES_PAGE_SIZE));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data(),
        } as ChatMessage);
      });
      callback(messages);
    },
    (error) => {
      console.warn('Messages subscription failed:', error);
      onError?.(error as Error);
    }
  );
};

// Subscribe to chat thread updates
export const subscribeToChatThread = (
  chatId: string,
  callback: (thread: ChatThread | null) => void,
  onError?: (error: Error) => void
) => {
  if (!db) {
    console.warn('Firebase not configured - returning null thread');
    callback(null);
    return () => {};
  }
  const chatRef = doc(db, 'chats', chatId);

  return onSnapshot(
    chatRef,
    (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data(),
        } as ChatThread);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.warn('Thread subscription failed:', error);
      onError?.(error as Error);
    }
  );
};

// Set typing indicator
export const setTypingIndicator = async (
  chatId: string,
  userId: string,
  isTyping: boolean
): Promise<void> => {
  if (!db) return;
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    [`typing.${userId}`]: isTyping,
  });
};

// Mark messages as read (bounded page per call — see MESSAGES_PAGE_SIZE note)
export const markMessagesAsRead = async (
  chatId: string,
  userId: string
): Promise<void> => {
  if (!db) return;
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(
    messagesRef,
    where('senderId', '!=', userId),
    where('read', '==', false),
    limit(100)
  );

  const snapshot = await getDocs(q);
  const updates = snapshot.docs.map((docSnapshot) =>
    updateDoc(doc(db, 'chats', chatId, 'messages', docSnapshot.id), {
      read: true,
    })
  );

  await Promise.all(updates);
};

// Get user's chat threads (bounded page, newest first)
export const getUserChatThreads = async (userId: string): Promise<ChatThread[]> => {
  if (!db) {
    console.warn('Firebase not configured - returning empty threads');
    return [];
  }
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc'),
    limit(THREADS_PAGE_SIZE)
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
  if (!db) {
    throw new Error('Chat is unavailable. Please check your connection and try again.');
  }
  const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
  await updateDoc(messageRef, {
    'bookingData.status': status,
  });
};

export { db, serverTimestamp, Timestamp };
