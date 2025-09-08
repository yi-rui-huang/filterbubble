/**
 * Script to delete the 'conversations' collection from Firestore using Admin SDK
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with application default credentials
// Note: You need to have service account credentials or be authenticated with gcloud
admin.initializeApp({
  projectId: 'filterbubble-260ea'
});

const db = admin.firestore();

/**
 * Delete all documents in a collection
 * @param {string} collectionPath - Path to the collection
 */
async function deleteCollection(collectionPath) {
  try {
    console.log(`Starting deletion of ${collectionPath} collection...`);
    
    const collectionRef = db.collection(collectionPath);
    const snapshot = await collectionRef.get();
    
    const totalDocs = snapshot.size;
    console.log(`Found ${totalDocs} documents in the ${collectionPath} collection`);
    
    if (totalDocs === 0) {
      console.log(`No documents found in the ${collectionPath} collection.`);
      return;
    }

    let deletedCount = 0;
    const batchSize = 500; // Firestore has a limit of 500 operations per batch
    const batches = [];
    
    // Create batches of delete operations
    let batch = db.batch();
    let operationsInCurrentBatch = 0;
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      operationsInCurrentBatch++;
      
      // If we reach the batch limit, commit and create a new batch
      if (operationsInCurrentBatch >= batchSize) {
        batches.push(batch.commit());
        batch = db.batch();
        operationsInCurrentBatch = 0;
      }
      
      deletedCount++;
      if (deletedCount % 100 === 0 || deletedCount === totalDocs) {
        console.log(`Prepared ${deletedCount}/${totalDocs} documents for deletion...`);
      }
    });
    
    // Commit any remaining operations in the last batch
    if (operationsInCurrentBatch > 0) {
      batches.push(batch.commit());
    }
    
    // Execute all batches
    await Promise.all(batches);
    
    console.log(`Successfully deleted all ${deletedCount} documents from the ${collectionPath} collection.`);
  } catch (error) {
    console.error(`Error deleting ${collectionPath} collection:`, error);
  }
}

// Delete the conversations collection
deleteCollection('conversations')
  .then(() => {
    console.log('Operation completed.');
    // Give time for any pending operations to complete before exiting
    setTimeout(() => process.exit(0), 2000);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
