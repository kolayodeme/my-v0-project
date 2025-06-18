import { authService } from './auth-service';
import { adminService } from './admin-service';
import { useCreditStore } from './credit-system';
import { pb } from './pocketbase-config';

// Define product types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'CREDITS' | 'PRO';
  value: number; // Credits amount or Pro duration in days
}

// Available products
export const PRODUCTS: Product[] = [
  {
    id: 'credits_10',
    name: '10 Kredi',
    description: '10 kredi satın alın',
    price: 9.99,
    type: 'CREDITS',
    value: 10
  },
  {
    id: 'credits_50',
    name: '50 Kredi',
    description: '50 kredi satın alın',
    price: 39.99,
    type: 'CREDITS',
    value: 50
  },
  {
    id: 'credits_100',
    name: '100 Kredi',
    description: '100 kredi satın alın',
    price: 69.99,
    type: 'CREDITS',
    value: 100
  },
  {
    id: 'pro_1month',
    name: '1 Aylık Pro Üyelik',
    description: '1 aylık pro üyelik satın alın',
    price: 19.99,
    type: 'PRO',
    value: 30 // 30 days
  },
  {
    id: 'pro_3month',
    name: '3 Aylık Pro Üyelik',
    description: '3 aylık pro üyelik satın alın',
    price: 49.99,
    type: 'PRO',
    value: 90 // 90 days
  },
  {
    id: 'pro_12month',
    name: '12 Aylık Pro Üyelik',
    description: '12 aylık pro üyelik satın alın',
    price: 149.99,
    type: 'PRO',
    value: 365 // 365 days
  }
];

// Interface for Capacitor window with InAppPurchase
interface CapacitorWindow extends Window {
  Capacitor?: {
    getPlatform: () => string;
    [key: string]: any;
  };
  inAppPurchase?: {
    getProducts: (productIds: string[]) => Promise<any>;
    buy: (productId: string) => Promise<any>;
    consume: (productType: string, receipt: string, signature: string) => Promise<any>;
    restorePurchases: () => Promise<any>;
  };
}

// Purchase service for handling in-app purchases
class PurchaseService {
  private isAvailable = false;
  
  constructor() {
    if (typeof window !== 'undefined') {
      const capacitorWindow = window as CapacitorWindow;
      this.isAvailable = !!capacitorWindow.inAppPurchase;
    }
  }
  
  // Check if in-app purchases are available
  isPurchaseAvailable(): boolean {
    return this.isAvailable;
  }
  
  // Get available products
  async getAvailableProducts(): Promise<Product[]> {
    if (!this.isAvailable) {
      return PRODUCTS;
    }
    
    try {
      const capacitorWindow = window as CapacitorWindow;
      const productIds = PRODUCTS.map(product => product.id);
      const result = await capacitorWindow.inAppPurchase?.getProducts(productIds);
      
      // Merge the product information from Google Play with our product definitions
      return PRODUCTS.map(product => {
        const storeProduct = result?.products?.find((p: any) => p.productId === product.id);
        if (storeProduct) {
          return {
            ...product,
            price: storeProduct.price ? parseFloat(storeProduct.price) : product.price,
            name: storeProduct.title || product.name,
            description: storeProduct.description || product.description
          };
        }
        return product;
      });
    } catch (error) {
      console.error('Error getting products:', error);
      return PRODUCTS;
    }
  }
  
  // Purchase a product
  async purchaseProduct(productId: string): Promise<boolean> {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      throw new Error('User must be logged in to make purchases');
    }
    
    // Find the product
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    // If in-app purchases are not available, simulate a purchase for development
    if (!this.isAvailable) {
      console.log('In-app purchase not available, simulating purchase');
      return this.processPurchase(product);
    }
    
