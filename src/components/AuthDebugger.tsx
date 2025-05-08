import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAIL } from '../services/appwrite';

const AuthDebugger = () => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const isAdmin = user.email === ADMIN_EMAIL;
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '400px'
    }}>
      <h4 style={{ margin: '0 0 5px 0' }}>Auth Debug</h4>
      <div><strong>Admin Email:</strong> {ADMIN_EMAIL}</div>
      <div><strong>Your Email:</strong> {user.email}</div>
      <div><strong>Matches Admin:</strong> {isAdmin ? '✅ Yes' : '❌ No'}</div>
      <div><strong>Current Role:</strong> {user.role}</div>
      <div><strong>School ID:</strong> {user.schoolId || 'none'}</div>
      <button 
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
        style={{
          marginTop: '10px',
          padding: '5px 10px',
          background: '#ff5722',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Reset & Reload
      </button>
    </div>
  );
};

export default AuthDebugger; 