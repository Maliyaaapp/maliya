import { Client, Account } from 'appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

// Debug: Print environment variables (safely)
console.log('Environment variables loaded:');
console.log('VITE_APPWRITE_ENDPOINT:', envConfig.VITE_APPWRITE_ENDPOINT);
console.log('VITE_APPWRITE_PROJECT_ID:', envConfig.VITE_APPWRITE_PROJECT_ID);
console.log('VITE_ADMIN_EMAIL:', envConfig.VITE_ADMIN_EMAIL);
console.log('VITE_ADMIN_PASSWORD length:', envConfig.VITE_ADMIN_PASSWORD ? envConfig.VITE_ADMIN_PASSWORD.length : 0);

// Initialize the Appwrite client
const client = new Client()
    .setEndpoint(envConfig.VITE_APPWRITE_ENDPOINT)
    .setProject(envConfig.VITE_APPWRITE_PROJECT_ID);

// Initialize account service
const account = new Account(client);

async function testAuth() {
    try {
        const email = envConfig.VITE_ADMIN_EMAIL;
        const password = envConfig.VITE_ADMIN_PASSWORD;
        
        console.log('Attempting to authenticate with email:', email);
        
        if (!email || !password) {
            throw new Error('Admin email and password are required');
        }

        // Try to create a new user first
        try {
            console.log('Attempting to create user...');
            const user = await account.create(
                ID.unique(),
                email,
                password,
                'Admin User'
            );
            console.log('User created successfully:', user.$id);
        } catch (error: any) {
            if (error.code === 409) {
                console.log('User already exists, proceeding with login...');
            } else {
                throw error;
            }
        }

        // Now try to authenticate
        console.log('Attempting to authenticate...');
        const session = await account.createEmailSession(email, password);
        console.log('Authentication successful!');
        console.log('Session ID:', session.$id);
        
        // Get user details
        const user = await account.get();
        console.log('User details:', {
            id: user.$id,
            email: user.email,
            name: user.name
        });

        // Clean up session
        await account.deleteSession('current');
        console.log('Session cleaned up successfully');
    } catch (error: any) {
        console.error('Error:', error.message);
        console.error('Error code:', error.code);
        console.error('Error type:', error.type);
        process.exit(1);
    }
}

// Run the test
testAuth(); 