    try {
      const capacitorWindow = window as CapacitorWindow;
      const result = await capacitorWindow.inAppPurchase?.buy(productId);
      
      // Process the purchase based on the product type
      if (result?.transactionId) {
        await this.processPurchase(product);
        
        // Consume the purchase if it's a consumable product (credits)
        if (product.type === 'CREDITS' && result.receipt && result.signature) {
          await capacitorWindow.inAppPurchase?.consume(
            'android', // or 'ios' depending on platform
            result.receipt,
            result.signature
          );
        }
        
        return true;
      } else {
        throw new Error('Purchase failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      throw error;
    }
  }
  
  // Process a successful purchase
  private async processPurchase(product: Product): Promise<boolean> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User not found');
      }
      
      if (product.type === 'CREDITS') {
        // Add credits to the user's account
        await this.processCreditsProduct(user.id, product);
      } else if (product.type === 'PRO') {
        // Enable pro membership for the user
        await this.processProProduct(user.id, product);
      }
      
      return true;
    } catch (error) {
      console.error('Process purchase error:', error);
      throw error;
    }
  }
  
  // Process credits purchase
  private async processCreditsProduct(userId: string, product: Product): Promise<void> {
    try {
      // Get current user's credits
      const user = await pb.collection('users').getOne(userId);
      const currentCredits = user.credits || 0;
      
      // Update user's credits in the database
      await pb.collection('users').update(userId, {
        credits: currentCredits + product.value
      });
      
      // Update local credit store
      const creditStore = useCreditStore.getState();
      creditStore.setCredits(currentCredits + product.value);
      
      // Record the transaction
      await adminService.recordTransaction(
        userId,
        'CREDIT_PURCHASE',
        product.value,
        `Purchased ${product.value} credits`
      );
    } catch (error) {
      console.error('Process credits product error:', error);
      throw error;
    }
  }
  
  // Process pro membership purchase
  private async processProProduct(userId: string, product: Product): Promise<void> {
    try {
      // Get current user's pro status
      const user = await pb.collection('users').getOne(userId);
      
      // Calculate new expiry date
      let expiryDate = new Date();
      
      // If user already has pro and it's not expired, extend from that date
      if (user.isPro && user.proExpiryDate) {
        const currentExpiry = new Date(user.proExpiryDate);
        if (currentExpiry > new Date()) {
          expiryDate = currentExpiry;
        }
      }
      
      // Add days from product
      expiryDate.setDate(expiryDate.getDate() + product.value);
      
      // Update user's pro status in the database
      await pb.collection('users').update(userId, {
        isPro: true,
        proExpiryDate: expiryDate.toISOString()
      });
      
      // Record the transaction
      await adminService.recordTransaction(
        userId,
        'PRO_PURCHASE',
        product.value,
        `Purchased ${product.value} days of Pro membership`
      );
    } catch (error) {
      console.error('Process pro product error:', error);
      throw error;
    }
  }
  
  // Restore purchases
  async restorePurchases(): Promise<boolean> {
    if (!authService.isAuthenticated()) {
      throw new Error('User must be logged in to restore purchases');
    }
    
    if (!this.isAvailable) {
      console.log('In-app purchase not available, cannot restore purchases');
      return false;
    }
    
    try {
      const capacitorWindow = window as CapacitorWindow;
      const result = await capacitorWindow.inAppPurchase?.restorePurchases();
      
      // Process each restored purchase
      if (result?.purchases && Array.isArray(result.purchases)) {
        for (const purchase of result.purchases) {
          // Only process non-consumed and valid purchases
          if (purchase.state === 0 && !purchase.isConsumed) {
            const product = PRODUCTS.find(p => p.id === purchase.productId);
            if (product) {
              await this.processPurchase(product);
              
              // Consume the purchase if it's a consumable product (credits)
              if (product.type === 'CREDITS' && purchase.receipt && purchase.signature) {
                await capacitorWindow.inAppPurchase?.consume(
                  'android', // or 'ios' depending on platform
                  purchase.receipt,
                  purchase.signature
                );
              }
            }
          }
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Restore purchases error:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const purchaseService = new PurchaseService(); 