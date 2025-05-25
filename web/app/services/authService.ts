'use client';
import { API_URL } from "./api";

// Authentication service
interface LoginResponse {
  success: boolean;  // Whether the login was successful
  message: string;   // Login message
  token: string;   // Access token (renamed from accessToken to match login page)
  user: any;      // User information
  refreshToken: string;   // Refresh token
}

interface RegisterResponse {
  success: boolean;  // Whether the registration was successful
  message: string;   // Registration message
}

interface RefreshTokenResponse {
  success: boolean;  // Whether the token refresh was successful
  message: string;   // Token refresh message
  newAccessToken: string;   // New access token
  newRefreshToken: string;   // New refresh token
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Login request failed');
    }

    const responseData = await response.json();
    
    return {
      success: true,
      message: 'Login successful',
      token: responseData.accessToken,
      user: responseData.user,
      refreshToken: responseData.refreshToken
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Login failed',
      token: '',
      user: null,
      refreshToken: ''
    };
  }
};

// Registration
export const register = async (username: string, email: string, password: string): Promise<RegisterResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/Auth/Register?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Registration request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Registration failed'
    };
  }
};

// GitHub login
export const githubLogin = async (code: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/Auth/GitHubLogin?code=${encodeURIComponent(code)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('GitHub login request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('GitHub login error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'GitHub login failed',
      token: '',
      user: null,
      refreshToken: ''
    };
  }
};

// Google login
export const googleLogin = async (idToken: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/Auth/GoogleLogin?idToken=${encodeURIComponent(idToken)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Google login request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Google login error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Google login failed',
      token: '',
      user: null,
      refreshToken: ''
    };
  }
};

// Refresh token
export const refreshToken = async (refreshToken: string): Promise<RefreshTokenResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/Auth/RefreshToken?refreshToken=${encodeURIComponent(refreshToken)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Token refresh request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Token refresh failed',
      newAccessToken: '',
      newRefreshToken: ''
    };
  }
}; 