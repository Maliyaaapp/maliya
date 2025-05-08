import { Client, Databases } from 'appwrite';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
dotenv.config({ path: resolve(process.cwd(), '.env') });

console.log('===== Create Database Script =====');

// Initialize Appwrite Client
const client = new Client();
client
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || '')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '');

// Initialize Databases service
const databases = new Databases(client);

async function createDatabase() {
  try {
    const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
    
    if (!databaseId) {
      console.error('❌ VITE_APPWRITE_DATABASE_ID is not defined in .env file');
      return;
    }
    
    console.log(`Attempting to create database with ID: ${databaseId}`);
    
    // Try to create the database
    const database = await databases.create(
      databaseId,
      'School Finance System'
    );
    
    console.log(`✅ Database created successfully!`);
    console.log(`Database ID: ${database.$id}`);
    console.log(`Database Name: ${database.name}`);
    
    console.log('\nNow you can run the check-collections script to create collections:');
    console.log('npm run check-collections');
    
  } catch (error: any) {
    if (error.code === 409) {
      console.log('⚠️ Database already exists with this ID.');
      console.log('You can continue with creating collections:');
      console.log('npm run check-collections');
    } else {
      console.error('❌ Error creating database:', error);
      console.error('Error Message:', error.message);
      console.error('Error Code:', error.code);
      
      if (error.code === 401 || error.code === 403) {
        console.log('\n⚠️ Authentication or permission error. Make sure you:');
        console.log('1. Have administrative access to the Appwrite project');
        console.log('2. Have an API key with the correct permissions');
      }
    }
  }
}

createDatabase().catch(console.error); 