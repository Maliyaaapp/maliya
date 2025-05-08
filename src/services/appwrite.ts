import { Client, Account, Databases } from 'appwrite';

// Create a client
const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1') // Appwrite endpoint
    .setProject('681afa81001965d1f562'); // Your project ID

// Register/login services
export const account = new Account(client);
export const databases = new Databases(client);

// Export collection IDs from environment variables with fallbacks
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '681afac100096bf95c8a';
export const USERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || '681afafb0007a8105c79';
export const SCHOOLS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SCHOOLS_COLLECTION_ID || '681afaec00356fb53ee9';
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

// Check if Appwrite configuration is properly set
const isAppwriteConfigured = () => {
    return Boolean(
        DATABASE_ID && 
        USERS_COLLECTION_ID && 
        SCHOOLS_COLLECTION_ID
    );
};

// Export client and utility function
export { client, isAppwriteConfigured }; 