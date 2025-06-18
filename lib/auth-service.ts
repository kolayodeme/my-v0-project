import { pb, isClient } from './pocketbase-config';
import { useCreditStore } from './credit-system';

// User type definition
export interface User {
  id: string;
  username: string;
  email: string;
  created: string;
  updated: string;
  verified: boolean;
  credits: number;
  isPro: boolean;
  proExpiryDate: string | null;
  isAdmin: boolean;
  isActive: boolean;
  referralCode: string;
  referredBy: string | null;
  referralCount: number;
}

// Input validation
const validateInput = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 100;
  },
  username: (username: string): boolean => {
    return username.length >= 3 && username.length <= 30 && /^[a-zA-Z0-9_-]+$/.test(username);
  },
  password: (password: string): boolean => {
    return password.length >= 8;  // Sadece 8 karakter minimum uzunluk kontrolü
  }
};

// Auth service for handling user authentication
class AuthService {
  private lastSync: number = 0;
  private isLoading: boolean = false;
  private loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();

  // Register a new user
  async register(email: string, password: string, username: string, referralCode?: string): Promise<User> {
    try {
      // Input validation
      if (!validateInput.email(email)) {
        throw new Error('Geçersiz email formatı');
      }
      if (!validateInput.username(username)) {
        throw new Error('Kullanıcı adı 3-30 karakter arasında olmalı ve sadece harf, rakam, - ve _ içerebilir');
      }
      if (!validateInput.password(password)) {
        throw new Error('Şifre en az 8 karakter olmalı');
      }

      this.isLoading = true;
      
      // Sanitize inputs
      email = email.trim().toLowerCase();
      username = username.trim();
      
      // Check if email is already in use
      try {
        await pb.collection('users').getFirstListItem(`email="${email}"`);
        throw new Error('Bu e-posta adresi zaten kullanılıyor');
      } catch (emailError: any) {
        if (emailError.status !== 404) {
          throw emailError;
        }
      }
      
      // Check if username is already in use
      try {
        await pb.collection('users').getFirstListItem(`username="${username}"`);
        throw new Error('Bu kullanıcı adı zaten kullanılıyor');
      } catch (usernameError: any) {
        if (usernameError.status !== 404) {
          throw usernameError;
        }
      }
      
      // Generate a unique referral code for the new user
      const uniqueReferralCode = username.substring(0, 3) + Math.random().toString(36).substring(2, 7);
      
      let referredByUser = null;
      
      // Check if referral code is valid
      if (referralCode) {
        try {
          // Find the user who owns this referral code
          referredByUser = await pb.collection('users').getFirstListItem(`referralCode="${referralCode}"`);
        } catch (referralError: any) {
          if (referralError.status !== 404) {
            console.error('Referral lookup error:', referralError);
          }
          // If referral code is invalid, continue without it
          referralCode = undefined;
        }
      }
      
      // Create user with transaction
      const result = await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        username,
        name: username,
        credits: 5, // Default credits
        isPro: false,
        isAdmin: false,
        isActive: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        referralCode: uniqueReferralCode,
        referredBy: referralCode || null,
        referralCount: 0
      });

      // If user was referred by someone, update the referrer's stats and add credits
      if (referredByUser) {
        try {
          // Update referrer's referral count
          await pb.collection('users').update(referredByUser.id, {
            referralCount: (referredByUser.referralCount || 0) + 1,
            credits: (referredByUser.credits || 0) + 5 // Add 5 credits to the referrer
          });
          
          // Create a notification record for the referrer
          await pb.collection('notifications').create({
            user: referredByUser.id,
            title: 'Davet Kredisi',
            message: `${username} davetinizi kullanarak kayıt oldu! 5 kredi hesabınıza eklendi.`,
            type: 'referral_credit',
            isRead: false,
            createdAt: new Date().toISOString()
          });
          
          // Create a transaction record for the referral bonus
          await pb.collection('transactions').create({
            userId: referredByUser.id,
            type: 'REFERRAL_CREDIT',
            amount: 5,
            description: `${username} davetinizi kullanarak kayıt oldu`,
            created: new Date().toISOString()
          });
          
          console.log(`Added 5 credits to ${referredByUser.username} for referring ${username}`);
        } catch (referralUpdateError) {
          console.error('Failed to update referrer stats:', referralUpdateError);
          // Continue with registration even if updating referrer fails
        }
      }

      // Wait for login to complete before proceeding
      await this.login(email, password);
      
      // Force sync all data
      await Promise.all([
        this.syncCredits(),
        this.getCurrentUser(true),
        useCreditStore.getState().forceSync()
      ]);
      
      this.lastSync = Date.now();
      this.isLoading = false;
      
      // Save auth data to all storages
      await this.saveAuthData(pb.authStore.token, pb.authStore.model);
      
