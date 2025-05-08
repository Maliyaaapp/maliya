import { Client, Databases, Account, ID } from 'appwrite';

// Create a script that directly checks specific collections and database

// Replace with your actual values from .env
const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID || '681afa81001965d1f562'; // Your actual project ID
const databaseId = '681afac100096bf95c8a'; // Your provided database ID
const schoolsCollectionId = '681afaec00356fb53ee9'; // Your provided schools collection ID
const usersCollectionId = '681afaf300306a52303b'; // Your provided users collection ID from .env

const verify = async () => {
  console.log('Enhanced Verification Script');
  console.log('============================');
  console.log('Database ID:', databaseId);
  console.log('Schools Collection ID:', schoolsCollectionId);
  console.log('Users Collection ID:', usersCollectionId);
  
  // Create client with project info
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);
  
  const databases = new Databases(client);
  const account = new Account(client);
  
  console.log('\nConfiguration Verification:');
  console.log('--------------------------');
  console.log('• Client configured with:');
  console.log('  - Endpoint:', endpoint);
  console.log('  - Project ID:', projectId);
  console.log('  - Database ID:', databaseId);
  console.log('  - Schools Collection:', schoolsCollectionId);
  console.log('  - Users Collection:', usersCollectionId);
  
  // Try to create a test school document
  try {
    console.log('\nTesting School Collection...');
    const timestamp = Date.now();
    const testSchoolId = `test_school_${timestamp}`;
    const testSchool = {
      name: `Test School ${timestamp}`,
      email: `test${timestamp}@example.com`,
      phone: '+968 1234567890',
      address: 'Test Address',
      location: 'Muscat',
      active: true,
      subscriptionStart: new Date().toISOString().split('T')[0],
      subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      logo: ''
    };
    
    try {
      await databases.createDocument(
        databaseId,
        schoolsCollectionId,
        testSchoolId,
        testSchool
      );
      console.log('✅ Successfully created test school!');
      
      // Test reading the school back
      try {
        const readSchool = await databases.getDocument(
          databaseId,
          schoolsCollectionId,
          testSchoolId
        );
        console.log('✅ Successfully read back test school!');
        console.log('School name:', readSchool.name);
        
        // Clean up test data
        try {
          await databases.deleteDocument(
            databaseId,
            schoolsCollectionId,
            testSchoolId
          );
          console.log('✅ Successfully deleted test school!');
        } catch (deleteError) {
          console.log('❌ Failed to delete test school:', deleteError);
        }
      } catch (readError) {
        console.log('❌ Failed to read back test school:', readError);
      }
    } catch (createError) {
      console.log('❌ Failed to create test school:', createError);
    }
  } catch (error) {
    console.log('❌ Error testing school collection:', error);
  }
  
  // Try creating a test user
  try {
    console.log('\nTesting Account Creation...');
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    const password = 'Password123!';
    const name = `Test User ${timestamp}`;
    
    try {
      const userId = ID.unique();
      await account.create(userId, email, password, name);
      console.log('✅ Successfully created test user!');
      
      // Try to delete the user account (note: this will likely fail without server-side functions)
      try {
        // We can't directly delete users in client-side code with Appwrite 17.x
        console.log('Note: Cannot delete test user via client-side SDK. Manual cleanup required.');
      } catch (deleteError) {
        console.log('❌ Unable to delete test user:', deleteError);
      }
    } catch (createError) {
      console.log('❌ Failed to create test user:', createError);
    }
  } catch (error) {
    console.log('❌ Error testing account creation:', error);
  }
  
  console.log('\nVerification Completed!');
  console.log('=====================');
  console.log('Next Steps:');
  console.log('1. Make sure you are running the app (npm run dev)');
  console.log('2. Open the app in your browser');
  console.log('3. First create a school, then create accounts attached to that school');
  console.log('4. If you created test data but were unable to delete it, log into Appwrite console to clean up');
};

// Execute the function
verify().catch(console.error); 