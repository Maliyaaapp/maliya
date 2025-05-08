// Account utilities for debugging and fixing sync issues
import { databases, DATABASE_ID, USERS_COLLECTION_ID, account } from '../services/appwrite';
import { Query } from 'appwrite';

export const checkAccountSyncStatus = async () => {
  try {
    // 1. Check if Appwrite is properly configured
    if (!DATABASE_ID || !USERS_COLLECTION_ID) {
      return {
        success: false,
        error: 'Appwrite not properly configured',
        details: { DATABASE_ID, USERS_COLLECTION_ID }
      };
    }

    // 2. Get accounts from localStorage
    const localAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    
    // 3. Get accounts from Appwrite
    const appwriteResponse = await databases.listDocuments(
      DATABASE_ID, 
      USERS_COLLECTION_ID
    );
    
    const appwriteAccounts = appwriteResponse.documents.map(doc => ({
      id: doc.$id,
      email: doc.email,
      name: doc.name || doc.full_name || '',
      role: doc.role
    }));
    
    // 4. Find accounts that exist in localStorage but not in Appwrite
    const appwriteIds = appwriteAccounts.map(a => a.id);
    const localOnlyAccounts = localAccounts.filter(a => !appwriteIds.includes(a.id));
    
    // 5. Find accounts that exist in Appwrite but not in localStorage
    const localIds = localAccounts.map(a => a.id);
    const appwriteOnlyAccounts = appwriteAccounts.filter(a => !localIds.includes(a.id));
    
    return {
      success: true,
      data: {
        totalLocalAccounts: localAccounts.length,
        totalAppwriteAccounts: appwriteAccounts.length,
        localOnlyAccounts,
        appwriteOnlyAccounts,
        isSynced: localOnlyAccounts.length === 0 && appwriteOnlyAccounts.length === 0
      }
    };
  } catch (error) {
    console.error('Error checking account sync status:', error);
    return {
      success: false,
      error: error.message || 'Unknown error checking sync status'
    };
  }
};

export const fixAccountSyncIssues = async () => {
  try {
    const syncStatus = await checkAccountSyncStatus();
    
    if (!syncStatus.success) {
      return syncStatus;
    }
    
    const { localOnlyAccounts, appwriteOnlyAccounts } = syncStatus.data;
    const fixedLocalAccounts = [];
    const fixedAppwriteAccounts = [];
    const errors = [];
    
    // 1. Create Appwrite documents for localStorage-only accounts
    for (const localAccount of localOnlyAccounts) {
      try {
        // Create document in Appwrite
        await databases.createDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          localAccount.id,
          {
            name: localAccount.name || '',
            full_name: localAccount.name || '', 
            email: localAccount.email,
            username: localAccount.username || localAccount.email,
            role: localAccount.role || 'schoolAdmin',
            schoolId: localAccount.schoolId || '',
            schoolName: localAccount.school || '',
            gradeLevels: localAccount.gradeLevels || [],
            createdAt: localAccount.createdAt || new Date().toISOString(),
            lastLogin: localAccount.lastLogin || null
          }
        );
        fixedLocalAccounts.push(localAccount.id);
      } catch (error) {
        errors.push({
          type: 'local_to_appwrite',
          id: localAccount.id,
          error: error.message
        });
      }
    }
    
    // 2. Add Appwrite-only accounts to localStorage
    if (appwriteOnlyAccounts.length > 0) {
      // Get full document details for these accounts
      const localAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
      
      for (const appwriteAccount of appwriteOnlyAccounts) {
        try {
          const doc = await databases.getDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            appwriteAccount.id
          );
          
          // Add to localStorage
          localAccounts.push({
            id: doc.$id,
            name: doc.name || doc.full_name || '',
            email: doc.email,
            username: doc.username || doc.email,
            role: doc.role || 'schoolAdmin',
            schoolId: doc.schoolId || '',
            school: doc.schoolName || '',
            gradeLevels: doc.gradeLevels || [],
            createdAt: doc.createdAt || new Date().toISOString(),
            lastLogin: doc.lastLogin || null
          });
          
          fixedAppwriteAccounts.push(appwriteAccount.id);
        } catch (error) {
          errors.push({
            type: 'appwrite_to_local',
            id: appwriteAccount.id,
            error: error.message
          });
        }
      }
      
      // Save updated localStorage
      localStorage.setItem('accounts', JSON.stringify(localAccounts));
    }
    
    // 3. Check if everything is now in sync
    const finalStatus = await checkAccountSyncStatus();
    
    return {
      success: true,
      data: {
        fixedLocalAccounts,
        fixedAppwriteAccounts,
        errors,
        isSynced: finalStatus.success && finalStatus.data.isSynced
      }
    };
  } catch (error) {
    console.error('Error fixing account sync issues:', error);
    return {
      success: false,
      error: error.message || 'Unknown error fixing sync issues'
    };
  }
};

export default {
  checkAccountSyncStatus,
  fixAccountSyncIssues
}; 