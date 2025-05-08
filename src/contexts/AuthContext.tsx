import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { account, databases, DATABASE_ID, USERS_COLLECTION_ID, ADMIN_EMAIL, client, isAppwriteConfigured } from '../services/appwrite';
import { ID, Query } from 'appwrite';
import api from '../services/api';

// Extend Role to include 'admin'
type Role = 'admin' | 'schoolAdmin' | 'gradeManager';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  schoolId?: string;
  schoolName?: string;
  schoolLogo?: string;
  gradeLevels?: string[];
  username?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInfo: (updatedUser: User) => Promise<void>;
  syncAccounts: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  // Sync accounts from localStorage to Appwrite and vice versa
  const syncAccounts = async (): Promise<boolean> => {
    try {
      const result = await api.syncAccountsWithAppwrite();
      return result;
    } catch (error) {
      console.error('Error syncing accounts:', error);
      return false;
    }
  };

  const checkAuth = async () => {
    try {
      // Try to get the current session using SDK v17.0.2 method first
      let session;
      try {
        session = await account.getSession('current');
      } catch (sessionError: any) {
        // If method doesn't exist, try alternative approaches
        if (sessionError instanceof TypeError && sessionError.message.includes('is not a function')) {
          console.log('Trying alternative session methods...');
          
          // Try a different method that might be available in other SDK versions
          if (typeof (account as any).get === 'function') {
            try {
              // If we can get the account details directly, we're authenticated
              await account.get();
              session = { active: true }; // Create a dummy session object
            } catch (accountError) {
              // If this fails, we're not authenticated
              session = null;
            }
          } else {
            throw new Error('No compatible session method found in this SDK version');
          }
        } else {
          // If it's a different error, rethrow it
          throw sessionError;
        }
      }
      
      // Try to sync accounts with Appwrite if properly configured
      if (isAppwriteConfigured()) {
        await syncAccounts();
      }
      
      if (session) {
        const userData = await account.get();
        console.log('User authenticated:', userData.email);
        
        // Try to get user document but handle permission errors gracefully
        try {
          const userDoc = await databases.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            [Query.equal('email', userData.email)]
          );

          if (userDoc.documents.length > 0) {
            const userInfo = userDoc.documents[0];
            const user: User = {
              id: userInfo.$id,
              name: userInfo.name,
              email: userInfo.email,
              role: userInfo.email === ADMIN_EMAIL ? 'admin' : userInfo.role,
              schoolId: userInfo.schoolId,
              schoolName: userInfo.schoolName,
              schoolLogo: userInfo.schoolLogo,
              gradeLevels: userInfo.gradeLevels,
              username: userInfo.username
            };
            setUser(user);
            setIsAuthenticated(true);
          } else {
            console.log('No user document found, using basic user info');
            setUser({
              id: userData.$id,
              name: userData.name,
              email: userData.email,
              role: userData.email === ADMIN_EMAIL ? 'admin' : 'schoolAdmin'
            });
            setIsAuthenticated(true);
          }
        } catch (userDocError) {
          console.error('Error accessing user document, using basic user info:', userDocError);
          // If we can't access the document due to permissions, still set basic user info
          setUser({
            id: userData.$id,
            name: userData.name,
            email: userData.email,
            role: userData.email === ADMIN_EMAIL ? 'admin' : 'schoolAdmin'
          });
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (emailOrUsername: string, password: string) => {
    console.log('Attempting login with:', emailOrUsername);
    try {
      // First try to authenticate using the correct method for SDK v17.0.2
      try {
        const session = await account.createEmailPasswordSession(emailOrUsername, password);
        console.log('Login successful, session created:', session.$id);
      } catch (authError: any) {
        // If the method doesn't exist, try alternative methods
        if (authError instanceof TypeError && authError.message.includes('is not a function')) {
          console.log('Trying alternative authentication methods...');
          
          // Try older SDK methods
          if (typeof (account as any).createEmailSession === 'function') {
            await (account as any).createEmailSession(emailOrUsername, password);
            console.log('Login successful using alternative method');
          } else {
            throw new Error('No compatible authentication method found in this SDK version');
          }
        } else {
          // If it's a different error, rethrow it
          console.error('Authentication error:', authError);
          throw authError;
        }
      }
      
      // Verify that we're actually authenticated by getting the account
      try {
        const userData = await account.get();
        console.log('User authenticated:', userData.email);
        
        // Now try to get the user document but handle permission errors gracefully
        try {
          const userDoc = await databases.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            [Query.equal('email', userData.email)]
          );

          let userInfo;
          if (userDoc.documents.length === 0) {
            console.log('No document found by email, trying username');
            // If no document found by email, try username
            try {
              const usernameDoc = await databases.listDocuments(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                [Query.equal('username', emailOrUsername)]
              );

              if (usernameDoc.documents.length === 0) {
                console.log('No document found by username either, creating a new one');
                // If still no document found, create one
                try {
                  const newUserDoc = {
                    name: userData.name,
                    email: userData.email,
                    role: userData.email === ADMIN_EMAIL ? 'admin' : 'schoolAdmin',
                    createdAt: new Date().toISOString(),
                    username: emailOrUsername.includes('@') ? emailOrUsername.split('@')[0] : emailOrUsername
                  };

                  const createdDoc = await databases.createDocument(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    ID.unique(),
                    newUserDoc
                  );

                  // Set user state
                  setUser({
                    id: createdDoc.$id,
                    name: createdDoc.name,
                    email: createdDoc.email,
                    role: createdDoc.role as Role,
                    username: createdDoc.username
                  });
                  setIsAuthenticated(true);
                  return;
                } catch (createError) {
                  console.error('Error creating user document:', createError);
                  // Still set the user with basic info
                  setUser({
                    id: userData.$id,
                    name: userData.name,
                    email: userData.email,
                    role: userData.email === ADMIN_EMAIL ? 'admin' : 'schoolAdmin'
                  });
                  setIsAuthenticated(true);
                  return;
                }
              }
              userInfo = usernameDoc.documents[0];
            } catch (usernameError) {
              console.error('Error searching by username:', usernameError);
              // Still set the user with basic info
              setUser({
                id: userData.$id,
                name: userData.name,
                email: userData.email,
                role: userData.email === ADMIN_EMAIL ? 'admin' : 'schoolAdmin'
              });
              setIsAuthenticated(true);
              return;
            }
          } else {
            userInfo = userDoc.documents[0];
          }

          // If we found a document, update the user state
          const user: User = {
            id: userInfo.$id,
            name: userInfo.name,
            email: userInfo.email,
            role: userInfo.role as Role,
            schoolId: userInfo.schoolId,
            schoolName: userInfo.schoolName,
            schoolLogo: userInfo.schoolLogo,
            gradeLevels: userInfo.gradeLevels,
            username: userInfo.username
          };
          setUser(user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error accessing user document, using basic info:', error);
          // If we can't access the document, still set basic user info
          setUser({
            id: userData.$id,
            name: userData.name,
            email: userData.email,
            role: userData.email === ADMIN_EMAIL ? 'admin' : 'schoolAdmin'
          });
          setIsAuthenticated(true);
        }
      } catch (userDataError) {
        console.error('Error getting user data after login:', userDataError);
        // Log out the user if we can't get their data
        try {
          await logout();
        } catch (e) {
          // Ignore logout errors
        }
        throw new Error('Failed to get user data after login. Please try again.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Clean up any partial session
      try {
        await account.deleteSession('current');
      } catch (e) {
        // Ignore cleanup errors
      }
      throw error;
    }
  };

  const logout = async () => {
    console.log('Attempting to log out user');
    try {
      // Try using the SDK v17.0.2 method first
      try {
        await account.deleteSession('current');
        console.log('Session deleted successfully');
      } catch (logoutError: any) {
        console.warn('Error during session deletion:', logoutError);
        
        // If method doesn't exist, try alternative approaches
        if (logoutError instanceof TypeError && logoutError.message.includes('is not a function')) {
          console.log('Trying alternative logout methods...');
          
          // Try different method names that might exist in other SDK versions
          if (typeof account.deleteSessions === 'function') {
            await account.deleteSessions();
            console.log('All sessions deleted successfully');
          } else if (typeof (account as any).deleteSession === 'function') {
            await (account as any).deleteSession('current');
            console.log('Session deleted with alternative method');
          } else {
            console.error('Could not find a compatible logout method in this SDK version');
          }
        }
        // Don't throw error here - just continue to clean up local state
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Continue to clean up local state regardless of API errors
    } finally {
      // Always reset local state
      console.log('Resetting user state');
      setUser(null);
      setIsAuthenticated(false);
    }
  };
  
  const updateUserInfo = async (updatedUser: User) => {
    console.log('updateUserInfo called with:', updatedUser);
    try {
      console.log('Updating user document in Appwrite with ID:', updatedUser.id);
      console.log('DATABASE_ID:', DATABASE_ID);
      console.log('USERS_COLLECTION_ID:', USERS_COLLECTION_ID);
      
      const updateData = {
        name: updatedUser.name,
        email: updatedUser.email,
        schoolName: updatedUser.schoolName,
        schoolLogo: updatedUser.schoolLogo,
        gradeLevels: updatedUser.gradeLevels
      };
      console.log('Update data:', updateData);
      
      await databases.updateDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        updatedUser.id,
        updateData
      );
      
      console.log('Document updated successfully, updating local state');
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user info:', error);
      throw error;
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateUserInfo, syncAccounts }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
 