# Maliya App Setup Guide

This guide will help you set up your Maliya app properly to ensure all functionality works as expected.

## Appwrite Configuration

Your application is configured to use Appwrite as the backend service. Your environment is set up with:

- **Project ID:** `681afa81001965d1f562`
- **Database ID:** `681afac100096bf95c8a`
- **Schools Collection ID:** `681afaec00356fb53ee9`
- **Users Collection ID:** `681afaf300306a52303b`

## Setup Steps

### 1. Start the Development Server

Run the following command to start the development server:

```bash
npm run dev
```

This will start the application at `http://localhost:5173/`.

### 2. First-Time Setup Workflow

Follow this sequence for first-time setup:

1. **Create a School First**: 
   - Go to the admin control panel
   - Select "Schools" and create a new school
   - Fill in all required details and save

2. **Then Create User Accounts**:
   - After creating a school, go to the "Accounts" section
   - Create accounts and associate them with the school you created
   - You can create school admin, grade manager, and other account types

3. **Log in with School Admin Account**:
   - Log out of the admin account if needed
   - Log in with the school admin account you created
   - Set up school details, logo, and other settings

### 3. Troubleshooting Common Issues

If you encounter errors when creating accounts or schools, check the following:

1. **Verify Database Connection**:
   ```bash
   npm run direct-verify
   ```

2. **Check School Creation**:
   - Make sure to create a school before creating user accounts
   - A school must exist before you can attach accounts to it

3. **Browser Console Errors**:
   - Open your browser's developer console (F12)
   - Check for any Appwrite-related errors

### 4. Account Types and Permissions

- **Super Admin**: Can manage all schools and accounts
- **School Admin**: Can manage a specific school's settings, students, and fees
- **Grade Manager**: Can manage only assigned grade levels within a school

### 5. Important Features

1. **Settings**:
   - School admins can update school information, logo, and settings
   - Changes are saved to both local storage and Appwrite

2. **Students & Fees**:
   - Add students individually or import them via CSV
   - Assign fees and create installment plans

3. **Reports**:
   - Generate financial reports
   - Download receipts as PDF

### 6. Known Limitations

- The system uses local storage as a fallback when Appwrite operations fail
- Some features may work differently when using local storage vs. Appwrite

## Help and Support

If you need further assistance, please check the code repository documentation or contact the development team. 