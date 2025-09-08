/**
 * Conversation Service for Firestore Database Operations
 * Handles saving and retrieving conversation data between users and agents
 */

import { initializeFirebase, getFirebaseDb } from './firebase.js';
import { collection, addDoc, doc, updateDoc, getDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

// Initialize Firebase
initializeFirebase();

/**
 * Save a conversation message to Firestore
 * @param {Object} messageData - The message data to save
 * @returns {Promise<string>} The document ID of the saved message
 */
export async function saveConversationMessage(messageData) {
  try {
    const db = getFirebaseDb();
    if (!db) {
      throw new Error('Firestore database not initialized');
    }

    const conversationData = {
      ...messageData,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'conversations'), conversationData);
    console.log('Conversation message saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving conversation message:', error);
    throw error;
  }
}

/**
 * Save a complete conversation turn (user message + agent responses)
 * @param {Object} conversationTurn - Complete conversation turn data
 * @returns {Promise<string>} The document ID of the saved conversation turn
 */
export async function saveConversationTurn(conversationTurn) {
  try {
    const db = getFirebaseDb();
    if (!db) {
      throw new Error('Firestore database not initialized');
    }

    const turnData = {
      ...conversationTurn,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'conversation_turns'), turnData);
    console.log('Conversation turn saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving conversation turn:', error);
    throw error;
  }
}

/**
 * Get conversations by profile ID and round ID
 * @param {string} profileId - The user profile ID
 * @param {string} roundId - The round ID (e.g., "1", "2")
 * @returns {Promise<Array>} Array of conversation documents
 */
export async function getConversationsByProfileAndRound(profileId, roundId) {
  try {
    const db = getFirebaseDb();
    if (!db) {
      throw new Error('Firestore database not initialized');
    }

    const q = query(
      collection(db, 'conversation_turns'),
      where('profileId', '==', profileId),
      where('roundId', '==', roundId),
      orderBy('timestamp', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const conversations = [];
    
    querySnapshot.forEach((doc) => {
      conversations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return conversations;
  } catch (error) {
    console.error('Error getting conversations:', error);
    throw error;
  }
}

/**
 * Get all conversations by profile ID
 * @param {string} profileId - The user profile ID
 * @returns {Promise<Array>} Array of conversation documents
 */
export async function getAllConversationsByProfile(profileId) {
  try {
    const db = getFirebaseDb();
    if (!db) {
      throw new Error('Firestore database not initialized');
    }

    const q = query(
      collection(db, 'conversation_turns'),
      where('profileId', '==', profileId),
      orderBy('timestamp', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const conversations = [];
    
    querySnapshot.forEach((doc) => {
      conversations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return conversations;
  } catch (error) {
    console.error('Error getting all conversations:', error);
    throw error;
  }
}
