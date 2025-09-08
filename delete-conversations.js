/**
 * Script to delete the 'conversations' collection from Firestore
 */

// Use require for Node.js compatibility
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMjArPuGb61Sq2g9KhoW0_YqibywsJUx4",
  authDomain: "filterbubble-260ea.firebaseapp.com",
  projectId: "filterbubble-260ea",
  storageBucket: "filterbubble-260ea.appspot.com",
  messagingSenderId: "377672244422",
  appId: "1:377672244422:web:59a7987c23d06e161a8bc7",
  measurementId: "G-R2E669RD7P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Delete all documents in the 'conversations' collection
 */
async function deleteConversationsCollection() {
  try {
    console.log('Starting deletion of conversations collection...');
    
    if (!db) {
      throw new Error('Firestore database not initialized');
    }

    const conversationsRef = collection(db, 'conversations');
    const snapshot = await getDocs(conversationsRef);
    
    const totalDocs = snapshot.size;
    console.log(`Found ${totalDocs} documents in the conversations collection`);
    
    if (totalDocs === 0) {
      console.log('No documents found in the conversations collection.');
      return;
    }

    let deletedCount = 0;
    
    // Delete each document one by one
    const deletePromises = snapshot.docs.map(async (document) => {
      await deleteDoc(doc(db, 'conversations', document.id));
      deletedCount++;
      if (deletedCount % 10 === 0 || deletedCount === totalDocs) {
        console.log(`Deleted ${deletedCount}/${totalDocs} documents...`);
      }
    });
    
    await Promise.all(deletePromises);
    
    console.log(`Successfully deleted all ${deletedCount} documents from the conversations collection.`);
  } catch (error) {
    console.error('Error deleting conversations collection:', error);
  }
}

// Execute the deletion function
deleteConversationsCollection()
  .then(() => {
    console.log('Operation completed.');
    // Give time for any pending operations to complete before exiting
    setTimeout(() => process.exit(0), 2000);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });

