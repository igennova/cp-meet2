import React from 'react';
import { Button } from '@/components/ui';
import { useAuth } from '../context/AuthContext';

const GoogleLogin = () => {
  const { user, logout, loading } = useAuth();

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/google';
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        Loading...
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img 
            src={user.profilePicture} 
            alt={user.displayName}
            className="w-8 h-8 rounded-full"
          />
          <span className="text-white">{user.displayName}</span>
        </div>
        <Button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          Logout
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleGoogleLogin}
      className="flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-100"
    >
      <img 
        src="https://www.google.com/favicon.ico" 
        alt="Google" 
        className="w-5 h-5"
      />
      Sign in with Google
    </Button>
  );
};

export default GoogleLogin; 