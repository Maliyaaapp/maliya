import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAIL } from '../services/appwrite';
import { useState } from 'react';

const AuthDebugger = () => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!user) return null;
  
  const isAdmin = user.email === ADMIN_EMAIL;
  
  // Toggler button always visible
  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          padding: '5px 10px',
          background: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
          zIndex: 9999,
          fontSize: '12px'
        }}
      >
        Show Debug
      </button>
    );
  }
  
  // Full debug panel
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      left: '10px',
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '400px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <h4 style={{ margin: 0 }}>Auth Debug</h4>
        <button 
          onClick={() => setIsExpanded(false)}
          style={{
            background: 'transparent',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ✕
        </button>
      </div>
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