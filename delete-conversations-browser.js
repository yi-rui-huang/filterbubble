/**
 * Script to delete the 'conversations' collection from Firestore
 * This script is designed to be run in a browser environment where Firebase is already initialized
 */

// Add this script to an HTML file and run it in the browser
// It will use the existing Firebase configuration from your app

// Function to delete all documents in the conversations collection
async function deleteConversationsCollection() {
  try {
    console.log('Starting deletion of conversations collection...');
    
    // Get Firestore instance from the already initialized Firebase
    const db = firebase.firestore();
    
    // Get all documents from the conversations collection
    const snapshot = await db.collection('conversations').get();
    
    const totalDocs = snapshot.size;
    console.log(`Found ${totalDocs} documents in the conversations collection`);
    
    if (totalDocs === 0) {
      console.log('No documents found in the conversations collection.');
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
    
    console.log(`Successfully deleted all ${deletedCount} documents from the conversations collection.`);
    return `Successfully deleted ${deletedCount} documents`;
  } catch (error) {
    console.error('Error deleting conversations collection:', error);
    return `Error: ${error.message}`;
  }
}

// Execute the function and display the result
deleteConversationsCollection().then(result => {
  // Create a result element to show the operation result
  const resultElement = document.createElement('div');
  resultElement.textContent = result;
  resultElement.style.padding = '10px';
  resultElement.style.margin = '10px';
  resultElement.style.backgroundColor = result.includes('Error') ? '#ffdddd' : '#ddffdd';
  document.body.appendChild(resultElement);
});
