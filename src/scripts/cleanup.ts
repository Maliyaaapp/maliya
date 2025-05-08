import { Client, Databases, Account, ID } from 'appwrite';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT!)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);
const account = new Account(client);

const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID!;
const USERS_COLLECTION_ID = process.env.VITE_APPWRITE_USERS_COLLECTION_ID!;
const SCHOOLS_COLLECTION_ID = process.env.VITE_APPWRITE_SCHOOLS_COLLECTION_ID!;
const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL!;

async function main() {
  try {
    console.log('Starting database cleanup...');
    
    // First, create an email session to authenticate
    await account.createEmailSession(
      process.env.VITE_ADMIN_EMAIL!,
      process.env.VITE_ADMIN_PASSWORD!
    );
    
    // Get current user to verify authentication
    const currentUser = await account.get();
    console.log('Authenticated as:', currentUser.email);
    
    // Get all users from Users collection
    const usersResponse = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID
    );

    let deletedUsers = 0;
    // Delete all users except admin
    for (const user of usersResponse.documents) {
      if (user.email !== ADMIN_EMAIL) {
        try {
          // Delete from Users collection
          await databases.deleteDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            user.$id
          );
          deletedUsers++;
          console.log(`Deleted user: ${user.email}`);
        } catch (error) {
          console.error(`Error deleting user ${user.$id} from collection:`, error);
        }
      } else {
        console.log('Skipping admin user:', user.email);
      }
    }

    // Get all schools
    const schoolsResponse = await databases.listDocuments(
      DATABASE_ID,
      SCHOOLS_COLLECTION_ID
    );

    let deletedSchools = 0;
    // Delete all schools
    for (const school of schoolsResponse.documents) {
      try {
        await databases.deleteDocument(
          DATABASE_ID,
          SCHOOLS_COLLECTION_ID,
          school.$id
        );
        deletedSchools++;
        console.log(`Deleted school: ${school.name}`);
      } catch (error) {
        console.error(`Error deleting school ${school.$id}:`, error);
      }
    }

    console.log('\nCleanup completed successfully!');
    console.log('Deleted users:', deletedUsers);
    console.log('Deleted schools:', deletedSchools);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 