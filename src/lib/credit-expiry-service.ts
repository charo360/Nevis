/**
 * Credit Expiry Service - Prevent Credit Hoarding
 */

export interface CreditPurchase {
  id: string;
  userId: string;
  credits: number;
  purchaseDate: Date;
  expiryDate: Date;
  used: number;
  remaining: number;
}

export class CreditExpiryService {
  /**
   * Add expiry to new credit purchases (90 days)
   */
  static createCreditPurchase(userId: string, credits: number): CreditPurchase {
    const now = new Date();
    const expiry = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days
    
    return {
      id: `credit_${Date.now()}`,
      userId,
      credits,
      purchaseDate: now,
      expiryDate: expiry,
      used: 0,
      remaining: credits
    };
  }

  /**
   * Get user's valid (non-expired) credits
   */
  static getValidCredits(purchases: CreditPurchase[]): number {
    const now = new Date();
    return purchases
      .filter(p => p.expiryDate > now)
      .reduce((total, p) => total + p.remaining, 0);
  }

  /**
   * Use credits (oldest first - FIFO)
   */
  static useCredits(purchases: CreditPurchase[], amount: number): CreditPurchase[] {
    const now = new Date();
    let remaining = amount;
    
    // Sort by purchase date (oldest first)
    const sorted = purchases
      .filter(p => p.expiryDate > now && p.remaining > 0)
      .sort((a, b) => a.purchaseDate.getTime() - b.purchaseDate.getTime());
    
    for (const purchase of sorted) {
      if (remaining <= 0) break;
      
      const toUse = Math.min(remaining, purchase.remaining);
      purchase.used += toUse;
      purchase.remaining -= toUse;
      remaining -= toUse;
    }
    
    return purchases;
  }

  /**
   * Get credits expiring soon (within 7 days)
   */
  static getExpiringCredits(purchases: CreditPurchase[]): CreditPurchase[] {
    const now = new Date();
    const sevenDays = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    return purchases.filter(p => 
      p.remaining > 0 && 
      p.expiryDate > now && 
      p.expiryDate <= sevenDays
    );
  }
}