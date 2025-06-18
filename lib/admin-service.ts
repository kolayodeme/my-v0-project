import { pb } from './pocketbase-config';
import { authService, User } from './auth-service';

// Admin service for user management
class AdminService {
  // Check if the current user is an admin
  isAdmin(): boolean {
    return authService.isAdmin();
  }
  
  // Get all users (admin only)
  async getAllUsers(page: number = 1, limit: number = 50): Promise<{ items: User[], totalItems: number }> {
    if (!this.isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }
    
    try {
      const result = await pb.collection('users').getList(page, limit, {
        sort: '-created',
      });
      
      return {
        items: result.items as unknown as User[],
        totalItems: result.totalItems
      };
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }
  
  // Get a specific user by ID (admin only)
  async getUserById(userId: string): Promise<User> {
    if (!this.isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }
    
    try {
      const result = await pb.collection('users').getOne(userId);
      return result as unknown as User;
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  }
  
  // Add credits to a user (admin only)
  async addCreditsToUser(userId: string, amount: number): Promise<User> {
    if (!this.isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }
    
    try {
      // İşlem başlamadan önce kullanıcının mevcut kredilerini al
      const user = await pb.collection('users').getOne(userId);
      const currentCredits = user.credits || 0;
      
      // Kredi güncelleme işlemi
      const result = await pb.collection('users').update(userId, {
        credits: currentCredits + amount
      });

      // İşlem kaydını oluştur
      await this.recordTransaction(userId, 'ADMIN_CREDIT', amount, 'Admin added credits');

      // Bildirim gönder
      await pb.collection('notifications').create({
        user: userId,
        type: 'CREDIT_UPDATE',
        message: `Hesabınıza ${amount} kredi eklendi.`,
        isRead: false,
        created: new Date().toISOString()
      });

      // Kullanıcının kredi store'unu güncelle
      try {
        // Kullanıcının oturumu açıksa, kredi store'unu güncelle
        const currentUser = pb.authStore.model;
        if (currentUser && currentUser.id === userId) {
          // Kredi store'unu güncelle
          const creditStore = await import('./credit-system').then(m => m.useCreditStore);
          creditStore.getState().setCredits(currentCredits + amount);
        }
      } catch (error) {
        console.error('Error updating credit store:', error);
      }

      return result as unknown as User;
    } catch (error) {
      console.error('Add credits error:', error);
      throw error;
    }
  }
  
  // Set a user's pro status (admin only)
  async setUserProStatus(userId: string, isPro: boolean, expiryDate?: Date): Promise<User> {
    if (!this.isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }
    
    try {
      const data: Record<string, any> = { isPro };
      
      // If pro status is being enabled and an expiry date is provided
      if (isPro && expiryDate) {
        data.proExpiryDate = expiryDate.toISOString();
      } else if (!isPro) {
        // If pro status is being disabled, clear the expiry date
        data.proExpiryDate = null;
      }
      
      const result = await pb.collection('users').update(userId, data);
      
      // Record the transaction
      await this.recordTransaction(
        userId, 
        isPro ? 'PRO_ENABLED' : 'PRO_DISABLED', 
        0, 
        isPro ? 'Pro membership enabled by admin' : 'Pro membership disabled by admin'
      );
      
      return result as unknown as User;
    } catch (error) {
      console.error('Set pro status error:', error);
      throw error;
    }
  }
  
  // Toggle a user's active status (admin only)
  async toggleUserActiveStatus(userId: string, isActive: boolean): Promise<User> {
    if (!this.isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }
    
    try {
      const result = await pb.collection('users').update(userId, {
        isActive
      });
      
      return result as unknown as User;
    } catch (error) {
      console.error('Toggle active status error:', error);
      throw error;
    }
  }
  
  // Record a transaction
  async recordTransaction(
    userId: string, 
    type: 'CREDIT_PURCHASE' | 'CREDIT_USE' | 'PRO_PURCHASE' | 'PRO_EXPIRED' | 'ADMIN_CREDIT' | 'PRO_ENABLED' | 'PRO_DISABLED', 
    amount: number, 
    description: string
  ): Promise<void> {
    try {
      // Get the current admin user ID if available
      const adminId = authService.getCurrentUser()?.id || null;
      
      await pb.collection('transactions').create({
        userId,
        type,
        amount,
        description,
        adminId,
        created: new Date().toISOString()
      });
    } catch (error) {
      console.error('Record transaction error:', error);
      // Don't throw here, just log the error to prevent disrupting the main operation
    }
  }
  
  // Get transaction history for a user
  async getUserTransactions(userId: string, page: number = 1, limit: number = 20): Promise<any> {
    try {
      // If admin, can view any user's transactions
      // If not admin, can only view own transactions
      if (!this.isAdmin() && authService.getCurrentUser()?.id !== userId) {
        throw new Error('Unauthorized: Can only view your own transactions');
      }
      
      const result = await pb.collection('transactions').getList(page, limit, {
        filter: `userId = "${userId}"`,
        sort: '-created',
      });
      
      return result;
    } catch (error) {
      console.error('Get user transactions error:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const adminService = new AdminService(); 