      return result as unknown as User;
    } catch (error: any) {
      this.isLoading = false;
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  // Login a user
  async login(email: string, password: string): Promise<User> {
    try {
      // Check rate limiting
      const ipKey = email.toLowerCase();
      const attempts = this.loginAttempts.get(ipKey) || { count: 0, lastAttempt: 0 };
      const now = Date.now();
      
      if (attempts.count >= 5 && now - attempts.lastAttempt < 300000) { // 5 minutes
        throw new Error('Çok fazla başarısız giriş denemesi. Lütfen 5 dakika bekleyin.');
      }

      this.isLoading = true;
      const result = await pb.collection('users').authWithPassword(email, password);
      
      // Reset attempts on successful login
      this.loginAttempts.set(ipKey, { count: 0, lastAttempt: now });
      
      if (isClient && result?.record) {
        const user = result.record as unknown as User;
        
        // Update credit store
        useCreditStore.getState().setCredits(user.credits || 5);
        
        // Save auth data to all storages
        await this.saveAuthData(pb.authStore.token, pb.authStore.model);
        
        // Start auth refresh timer
        this.startAuthRefreshTimer();
        
        // Force sync all data
        await Promise.all([
          this.syncCredits(),
          this.getCurrentUser(true),
          useCreditStore.getState().forceSync()
        ]);
      }

      this.lastSync = Date.now();
      this.isLoading = false;
      
      return result.record as unknown as User;
    } catch (error: any) {
      // Increment failed attempts
      const ipKey = email.toLowerCase();
      const attempts = this.loginAttempts.get(ipKey) || { count: 0, lastAttempt: 0 };
      this.loginAttempts.set(ipKey, {
        count: attempts.count + 1,
        lastAttempt: Date.now()
      });

      this.isLoading = false;
      
      if (error.status === 400) {
        throw new Error('Hatalı email veya şifre');
      } else if (!navigator.onLine) {
        throw new Error('İnternet bağlantınızı kontrol edin');
      } else {
        console.error('Login error:', error);
        throw new Error('Giriş yapılırken bir hata oluştu');
      }
    }
  }
  
  // Logout the current user
  async logout(): Promise<void> {
    try {
      this.isLoading = true;
      pb.authStore.clear();
      await this.clearAuthData();
      useCreditStore.getState().setCredits(0);
      this.stopAuthRefreshTimer();
      this.lastSync = 0;
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Save auth data to storage with better error handling
  private async saveAuthData(token: string, model: any): Promise<void> {
    if (!isClient) return;

    try {
      const authData = { token, model: JSON.stringify(model) };
      const authDataString = JSON.stringify(authData);
      
      // Try all storage methods
      const storagePromises = [
        // LocalStorage
        new Promise<void>((resolve) => {
          try {
            localStorage.setItem('pb_auth', authDataString);
          } catch (e) {
            console.error('LocalStorage error:', e);
          }
          resolve();
        }),
        
        // SessionStorage
        new Promise<void>((resolve) => {
          try {
            sessionStorage.setItem('pb_auth', authDataString);
          } catch (e) {
            console.error('SessionStorage error:', e);
          }
          resolve();
        }),
        
        // Cookie (7 days)
        new Promise<void>((resolve) => {
          try {
            document.cookie = `pb_auth=${encodeURIComponent(authDataString)}; path=/; max-age=604800; secure; samesite=strict`;
          } catch (e) {
            console.error('Cookie error:', e);
          }
          resolve();
        })
      ];
      
      await Promise.all(storagePromises);
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  }

  // Clear auth data from storage
  private async clearAuthData(): Promise<void> {
    if (!isClient) return;

    try {
      localStorage.removeItem('pb_auth');
      sessionStorage.removeItem('pb_auth');
      document.cookie = 'pb_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  // Get current user with force refresh option
  async getCurrentUser(forceRefresh: boolean = false): Promise<User | null> {
    if (!isClient) return null;
    
    try {
      // If not authenticated or force refresh requested, try to restore from storage
      if (!pb.authStore.isValid || forceRefresh) {
        await this.restoreAuthFromStorage();
      }
      
      // If still not authenticated, return null
      if (!pb.authStore.isValid) {
        return null;
      }

      // If we haven't synced recently (last 30 seconds) or force refresh requested
      if (forceRefresh || Date.now() - this.lastSync > 30000) {
        // Refresh user data from server
        const userId = pb.authStore.model?.id;
        if (userId) {
          const user = await pb.collection('users').getOne(userId);
          this.lastSync = Date.now();
          const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            created: user.created,
            updated: user.updated,
            verified: user.verified,
            credits: user.credits || 0,
            isPro: user.isPro || false,
            proExpiryDate: user.proExpiryDate || null,
            isAdmin: user.isAdmin || false,
            isActive: user.isActive || false,
            referralCode: user.referralCode || '',
            referredBy: user.referredBy || null,
            referralCount: user.referralCount || 0
          } as User;
          return userData;
        }
      }

      const model = pb.authStore.model;
      if (!model) return null;

      return {
        id: model.id,
        username: model.username,
        email: model.email,
        created: model.created,
        updated: model.updated,
        verified: model.verified,
        credits: model.credits || 0,
        isPro: model.isPro || false,
        proExpiryDate: model.proExpiryDate || null,
        isAdmin: model.isAdmin || false,
        isActive: model.isActive || false,
        referralCode: model.referralCode || '',
        referredBy: model.referredBy || null,
        referralCount: model.referralCount || 0
      } as User;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Restore auth from storage
  private async restoreAuthFromStorage(): Promise<boolean> {
    if (!isClient) return false;

    try {
      // Try localStorage first
      let authData = localStorage.getItem('pb_auth');
      
      // If not in localStorage, try sessionStorage
      if (!authData) {
        authData = sessionStorage.getItem('pb_auth');
      }
      
      // If not in sessionStorage, try cookie
      if (!authData) {
        const cookie = document.cookie.split('; ').find(row => row.startsWith('pb_auth='));
        if (cookie) {
          authData = decodeURIComponent(cookie.split('=')[1]);
        }
      }

      if (authData) {
        const { token, model } = JSON.parse(authData);
        if (token && model) {
          pb.authStore.save(token, JSON.parse(model));
          return true;
        }
      }
    } catch (error) {
      console.error('Error restoring auth:', error);
    }
    
    return false;
  }

  // Auth refresh timer
  private refreshTimer: number | null = null;

  private startAuthRefreshTimer() {
    if (this.refreshTimer) {
      this.stopAuthRefreshTimer();
    }

    // Her 5 dakikada bir oturumu yenile
    this.refreshTimer = window.setInterval(() => {
      if (pb.authStore.isValid) {
        this.getCurrentUser(true);
      }
    }, 300000); // 5 dakika
  }

  private stopAuthRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return pb.authStore.isValid;
  }

  // Check if user is admin
  isAdmin(): boolean {
    const user = pb.authStore.model as User | null;
    return user?.isAdmin === true;
  }

  // Get auth token
  getAuthToken(): string | null {
    return pb.authStore.token;
  }

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<User> {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated');
    }
    
    const userId = pb.authStore.model?.id;
    if (!userId) {
      throw new Error('User ID not found');
    }
    
    try {
      const result = await pb.collection('users').update(userId, data);
      return result as unknown as User;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
  
  // Send password reset email
  async sendPasswordResetEmail(email: string): Promise<boolean> {
    try {
      await pb.collection('users').requestPasswordReset(email);
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }
  
  // Sync credits with server
  async syncCredits(): Promise<number> {
    if (!this.isAuthenticated()) {
      return 0;
    }
    
    try {
      const userId = pb.authStore.model?.id;
      if (!userId) {
        return 0;
      }
      
      // Get user data directly from server
      const user = await pb.collection('users').getOne(userId, {
        $cancelKey: 'syncCredits'
      });
      
      // Update local credit store
      const creditStore = useCreditStore.getState();
      const credits = user.credits || 0;
      creditStore.setCredits(credits);
      
      return credits;
    } catch (error: any) {
      console.error('Sync credits error:', error);
      if (error.name === 'ClientResponseError' && error.status === 0) {
        // If request was cancelled, return current credits from auth store
        return pb.authStore.model?.credits || 0;
      }
      return 0;
    }
  }
  
  // Add credits to a user and send notification
  async addCreditsToUser(userId: string, amount: number): Promise<User> {
    try {
      // First get the current user
      const user = await pb.collection('users').getOne(userId);
      
      // Calculate new credit amount
      const currentCredits = user.credits || 0;
      const newCredits = currentCredits + amount;
      
      // Update the user with new credits
      const updatedUser = await pb.collection('users').update(userId, {
        credits: newCredits
      });
      
      // Create a notification record
      await pb.collection('notifications').create({
        user: userId,
        title: 'Kredi Eklendi',
        message: `Hesabınıza yetkili tarafından ${amount} kredi eklendi!`,
        type: 'credit_added',
        isRead: false,
        createdAt: new Date().toISOString()
      });
      
      return updatedUser as unknown as User;
    } catch (error) {
      console.error('Add credits error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Initialize auth listeners if on client
if (isClient) {
  // Handle visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && pb.authStore.isValid) {
      authService.getCurrentUser(true);
    }
  });

  // Handle focus
  window.addEventListener('focus', () => {
    if (pb.authStore.isValid) {
      authService.getCurrentUser(true);
    }
  });

  // Handle storage events (for multi-tab sync)
  window.addEventListener('storage', (event) => {
    if (event.key === 'pb_auth') {
      if (!event.newValue) {
        // Auth data was cleared in another tab
        pb.authStore.clear();
      } else {
        // Auth data was updated in another tab
        authService.getCurrentUser(true);
      }
    }
  });
} 