"use client"

import React from "react"
import { useTranslation } from "./language-provider"
import { pb, isAndroid } from "@/lib/pocketbase-config"
import Cookies from 'js-cookie'
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin'

// Auth storage keys
const TOKEN_KEY = 'pb_auth_token';
const MODEL_KEY = 'pb_auth_model';
const COOKIE_TOKEN_KEY = 'pb_token';
const SECURE_STORAGE_KEY = 'pb_auth_data';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { language } = useTranslation()
  
  // Lang özelliğini document.documentElement.lang'a ayarla
  React.useEffect(() => {
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.lang = language
    }
  }, [language])
  
  // Auth persistence initialization
  React.useEffect(() => {
    console.log("Auth initialization in ClientLayout");
    
    // Function to load auth from all available storage mechanisms
    const loadAuthData = async () => {
      try {
        // For Android, try secure storage first
        if (isAndroid) {
          try {
            const result = await SecureStoragePlugin.get({ key: SECURE_STORAGE_KEY });
            if (result && result.value) {
              const data = JSON.parse(result.value);
              if (data.token) {
                console.log('Auth loaded from secure storage in client layout');
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
    
    // Function to save auth to all available storage mechanisms
    const saveAuthData = async () => {
      if (!pb.authStore.isValid) return;
      
      const token = pb.authStore.token;
      const model = pb.authStore.model;
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
            expires: 30, // 30 days
            sameSite: 'strict', 
            secure: window.location.protocol === 'https:' 
          });
        }
        
        // For Android, also save to secure storage
        if (isAndroid) {
          try {
            await SecureStoragePlugin.set({
              key: SECURE_STORAGE_KEY,
              value: JSON.stringify({ token, model: modelStr })
            });
            console.log('Auth saved to secure storage in client layout');
          } catch (err) {
            console.error('Error saving to secure storage:', err);
          }
        }
        
        console.log('Auth saved to all storage mechanisms in client layout');
      } catch (err) {
        console.error('Error saving auth data:', err);
      }
    };
    
    // Load auth on mount
    const initializeAuth = async () => {
      const authData = await loadAuthData();
      if (authData) {
        pb.authStore.save(authData.token, authData.model);
        console.log('Auth loaded in client layout');
      }
    };
    
    initializeAuth();
    
    // Set up periodic saving to ensure auth data is always fresh
    const saveInterval = setInterval(() => {
      saveAuthData();
    }, 10000); // Save every 10 seconds
    
    // Set up visibility change listener to handle app coming to foreground
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const authData = await loadAuthData();
        if (authData) {
          pb.authStore.save(authData.token, authData.model);
          console.log('Auth reloaded on visibility change');
        }
      } else {
        // When app goes to background, save current state
        saveAuthData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Setup auth change listener
    const unsubscribe = pb.authStore.onChange(() => {
      saveAuthData();
    });
    
    // Force an initial save to ensure all storage mechanisms are populated
    if (pb.authStore.isValid) {
      saveAuthData();
    }
    
    return () => {
      clearInterval(saveInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubscribe?.();
    };
  }, []);
  
  return <>{children}</>
} 