import { databases, DATABASE_ID, USERS_COLLECTION_ID, SCHOOLS_COLLECTION_ID } from '../services/appwrite';

const verifyDatabase = async () => {
  console.log('Verifying database connection...');
  console.log('DATABASE_ID:', DATABASE_ID);
  console.log('USERS_COLLECTION_ID:', USERS_COLLECTION_ID);
  console.log('SCHOOLS_COLLECTION_ID:', SCHOOLS_COLLECTION_ID);
  
  // Check if database exists by trying to list documents from collections
  try {
    // Try to get a document from the schools collection to verify
    console.log('Trying to verify collections...');
    
    try {
      // Try to list documents from Users collection
      const usersResult = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID
      );
      console.log('✅ Users collection verified: ', USERS_COLLECTION_ID);
      console.log(`Found ${usersResult.total} users`);
    } catch (error) {
      console.log('❌ Users collection error: ', error);
    }
    
    try {
      // Try to list documents from Schools collection
      const schoolsResult = await databases.listDocuments(
        DATABASE_ID,
        SCHOOLS_COLLECTION_ID
      );
      console.log('✅ Schools collection verified: ', SCHOOLS_COLLECTION_ID);
      console.log(`Found ${schoolsResult.total} schools`);
    } catch (error) {
      console.log('❌ Schools collection error: ', error);
    }
    
  } catch (error) {
    console.log('❌ Error accessing database: ', error);
  }
};

// Execute the function
verifyDatabase().catch(console.error); 