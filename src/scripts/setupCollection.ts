import { Client, Databases, Account, ID, Permission, Role } from 'appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Debug: Print environment variables (safely)
console.log('Environment variables loaded:');
console.log('VITE_APPWRITE_ENDPOINT:', process.env.VITE_APPWRITE_ENDPOINT);
console.log('VITE_APPWRITE_PROJECT_ID:', process.env.VITE_APPWRITE_PROJECT_ID);
console.log('VITE_APPWRITE_DATABASE_ID:', process.env.VITE_APPWRITE_DATABASE_ID);
console.log('VITE_ADMIN_EMAIL:', process.env.VITE_ADMIN_EMAIL);
console.log('VITE_ADMIN_PASSWORD length:', process.env.VITE_ADMIN_PASSWORD?.length);

// Initialize the Appwrite client
const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || '')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '');

// Initialize services
const account = new Account(client);
const databases = new Databases(client);

const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || '';

// Collection IDs from environment variables
const COLLECTIONS = {
    SCHOOLS: process.env.VITE_APPWRITE_SCHOOLS_COLLECTION_ID,
    USERS: process.env.VITE_APPWRITE_USERS_COLLECTION_ID,
    GRADES: process.env.VITE_APPWRITE_GRADES_COLLECTION_ID,
    USER_GRADES: process.env.VITE_APPWRITE_USER_GRADES_COLLECTION_ID,
    SUBSCRIPTIONS: process.env.VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID
};

