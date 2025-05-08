# Appwrite Setup Guide

This guide will help you set up the necessary Appwrite resources for the School Finance Management System.

## Step 1: Create a Database

1. Login to your Appwrite Console at: https://cloud.appwrite.io/
2. Go to your project (ID: `681afa81001965d1f562`)
3. Click on **Databases** in the left sidebar
4. Click **Create Database**
5. Enter the following information:
   - **Database ID**: `681afac100096bf95c8a` (or use your own ID)
   - **Name**: `School Finance System`
6. Click **Create**

## Step 2: Create Collections

Now you need to create the collections for the database:

### Users Collection

1. In your database, click **Create Collection**
2. Enter the following information:
   - **Collection ID**: `681afaf300306a52303b` (or use your own ID)
   - **Name**: `Users`
   - **Permissions**: Enable read, create, update, and delete access for any role
3. Click **Create**
4. Add the following attributes:
   - `name` (string, required, max 255 chars)
   - `email` (string, required, max 255 chars)
   - `username` (string, required, max 255 chars)
   - `role` (string, required, max 30 chars)
   - `schoolId` (string, not required, max 36 chars)
   - `schoolName` (string, not required, max 255 chars)
   - `schoolLogo` (string, not required, max 255 chars)
   - `lastLogin` (string, not required, max 255 chars)
   - `createdAt` (string, required, max 255 chars)
   - `gradeLevels` (array of strings, not required)
5. Create the following indexes:
   - `email_index` on `email` (Unique)
   - `username_index` on `username` (Unique)
   - `role_index` on `role` (Key)
   - `schoolId_index` on `schoolId` (Key)

### Schools Collection

1. In your database, click **Create Collection**
2. Enter the following information:
   - **Collection ID**: `681afaec00356fb53ee9` (or use your own ID)
   - **Name**: `Schools`
   - **Permissions**: Enable read, create, update, and delete access for any role
3. Click **Create**
4. Add the following attributes:
   - `name` (string, required, max 255 chars)
   - `email` (string, not required, max 255 chars)
   - `phone` (string, not required, max 30 chars)
   - `address` (string, not required, max 500 chars)
   - `location` (string, not required, max 100 chars)
   - `active` (boolean, required, default true)
   - `subscriptionStart` (string, not required, max 30 chars)
   - `subscriptionEnd` (string, not required, max 30 chars)
   - `logo` (string, not required, max 500 chars)
5. Create the following indexes:
   - `name_index` on `name` (Key)
   - `active_index` on `active` (Key)

## Step 3: Verify Environment Variables

Make sure your `.env` file has the following environment variables:

```
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=681afa81001965d1f562
VITE_APPWRITE_DATABASE_ID=681afac100096bf95c8a
VITE_APPWRITE_USERS_COLLECTION_ID=681afaf300306a52303b
VITE_APPWRITE_SCHOOLS_COLLECTION_ID=681afaec00356fb53ee9
VITE_APPWRITE_GRADES_COLLECTION_ID=681c1bf00023fc16e252
VITE_APPWRITE_USER_GRADES_COLLECTION_ID=681c1f900008f888fc22
VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID=681afafe00346c554eea
VITE_ADMIN_EMAIL=your_admin_email@example.com
VITE_ADMIN_PASSWORD=your_admin_password
```

Replace the values with your actual Appwrite IDs.

## Step 4: Reset Local Data (Optional)

If you want to start with a clean slate, you can reset all local data by:

1. Login to the admin portal
2. Click the "مسح جميع البيانات" (Delete All Data) button in the header
3. Confirm the deletion

## Step 5: Creating Schools and Accounts

After setup, you can:

1. Create a school through the admin interface
2. Create user accounts and assign them to schools
3. Assign grade levels to grade managers

## Troubleshooting

If you encounter any errors:

1. Check the browser console for detailed error messages
2. Verify that all collections and attributes are created correctly
3. Ensure your environment variables match the IDs in your Appwrite console
4. Check that you have proper permissions set on collections

For authentication errors, make sure your admin email and password are correctly set in the `.env` file. 