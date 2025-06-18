"use client"

import { useEffect } from 'react'
import { pb } from '@/lib/pocketbase-config'

export default function AuthInitializer() {
  useEffect(() => {
    // Directly load auth from localStorage
    try {
      const token = localStorage.getItem('pb_auth_token');
      const modelStr = localStorage.getItem('pb_auth_model');
      
      if (token && modelStr) {
        const model = JSON.parse(modelStr);
        pb.authStore.save(token, model);
        console.log('Auth loaded from localStorage in auth-initializer');
      }
    } catch (err) {
      console.error('Error loading auth from localStorage in auth-initializer:', err);
    }
  }, []);
  
  return null;
} 