// Validate required environment variables
const requiredEnvVars = [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID',
    'VITE_APPWRITE_DATABASE_ID',
    'VITE_ADMIN_EMAIL',
    'VITE_ADMIN_PASSWORD',
    'VITE_APPWRITE_SCHOOLS_COLLECTION_ID',
    'VITE_APPWRITE_USERS_COLLECTION_ID',
    'VITE_APPWRITE_GRADES_COLLECTION_ID',
    'VITE_APPWRITE_USER_GRADES_COLLECTION_ID',
    'VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

async function setupCollection() {
    try {
        console.log('Starting setup process...');

        // Step 1: Create admin user if not exists
        let userId: string;
        try {
            const email = process.env.VITE_ADMIN_EMAIL || '';
            const password = process.env.VITE_ADMIN_PASSWORD || '';
            
            console.log('Creating admin user...');
            const user = await account.create(
                ID.unique(),
                email,
                password,
                'Admin User'
            );
            userId = user.$id;
            console.log('Admin user created successfully:', userId);
        } catch (error: any) {
            if (error.code === 409) {
                console.log('Admin user already exists, proceeding...');
                
                // Need to get the userId for the existing admin user
                try {
                    // First we need to authenticate to get the user info
                    await account.createEmailPasswordSession(
                        process.env.VITE_ADMIN_EMAIL || '',
                        process.env.VITE_ADMIN_PASSWORD || ''
                    );
                    
                    // Then get the user details to get the ID
                    const user = await account.get();
                    userId = user.$id;
                    console.log('Got existing admin user ID:', userId);
                    
                    // Delete the session since we'll create a new one below
                    await account.deleteSession('current');
                } catch (err) {
                    console.log('Could not get existing user ID, using unique ID instead');
                    userId = ID.unique();
                }
            } else {
                throw error;
            }
        }

        // Step 2: Authenticate
        console.log('Authenticating...');
        try {
            const session = await account.createEmailPasswordSession(
                process.env.VITE_ADMIN_EMAIL || '',
                process.env.VITE_ADMIN_PASSWORD || ''
            );
            console.log('Authentication successful!');
        } catch (error: any) {
            console.error('Authentication error:', error);
            console.log('Trying alternative authentication method...');
            try {
                // Check what methods are available - this is a safety check
                const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(account));
                console.log('Available authentication methods:', methods.filter(m => m.includes('create') && m.includes('Session')));
                
                // Try the most likely method names based on your SDK version
                if (typeof (account as any).createEmailSession === 'function') {
                    await (account as any).createEmailSession(
                        process.env.VITE_ADMIN_EMAIL || '',
                        process.env.VITE_ADMIN_PASSWORD || ''
                    );
                    console.log('Alternative email session authentication successful!');
                } else if (typeof account.createSession === 'function') {
                    // Last resort - use a different approach
                    console.log('Attempting to use createSession as a fallback...');
                    
                    // This may not work depending on your SDK version, but worth a try
                    try {
                        await account.createSession(
                            userId, // Use the userId we got earlier
                            process.env.VITE_ADMIN_PASSWORD || '' // Use password as the "secret"
                        );
                        console.log('Session created with createSession successfully');
                    } catch (sessionError) {
                        console.error('Fallback createSession failed:', sessionError);
                        throw new Error('No suitable authentication method found in this SDK version');
                    }
                } else {
                    throw new Error('No suitable authentication method found in this SDK version');
                }
            } catch (altError: any) {
                console.error('Alternative authentication failed:', altError);
                throw new Error('Cannot authenticate: ' + altError.message);
            }
        }

        // Step 3: Create collections and their attributes
        for (const [name, id] of Object.entries(COLLECTIONS)) {
            if (!id) continue; // Skip if collection ID is not defined
            
            console.log(`\nSetting up ${name} collection...`);
            
            try {
                // Create collection if it doesn't exist
                try {
                    await databases.getCollection(DATABASE_ID, id);
                    console.log(`✓ Collection ${name} already exists`);
                } catch (error: any) {
                    if (error.code === 404) {
                        // Create collection with permissions
                        await databases.createCollection(
                            DATABASE_ID,
                            id,
                            name,
                            getCollectionPermissions(name)
                        );
                        console.log(`✓ Created ${name} collection`);
                    } else {
                        throw error;
                    }
                }

                // Add attributes based on collection type
                const attributes = getCollectionAttributes(name);
                for (const attr of attributes) {
                    try {
                        // Use the appropriate method based on attribute type
                        switch (attr.type) {
                            case 'string':
                                await databases.createStringAttribute(
                                    DATABASE_ID,
                                    id,
                                    attr.key,
                                    255, // Default max length
                                    attr.required,
                                    attr.default,
                                    attr.array
                                );
                                break;
                            case 'boolean':
                                await databases.createBooleanAttribute(
                                    DATABASE_ID,
                                    id,
                                    attr.key,
                                    attr.required,
                                    attr.default,
                                    attr.array
                                );
                                break;
                            case 'datetime':
                                await databases.createDatetimeAttribute(
                                    DATABASE_ID,
                                    id,
                                    attr.key,
                                    attr.required,
                                    attr.default,
                                    attr.array
                                );
                                break;
                            default:
                                console.log(`Skipping unsupported attribute type: ${attr.type}`);
                        }
                        console.log(`✓ Added attribute ${attr.key} to ${name}`);
                    } catch (error: any) {
                        if (error.code === 409) {
                            console.log(`Attribute ${attr.key} already exists in ${name}`);
                        } else {
                            console.error(`Error creating attribute ${attr.key}:`, error.message);
                        }
                    }
                }

                // Create indexes
                const indexes = getCollectionIndexes(name);
                for (const index of indexes) {
                    try {
                        await databases.createIndex(
                            DATABASE_ID,
                            id,
                            index.key,
                            index.type,
                            index.attributes,
                            index.orders
                        );
                        console.log(`✓ Added index ${index.key} to ${name}`);
                    } catch (error: any) {
                        if (error.code === 409) {
                            console.log(`Index ${index.key} already exists in ${name}`);
                        } else {
                            console.error(`Error creating index ${index.key}:`, error.message);
                        }
                    }
                }

            } catch (error: any) {
                console.error(`Error setting up ${name} collection:`, error.message);
                console.error('Error code:', error.code);
                console.error('Error type:', error.type);
            }
        }

        // Clean up session
        try {
            await account.deleteSession('current');
            console.log('\nSession cleaned up successfully');
        } catch (error) {
            console.error('Error cleaning up session:', error);
        }
        
        console.log('\nSetup completed successfully!');
    } catch (error: any) {
        console.error('Setup failed:', error.message);
        console.error('Error code:', error.code);
        console.error('Error type:', error.type);
        process.exit(1);
    }
}

function getCollectionPermissions(collectionName: string) {
    switch (collectionName) {
        case 'SCHOOLS':
            return [
                Permission.read(Role.any()),
                Permission.create(Role.team('admin')),
                Permission.update(Role.team('admin')),
                Permission.delete(Role.team('admin'))
            ];
        case 'USERS':
            return [
                Permission.read(Role.any()),
                Permission.create(Role.team('admin')),
                Permission.update(Role.team('admin')),
                Permission.delete(Role.team('admin'))
            ];
        case 'GRADES':
            return [
                Permission.read(Role.any()),
                Permission.create(Role.team('admin')),
                Permission.update(Role.team('admin')),
                Permission.delete(Role.team('admin'))
            ];
        case 'USER_GRADES':
            return [
                Permission.read(Role.any()),
                Permission.create(Role.team('admin')),
                Permission.update(Role.team('admin')),
                Permission.delete(Role.team('admin'))
            ];
        case 'SUBSCRIPTIONS':
            return [
                Permission.read(Role.any()),
                Permission.create(Role.team('admin')),
                Permission.update(Role.team('admin')),
                Permission.delete(Role.team('admin'))
            ];
        default:
            return [
                Permission.read(Role.any()),
                Permission.create(Role.any()),
                Permission.update(Role.any()),
                Permission.delete(Role.any())
            ];
    }
}

