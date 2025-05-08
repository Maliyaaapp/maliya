# Debugging Tips for Maliya App

## Authentication Issues

If you're being redirected to the wrong dashboard after login (e.g., school instead of admin):

1. Check browser console logs for the following information:
   - "Admin email configured as: [email]"
   - "Is admin check: [true/false]"
   - "Setting user with role: [role]"

2. Verify that the ADMIN_EMAIL environment variable matches your email exactly.

3. Clear your browser's local storage to reset the authentication state:
   ```javascript
   // Run this in your browser console
   localStorage.clear()
   ```

4. Try logging in with a private/incognito window.

## Fee Section Errors

If you're seeing `TypeError: _u.map is not a function` in the Fees section:

1. Check your browser console for errors related to data formatting.

2. Reset your fee data by running this in the console:
   ```javascript
   localStorage.setItem('fees', '[]')
   ```

3. If needed, reset all data:
   ```javascript
   localStorage.clear()
   ```

## Manually Checking User Role

To manually verify if your user has the correct role:

```javascript
// Run this in the browser console
const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
console.log('All accounts:', accounts);

// Find your account by email
const myEmail = 'your-email@example.com';  // Replace with your email
const myAccount = accounts.find(a => a.email === myEmail);
console.log('My account:', myAccount);

// Update your role if needed
if (myAccount) {
  myAccount.role = 'admin';  // Set to 'admin', 'schoolAdmin', or 'gradeManager'
  localStorage.setItem('accounts', JSON.stringify(accounts));
  console.log('Role updated to admin');
}
```

## Reload the Application

After making any manual changes to localStorage, refresh the page to apply changes. 