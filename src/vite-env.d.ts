/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT: string
  readonly VITE_APPWRITE_PROJECT_ID: string
  readonly VITE_APPWRITE_DATABASE_ID: string
  readonly VITE_APPWRITE_SCHOOLS_COLLECTION_ID: string
  readonly VITE_APPWRITE_USERS_COLLECTION_ID: string
  readonly VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID: string
  readonly VITE_APPWRITE_GRADES_COLLECTION_ID: string
  readonly VITE_APPWRITE_USER_GRADES_COLLECTION_ID: string
  readonly VITE_ADMIN_EMAIL: string
  readonly VITE_ADMIN_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
