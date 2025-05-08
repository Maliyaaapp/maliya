# Fixing CORS Issues with Appwrite and Netlify

If you're experiencing CORS (Cross-Origin Resource Sharing) errors when trying to access your Appwrite backend from your Netlify-hosted application, follow these steps:

## The Problem

You may see errors like:

```
Access to fetch at 'https://fra.cloud.appwrite.io/v1/account/sessions/email' from origin 'https://amazing-lamington-e4a91e.netlify.app' has been blocked by CORS policy: The 'Access-Control-Allow-Origin' header has a value 'https://localhost' that is not equal to the supplied origin.
```

This happens because Appwrite is configured to only accept requests from `localhost`, but your application is now hosted on Netlify.

## The Solution

1. Log in to your Appwrite console at [https://cloud.appwrite.io](https://cloud.appwrite.io)
2. Navigate to your project
3. Go to the **Overview** page
4. Scroll down to the **Integrations** section
5. Look for the existing Web platform (likely configured for localhost) or click **Add Platform**
6. Select **Web** platform type
7. Add your Netlify domain (e.g., `https://amazing-lamington-e4a91e.netlify.app`) as the site name
8. Save the changes

## Testing the Connection

After updating your CORS configuration:

1. Wait a few minutes for changes to propagate
2. Clear your browser cache or use an incognito/private window
3. Try accessing your application again

## Additional Tips

- If you're using multiple environments (development, staging, production), add all necessary domains to your Appwrite platforms list
- Make sure your Appwrite client initialization in your code uses the correct project ID and endpoint:

```typescript
const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('681afa81001965d1f562');
```

- If you're still experiencing issues, check the Appwrite documentation on CORS: [https://appwrite.io/docs/advanced/platform-integration](https://appwrite.io/docs/advanced/platform-integration) 