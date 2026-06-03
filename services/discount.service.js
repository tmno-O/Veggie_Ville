/**
 * Helper to round monetary values to 2 decimal places
 */
const roundMoney = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

/**
 * Calculate the best eligible discount for a cart
 * 
 * Rules:
 * 1. 10% off if subtotal > 200
 * 2. 15% off if total quantity of 'Fresh' items > 3
 * 3. Best discount wins (not stacked)
 * 
 * @param {Array} items - [{ product_id, name, category, price, quantity }]
 * @returns {object} discount metadata
 */
const calculateDiscount = (items) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + (Number(item.price) * Number(item.quantity));
  }, 0);

  const freshQuantity = items.reduce((sum, item) => {
    return item.category === 'Fresh' ? sum + Number(item.quantity) : sum;
  }, 0);

  let discountRate = 0;
  let reason = 'No discount applied';

  // Rule 1: 10% off subtotal > 200
  if (subtotal > 200) {
    discountRate = 0.10;
    reason = '10% off subtotal over 200';
  }

  // Rule 2: 15% off if Fresh items > 3
  // Best discount wins
  if (freshQuantity > 3) {
    if (0.15 > discountRate) {
      discountRate = 0.15;
      reason = '15% off Fresh category discount';
    }
  }

  const discountAmount = roundMoney(subtotal * discountRate);
  const total = roundMoney(subtotal - discountAmount);

  return {
    subtotal: roundMoney(subtotal),
    discountRate,
    discountAmount,
    total,
    reason
  };
};

module.exports = {
  calculateDiscount,
  roundMoney
};