function getCollectionAttributes(collectionName: string) {
    switch (collectionName) {
        case 'SCHOOLS':
            return [
                { key: 'name', type: 'string', required: true, default: null, array: false },
                { key: 'email', type: 'string', required: true, default: null, array: false },
                { key: 'phone', type: 'string', required: true, default: null, array: false },
                { key: 'address', type: 'string', required: true, default: null, array: false },
                { key: 'location', type: 'string', required: true, default: null, array: false },
                { key: 'active', type: 'boolean', required: true, default: true, array: false },
                { key: 'subscriptionStart', type: 'datetime', required: true, default: null, array: false },
                { key: 'subscriptionEnd', type: 'datetime', required: true, default: null, array: false },
                { key: 'logo', type: 'string', required: false, default: null, array: false },
                { key: 'createdAt', type: 'datetime', required: true, default: null, array: false }
            ];
        case 'USERS':
            return [
                { key: 'name', type: 'string', required: true, default: null, array: false },
                { key: 'email', type: 'string', required: true, default: null, array: false },
                { key: 'username', type: 'string', required: true, default: null, array: false },
                { key: 'role', type: 'string', required: true, default: 'schoolAdmin', array: false },
                { key: 'active', type: 'boolean', required: true, default: true, array: false },
                { key: 'schoolId', type: 'string', required: true, default: null, array: false },
                { key: 'schoolName', type: 'string', required: false, default: null, array: false },
                { key: 'schoolLogo', type: 'string', required: false, default: null, array: false },
                { key: 'gradeLevels', type: 'string', required: false, default: null, array: true },
                { key: 'createdAt', type: 'datetime', required: true, default: null, array: false },
                { key: 'lastLogin', type: 'datetime', required: false, default: null, array: false }
            ];
        case 'GRADES':
            return [
                { key: 'name', type: 'string', required: true, default: null, array: false },
                { key: 'schoolId', type: 'string', required: true, default: null, array: false },
                { key: 'active', type: 'boolean', required: true, default: true, array: false },
                { key: 'createdAt', type: 'datetime', required: true, default: null, array: false }
            ];
        case 'USER_GRADES':
            return [
                { key: 'userId', type: 'string', required: true, default: null, array: false },
                { key: 'gradeId', type: 'string', required: true, default: null, array: false },
                { key: 'schoolId', type: 'string', required: true, default: null, array: false },
                { key: 'createdAt', type: 'datetime', required: true, default: null, array: false }
            ];
        case 'SUBSCRIPTIONS':
            return [
                { key: 'schoolId', type: 'string', required: true, default: null, array: false },
                { key: 'startDate', type: 'datetime', required: true, default: null, array: false },
                { key: 'endDate', type: 'datetime', required: true, default: null, array: false },
                { key: 'status', type: 'string', required: true, default: 'active', array: false },
                { key: 'plan', type: 'string', required: true, default: 'basic', array: false },
                { key: 'createdAt', type: 'datetime', required: true, default: null, array: false }
            ];
        default:
            return [];
    }
}

function getCollectionIndexes(collectionName: string) {
    switch (collectionName) {
        case 'SCHOOLS':
            return [
                { key: 'email', type: 'unique', attributes: ['email'], orders: ['ASC'] },
                { key: 'name', type: 'key', attributes: ['name'], orders: ['ASC'] }
            ];
        case 'USERS':
            return [
                { key: 'email', type: 'unique', attributes: ['email'], orders: ['ASC'] },
                { key: 'username', type: 'unique', attributes: ['username'], orders: ['ASC'] },
                { key: 'schoolId', type: 'key', attributes: ['schoolId'], orders: ['ASC'] }
            ];
        case 'GRADES':
            return [
                { key: 'schoolId', type: 'key', attributes: ['schoolId'], orders: ['ASC'] },
                { key: 'name_schoolId', type: 'unique', attributes: ['name', 'schoolId'], orders: ['ASC', 'ASC'] }
            ];
        case 'USER_GRADES':
            return [
                { key: 'userId_gradeId', type: 'unique', attributes: ['userId', 'gradeId'], orders: ['ASC', 'ASC'] },
                { key: 'schoolId', type: 'key', attributes: ['schoolId'], orders: ['ASC'] }
            ];
        case 'SUBSCRIPTIONS':
            return [
                { key: 'schoolId', type: 'unique', attributes: ['schoolId'], orders: ['ASC'] },
                { key: 'status', type: 'key', attributes: ['status'], orders: ['ASC'] }
            ];
        default:
            return [];
    }
}

// Run the setup
setupCollection();