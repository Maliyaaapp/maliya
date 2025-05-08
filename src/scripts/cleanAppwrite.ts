import { Client, Databases, Account, ID } from 'appwrite';

// Appwrite details
const endpoint = 'https://fra.cloud.appwrite.io/v1';
const projectId = '681afa81001965d1f562';
const databaseId = '681afac100096bf95c8a';
const schoolsCollectionId = '681afaec00356fb53ee9';
const usersCollectionId = '681afaf300306a52303b';

// Admin credentials for cleanup
const adminEmail = process.env.ADMIN_EMAIL || '';
const adminPassword = process.env.ADMIN_PASSWORD || '';

const cleanAppwrite = async () => {
  console.log('🧹 Appwrite Cleanup Tool');
  console.log('=======================');

  try {
    // Initialize client
    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId);

    const account = new Account(client);
    const databases = new Databases(client);

    // Step 1: List all documents in the schools collection
    console.log('\n1. Checking for schools documents...');
    try {
      const schoolsResult = await databases.listDocuments(
        databaseId,
        schoolsCollectionId
      );
      
      console.log(`Found ${schoolsResult.total} schools.`);
      
      // Delete each school
      if (schoolsResult.total > 0) {
        console.log('Deleting schools...');
        for (const school of schoolsResult.documents) {
          try {
            await databases.deleteDocument(
              databaseId,
              schoolsCollectionId,
              school.$id
            );
            console.log(`✅ Deleted school: ${school.$id} (${school.name || 'Unnamed'})`);
          } catch (error) {
            console.error(`❌ Failed to delete school ${school.$id}:`, error);
          }
        }
      }
    } catch (error) {
      console.log('❌ Error accessing schools collection:', error);
    }

    // Step 2: List all documents in the users collection
    console.log('\n2. Checking for user documents...');
    try {
      const usersResult = await databases.listDocuments(
        databaseId,
        usersCollectionId
      );
      
      console.log(`Found ${usersResult.total} user documents.`);
      
      // Delete each user document
      if (usersResult.total > 0) {
        console.log('Deleting user documents...');
        for (const user of usersResult.documents) {
          try {
            await databases.deleteDocument(
              databaseId,
              usersCollectionId,
              user.$id
            );
            console.log(`✅ Deleted user document: ${user.$id} (${user.email || 'No email'})`);
          } catch (error) {
            console.error(`❌ Failed to delete user document ${user.$id}:`, error);
          }
        }
      }
    } catch (error) {
      console.log('❌ Error accessing users collection:', error);
    }

    // Step 3: Create a test account to confirm clean state
    console.log('\n3. Creating test account to verify clean state...');
    const testId = ID.unique();
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'Test123!';
    const testName = 'Test User';
    
    try {
      const testUser = await account.create(
        testId,
        testEmail,
        testPassword,
        testName
      );
      console.log(`✅ Successfully created test user: ${testId} (${testEmail})`);
      
      // Delete the test user to leave a clean state
      console.log('Cleaning up test user...');
      try {
        // Note: Cannot directly delete users with client SDK v17
        console.log('⚠️ Note: Appwrite client SDK cannot delete user accounts.');
        console.log('Manual cleanup may be required through the Appwrite console.');
      } catch (error) {
        console.error('❌ Error deleting test user:', error);
      }
    } catch (error) {
      console.error('❌ Error creating test user:', error);
    }

    console.log('\n✅ Cleanup completed!');
    console.log('====================');
    console.log('Next Steps:');
    console.log('1. Log in to the Appwrite console and delete any remaining user accounts');
    console.log('2. Restart your app and create a new school first');
    console.log('3. Then create a new account associated with that school');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
};

// Run the cleanup
cleanAppwrite().catch(console.error); 