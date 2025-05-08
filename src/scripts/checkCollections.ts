import { Client, Databases, Account, ID, Permission, Role, Query } from 'appwrite';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from the .env file in the project root
dotenv.config({ path: resolve(process.cwd(), '.env') });

// Initialize the Appwrite client
const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || '')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '');

// Initialize services
const databases = new Databases(client);
const account = new Account(client);

// Database and Collection IDs from environment variables
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || '';
const USERS_COLLECTION_ID = process.env.VITE_APPWRITE_USERS_COLLECTION_ID || '';
const SCHOOLS_COLLECTION_ID = process.env.VITE_APPWRITE_SCHOOLS_COLLECTION_ID || '';

// Main function to check and create collections
async function checkCollections() {
    console.log('===== Collection Check Tool =====');
    console.log('Checking if collections exist and creating them if needed.');
    console.log('Environment variables:');
    console.log('- ENDPOINT:', process.env.VITE_APPWRITE_ENDPOINT);
    console.log('- PROJECT_ID:', process.env.VITE_APPWRITE_PROJECT_ID);
    console.log('- DATABASE_ID:', DATABASE_ID);
    console.log('- USERS_COLLECTION_ID:', USERS_COLLECTION_ID);
    console.log('- SCHOOLS_COLLECTION_ID:', SCHOOLS_COLLECTION_ID);
    
    if (!DATABASE_ID || !USERS_COLLECTION_ID || !SCHOOLS_COLLECTION_ID) {
        console.error('❌ Error: One or more environment variables are missing. Please check your .env file.');
        return;
    }
    
    try {
        // Check database
        try {
            const db = await databases.get(DATABASE_ID);
            console.log(`✅ Database found: ${db.name} (${db.$id})`);
        } catch (error) {
            console.error('❌ Database not found. Please create it in the Appwrite console.');
            return;
        }
        
        // Check USERS_COLLECTION
        let usersCollection;
        try {
            const collections = await databases.listCollections(DATABASE_ID);
            usersCollection = collections.collections.find(c => c.$id === USERS_COLLECTION_ID);
            
            if (usersCollection) {
                console.log(`✅ Users collection found: ${usersCollection.name} (${usersCollection.$id})`);
            } else {
                console.log('❌ Users collection not found. Creating it now...');
                
                usersCollection = await databases.createCollection(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    'Users',
                    [
                        Permission.read(Role.any()),
                        Permission.create(Role.any()),
                        Permission.update(Role.any()),
                        Permission.delete(Role.any())
                    ]
                );
                
                console.log(`✅ Created Users collection: ${usersCollection.$id}`);
                
                // Create attributes for Users
                console.log('Creating attributes for Users collection...');
                
                await databases.createStringAttribute(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    'name',
                    255,
                    true
                );
                console.log('- Created name attribute');
                
                await databases.createStringAttribute(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    'email',
                    255,
                    true
                );
                console.log('- Created email attribute');
                
                await databases.createStringAttribute(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    'username',
                    255,
                    true
                );
                console.log('- Created username attribute');
                
                await databases.createStringAttribute(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    'role',
                    30,
                    true
                );
                console.log('- Created role attribute');
                
                await databases.createStringAttribute(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    'schoolId',
                    36,
                    false
                );
                console.log('- Created schoolId attribute');
                
                await databases.createStringAttribute(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    'schoolName',
                    255,
                    false
                );
                console.log('- Created schoolName attribute');
                
                await databases.createStringAttribute(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    'schoolLogo',
                    255,
                    false
                );
                console.log('- Created schoolLogo attribute');
                
                await databases.createStringAttribute(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    'lastLogin',
                    255,
                    false
                );
                console.log('- Created lastLogin attribute');
                
                await databases.createStringAttribute(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    'createdAt',
                    255,
                    true
                );
                console.log('- Created createdAt attribute');
                
                try {
                    await databases.createStringAttribute(
                        DATABASE_ID,
                        USERS_COLLECTION_ID,
                        'gradeLevels',
                        255,
                        false,
                        undefined,
                        true
                    );
                    console.log('- Created gradeLevels array attribute');
                } catch (error: any) {
                    console.warn(`⚠️ Could not create gradeLevels attribute: ${error.message}`);
                }
                
                // Create indexes
                await databases.createIndex(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    'email_index',
                    ['email'],
                    'unique'
                );
                console.log('- Created email index');
                
                await databases.createIndex(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    'username_index',
                    ['username'],
                    'unique'
                );
                console.log('- Created username index');
                
                await databases.createIndex(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    'role_index',
                    ['role'],
                    'key'
                );
                console.log('- Created role index');
                
                await databases.createIndex(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    'schoolId_index',
                    ['schoolId'],
                    'key'
                );
                console.log('- Created schoolId index');
            }
        } catch (error: any) {
            console.error(`❌ Error with Users collection: ${error.message}`);
        }
        
        // Check SCHOOLS_COLLECTION
        let schoolsCollection;
        try {
            const collections = await databases.listCollections(DATABASE_ID);
            schoolsCollection = collections.collections.find(c => c.$id === SCHOOLS_COLLECTION_ID);
            
            if (schoolsCollection) {
                console.log(`✅ Schools collection found: ${schoolsCollection.name} (${schoolsCollection.$id})`);
            } else {
                console.log('❌ Schools collection not found. Creating it now...');
                
                schoolsCollection = await databases.createCollection(
                    DATABASE_ID,
                    SCHOOLS_COLLECTION_ID,
                    'Schools',
                    [
                        Permission.read(Role.any()),
                        Permission.create(Role.any()),
                        Permission.update(Role.any()),
                        Permission.delete(Role.any())
                    ]
                );
                
                console.log(`✅ Created Schools collection: ${schoolsCollection.$id}`);
                
                // Create attributes for Schools
                console.log('Creating attributes for Schools collection...');
                
                await databases.createStringAttribute(
                    DATABASE_ID,
                    SCHOOLS_COLLECTION_ID,
                    'name',
                    255,
                    true
                );
                console.log('- Created name attribute');
                
                await databases.createStringAttribute(
                    DATABASE_ID,
                    SCHOOLS_COLLECTION_ID,
                    'email',
                    255,
                    false
                );
                console.log('- Created email attribute');
                
                await databases.createStringAttribute(
                    DATABASE_ID,
                    SCHOOLS_COLLECTION_ID,
                    'phone',
                    30,
                    false
                );
                console.log('- Created phone attribute');
                
                await databases.createStringAttribute(
                    DATABASE_ID,
                    SCHOOLS_COLLECTION_ID,
                    'address',
                    500,
                    false
                );
                console.log('- Created address attribute');
                
                await databases.createStringAttribute(
                    DATABASE_ID,
                    SCHOOLS_COLLECTION_ID,
                    'location',
                    100,
                    false
                );
                console.log('- Created location attribute');
                
                await databases.createBooleanAttribute(
                    DATABASE_ID,
                    SCHOOLS_COLLECTION_ID,
                    'active',
                    true
                );
                console.log('- Created active attribute');
                
                await databases.createStringAttribute(
                    DATABASE_ID,
                    SCHOOLS_COLLECTION_ID,
                    'subscriptionStart',
                    30,
                    false
                );
                console.log('- Created subscriptionStart attribute');
                
                await databases.createStringAttribute(
                    DATABASE_ID,
                    SCHOOLS_COLLECTION_ID,
                    'subscriptionEnd',
                    30,
                    false
                );
                console.log('- Created subscriptionEnd attribute');
                
                await databases.createStringAttribute(
                    DATABASE_ID,
                    SCHOOLS_COLLECTION_ID,
                    'logo',
                    500,
                    false
                );
                console.log('- Created logo attribute');
                
                // Create indexes
                await databases.createIndex(
                    DATABASE_ID,
                    SCHOOLS_COLLECTION_ID,
                    'name_index',
                    ['name'],
                    'key'
                );
                console.log('- Created name index');
                
                await databases.createIndex(
                    DATABASE_ID,
                    SCHOOLS_COLLECTION_ID,
                    'active_index',
                    ['active'],
                    'key'
                );
                console.log('- Created active index');
            }
        } catch (error: any) {
            console.error(`❌ Error with Schools collection: ${error.message}`);
        }
        
        console.log('');
        console.log('===== Collection Check Complete =====');
        console.log('You can now create schools and accounts in the admin center.');
        
    } catch (error: any) {
        console.error(`❌ An error occurred: ${error.message}`);
    }
}

// Run the check
checkCollections().catch(console.error); 