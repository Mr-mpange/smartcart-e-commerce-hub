/**
 * Reseller Pricing Utilities
 * Ensures resellers cannot sell above vendor prices + allowed markup
 */

export interface PricingValidation {
  isValid: boolean;
  maxAllowedPrice: number;
  currentMarkup: number;
  maxMarkup: number;
  message: string;
}

/**
 * Validates if a reseller price is within allowed limits
 * RULE: Reseller price MUST be >= vendor's original price (no selling below vendor price)
 */
export function validateResellerPrice(
  originalPrice: number,
  resellerPrice: number,
  maxMarkupPercentage: number = 0
): PricingValidation {
  // ENFORCEMENT: Reseller cannot sell BELOW vendor price, but can sell at any price above it
  const minAllowedPrice = originalPrice; // Minimum: vendor price
  const currentMarkup = ((resellerPrice - originalPrice) / originalPrice) * 100;
  const isValid = resellerPrice >= minAllowedPrice;

  let message = '';
  if (isValid) {
    if (resellerPrice === originalPrice) {
      message = `Selling at original vendor price (TSh ${originalPrice.toLocaleString()})`;
    } else {
      const markup = currentMarkup;
      message = `Selling with ${markup.toFixed(1)}% markup (TSh ${resellerPrice.toLocaleString()})`;
    }
  } else {
    message = `❌ INVALID: Cannot sell below vendor price! Minimum: TSh ${minAllowedPrice.toLocaleString()}`;
  }

  return {
    isValid,
    maxAllowedPrice: Infinity, // No upper limit
    currentMarkup,
    maxMarkup: Infinity, // Unlimited markup allowed
    message
  };
}

/**
 * Calculates commission based on reseller price and commission rate
 */
export function calculateCommission(
  resellerPrice: number,
  quantity: number,
  commissionRate: number
): number {
  return (resellerPrice * quantity * commissionRate) / 100;
}

/**
 * Formats price validation message for UI display
 */
export function formatPriceValidationMessage(validation: PricingValidation): {
  message: string;
  type: 'success' | 'error' | 'warning';
} {
  if (!validation.isValid) {
    return {
      message: validation.message,
      type: 'error'
    };
  }

  if (validation.currentMarkup > validation.maxMarkup * 0.8) {
    return {
      message: `${validation.message} (near limit)`,
      type: 'warning'
    };
  }

  return {
    message: validation.message,
    type: 'success'
  };
}

/**
 * Pricing rules for resellers
 * RULE: Reseller can sell at vendor price or HIGHER (no selling below vendor price)
 */
export const RESELLER_PRICING_RULES = {
  DEFAULT_MIN_PRICE_RATIO: 1.0, // 100% - cannot sell below vendor price
  ADMIN_MIN_PRICE_RATIO: 1.0, // 100% - strict enforcement, no override
  MAX_MARKUP: Infinity, // Unlimited markup allowed
  COMMISSION_RATES: {
    BRONZE: 5,   // 5% commission for new resellers
    SILVER: 10,  // 10% commission for regular resellers
    GOLD: 15,    // 15% commission for top performers
    PLATINUM: 20 // 20% commission for premium resellers
  }
} as const;

/**
 * Determines commission rate based on reseller performance
 */
export function getCommissionRate(
  totalSales: number,
  monthsActive: number
): number {
  if (totalSales >= 1000000 && monthsActive >= 12) {
    return RESELLER_PRICING_RULES.COMMISSION_RATES.PLATINUM;
  } else if (totalSales >= 500000 && monthsActive >= 6) {
    return RESELLER_PRICING_RULES.COMMISSION_RATES.GOLD;
  } else if (totalSales >= 100000 && monthsActive >= 3) {
    return RESELLER_PRICING_RULES.COMMISSION_RATES.SILVER;
  } else {
    return RESELLER_PRICING_RULES.COMMISSION_RATES.BRONZE;
  }
}

/**
 * Validates if a reseller can add a product to their catalog
 */
export function canResellerAddProduct(
  productPrice: number,
  resellerMaxMarkup: number,
  isResellerApproved: boolean
): { canAdd: boolean; reason?: string } {
  if (!isResellerApproved) {
    return {
      canAdd: false,
      reason: 'Reseller account must be approved by admin'
    };
  }

  if (productPrice <= 0) {
    return {
      canAdd: false,
      reason: 'Invalid product price'
    };
  }

  return { canAdd: true };
}