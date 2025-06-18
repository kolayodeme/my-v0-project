import PocketBase from 'pocketbase';
import Cookies from 'js-cookie';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

// PocketBase URL - Railway URL'nizi buraya ekleyin
const POCKETBASE_URL = 'https://pocketbase-docker-production-b1c6.up.railway.app';

// Helper function to check if we're on the client side
export const isClient = typeof window !== 'undefined';

// Helper function to check if we're on Android
export const isAndroid = isClient && navigator.userAgent.toLowerCase().indexOf('android') > -1;

// Create PocketBase instance with custom auth store persistence
export const pb = new PocketBase(POCKETBASE_URL);

// Auth storage keys
const TOKEN_KEY = 'pb_auth_token';
const MODEL_KEY = 'pb_auth_model';
const COOKIE_TOKEN_KEY = 'pb_token';
const COOKIE_EXPIRY = 30; // days
const SECURE_STORAGE_KEY = 'pb_auth_data';

// Save auth data to all available storage mechanisms
const saveAuthData = async (token: string, model: any): Promise<void> => {
  if (!isClient) return;
  
  const modelStr = model ? JSON.stringify(model) : '';
  
  try {
    // Save to localStorage
    localStorage.setItem(TOKEN_KEY, token || '');
    localStorage.setItem(MODEL_KEY, modelStr);
    
    // Save to sessionStorage as backup
    sessionStorage.setItem(TOKEN_KEY, token || '');
    sessionStorage.setItem(MODEL_KEY, modelStr);
    
    // Save token to cookie for maximum compatibility
    if (token) {
      Cookies.set(COOKIE_TOKEN_KEY, token, { 
        expires: COOKIE_EXPIRY, 
        sameSite: 'strict', 
        secure: window.location.protocol === 'https:' 
      });
    } else {
      Cookies.remove(COOKIE_TOKEN_KEY);
    }
    
    // For Android, also save to secure storage
    if (isAndroid) {
      try {
        await SecureStoragePlugin.set({
          key: SECURE_STORAGE_KEY,
          value: JSON.stringify({ token, model: modelStr })
        });
        console.log('Auth saved to secure storage');
      } catch (err) {
        console.error('Error saving to secure storage:', err);
      }
    }
    
    console.log('Auth saved to all storage mechanisms');
  } catch (err) {
    console.error('Error saving auth data:', err);
  }
};

// Load auth data from any available storage mechanism
const loadAuthData = async (): Promise<{ token: string; model: any } | null> => {
  if (!isClient) return null;
  
  try {
    // For Android, try secure storage first
    if (isAndroid) {
      try {
        const result = await SecureStoragePlugin.get({ key: SECURE_STORAGE_KEY });
        if (result && result.value) {
          const data = JSON.parse(result.value);
          if (data.token) {
            console.log('Auth loaded from secure storage');
            if (data.model) {
              try {
                const model = JSON.parse(data.model);
                return { token: data.token, model };
              } catch (e) {
                // If model parsing fails, return minimal model
                return { token: data.token, model: { id: 'unknown', token: data.token } };
              }
            }
            return { token: data.token, model: { id: 'unknown', token: data.token } };
          }
        }
      } catch (err) {
        console.log('No data in secure storage or error:', err);
      }
    }
    
    // Try localStorage next
    let token = localStorage.getItem(TOKEN_KEY);
    let modelStr = localStorage.getItem(MODEL_KEY);
    
    // If not in localStorage, try sessionStorage
    if (!token || !modelStr) {
      token = sessionStorage.getItem(TOKEN_KEY);
      modelStr = sessionStorage.getItem(MODEL_KEY);
    }
    
    // If still not found, try cookie
    if (!token) {
      const cookieToken = Cookies.get(COOKIE_TOKEN_KEY);
      token = cookieToken || null;
    }
    
    if (token && modelStr) {
      const model = JSON.parse(modelStr);
      return { token, model };
    } else if (token) {
      // We have a token but no model, create a minimal model
      return { token, model: { id: 'unknown', token } };
    }
  } catch (err) {
    console.error('Error loading auth data:', err);
  }
  
  return null;
};

// Clear auth data from all storage mechanisms
const clearAuthData = async (): Promise<void> => {
  if (!isClient) return;
  
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(MODEL_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(MODEL_KEY);
    Cookies.remove(COOKIE_TOKEN_KEY);
    
    // For Android, also clear secure storage
    if (isAndroid) {
      try {
        await SecureStoragePlugin.remove({ key: SECURE_STORAGE_KEY });
        console.log('Auth cleared from secure storage');
      } catch (err) {
        console.error('Error clearing secure storage:', err);
      }
    }
    
    console.log('Auth cleared from all storage mechanisms');
  } catch (err) {
    console.error('Error clearing auth data:', err);
  }
};

// Disable auto cancellation for better performance on mobile
if (isClient) {
  pb.autoCancellation(false);
  
  // Force PocketBase to use our custom storage
  const originalIsValid = pb.authStore.isValid;
  const originalClear = pb.authStore.clear;
  const originalSave = pb.authStore.save;
  
  // Override the save method
  pb.authStore.save = function(token, model) {
    originalSave.call(pb.authStore, token, model);
    saveAuthData(token, model);
  };
  
  // Override the clear method
  pb.authStore.clear = function() {
    originalClear.call(pb.authStore);
    clearAuthData();
  };
  
  // Load auth data on initialization
  (async () => {
    const authData = await loadAuthData();
    if (authData) {
      originalSave.call(pb.authStore, authData.token, authData.model);
      console.log('Auth loaded on initialization');
    }
  })();
  
  // Add a visibility change listener to reload auth when app comes to foreground
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      const authData = await loadAuthData();
      if (authData) {
        originalSave.call(pb.authStore, authData.token, authData.model);
        console.log('Auth reloaded on visibility change');
      }
    }
  });
  
  // Add focus event listener to refresh auth
  window.addEventListener('focus', async () => {
    const authData = await loadAuthData();
    if (authData) {
      pb.authStore.save(authData.token, authData.model);
      console.log('Auth refreshed on window focus');
    }
  });
  
  // Increase refresh frequency for better sync
  setInterval(() => {
    if (pb.authStore.isValid) {
      saveAuthData(pb.authStore.token, pb.authStore.model);
      console.log('Auth refreshed periodically');
    }
  }, 10000); // Every 10 seconds instead of 30
}

// Get the current authenticated user (if any)
export const getCurrentUser = async () => {
  if (!isClient) return null;
  
  // If not authenticated, try to load from storage
  if (!pb.authStore.isValid) {
    const authData = await loadAuthData();
    if (authData) {
      pb.authStore.save(authData.token, authData.model);
    }
  }
  
  return pb.authStore.model;
};

// Check if the current user is authenticated
export const isAuthenticated = async () => {
  if (!isClient) return false;
  
  // If not authenticated, try to load from storage
  if (!pb.authStore.isValid) {
    const authData = await loadAuthData();
    if (authData) {
      pb.authStore.save(authData.token, authData.model);
    }
  }
  
  return pb.authStore.isValid;
};

// Check if the current user is an admin
export const isAdmin = async () => {
  if (!isClient) return false;
  const user = await getCurrentUser();
  return user?.isAdmin === true;
};

// Logout the current user
export const logout = () => {
  pb.authStore.clear();
}; 