import dotenv from 'dotenv';
import { resolve } from 'path';
import fs from 'fs';

// Load environment variables from .env file
dotenv.config({ path: resolve(process.cwd(), '.env') });

console.log('===== Environment Variables Check =====');

// Check if .env file exists
const envPath = resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log(`✅ .env file found at: ${envPath}`);
  // Read .env file content
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'));
  console.log(`ℹ️ Found ${envLines.length} environment variables defined in .env file.`);
} else {
  console.log(`❌ .env file not found at: ${envPath}`);
}

// Get environment variables from process.env
const envVars = {
  VITE_APPWRITE_ENDPOINT: process.env.VITE_APPWRITE_ENDPOINT,
  VITE_APPWRITE_PROJECT_ID: process.env.VITE_APPWRITE_PROJECT_ID,
  VITE_APPWRITE_DATABASE_ID: process.env.VITE_APPWRITE_DATABASE_ID,
  VITE_APPWRITE_USERS_COLLECTION_ID: process.env.VITE_APPWRITE_USERS_COLLECTION_ID,
  VITE_APPWRITE_SCHOOLS_COLLECTION_ID: process.env.VITE_APPWRITE_SCHOOLS_COLLECTION_ID,
  VITE_APPWRITE_GRADES_COLLECTION_ID: process.env.VITE_APPWRITE_GRADES_COLLECTION_ID,
  VITE_APPWRITE_USER_GRADES_COLLECTION_ID: process.env.VITE_APPWRITE_USER_GRADES_COLLECTION_ID,
  VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID: process.env.VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
  VITE_ADMIN_EMAIL: process.env.VITE_ADMIN_EMAIL,
};

// Check required environment variables
console.log('\nRequired environment variables:');
const requiredVars = [
  'VITE_APPWRITE_ENDPOINT',
  'VITE_APPWRITE_PROJECT_ID',
  'VITE_APPWRITE_DATABASE_ID',
  'VITE_APPWRITE_USERS_COLLECTION_ID',
  'VITE_APPWRITE_SCHOOLS_COLLECTION_ID'
];

let allRequired = true;
for (const key of requiredVars) {
  if (process.env[key]) {
    const value = process.env[key];
    // Mask sensitive information
    const maskedValue = 
      key.includes('EMAIL') || key.includes('PASSWORD') 
        ? `${value?.substring(0, 4)}***${value?.substring(value.length - 3)}`
        : value;
    console.log(`✅ ${key}: ${maskedValue}`);
  } else {
    console.log(`❌ ${key}: Missing`);
    allRequired = false;
  }
}

// Check optional environment variables
console.log('\nOptional environment variables:');
const optionalVars = [
  'VITE_APPWRITE_GRADES_COLLECTION_ID',
  'VITE_APPWRITE_USER_GRADES_COLLECTION_ID',
  'VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID',
  'VITE_ADMIN_EMAIL',
  'VITE_ADMIN_PASSWORD'
];

for (const key of optionalVars) {
  if (process.env[key]) {
    const value = process.env[key];
    // Mask sensitive information
    const maskedValue = 
      key.includes('EMAIL') || key.includes('PASSWORD') 
        ? `${value?.substring(0, 3)}***${value?.substring(value.length - 3)}`
        : value;
    console.log(`✅ ${key}: ${maskedValue}`);
  } else {
    console.log(`⚠️ ${key}: Missing (optional)`);
  }
}

console.log('\n===== Environment Variables Check Complete =====');
if (allRequired) {
  console.log('✅ All required environment variables are defined.');
} else {
  console.log('❌ Some required environment variables are missing. Please update your .env file.');
} 