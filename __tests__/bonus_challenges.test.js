const discountService = require('../services/discount.service');
const orderService = require('../services/order.service');
const productService = require('../services/product.service');
const pool = require('../config/db');

describe('Bonus Challenge B: Dynamic Discount Engine', () => {
  test('calculateDiscount: No discount under threshold', () => {
    const items = [{ price: 50, quantity: 2, category: 'Vegetable' }];
    const res = discountService.calculateDiscount(items);
    expect(res.subtotal).toBe(100);
    expect(res.discountRate).toBe(0);
    expect(res.discountAmount).toBe(0);
    expect(res.total).toBe(100);
  });

  test('calculateDiscount: 10% subtotal discount (> 200)', () => {
    const items = [{ price: 120, quantity: 2, category: 'Vegetable' }];
    const res = discountService.calculateDiscount(items);
    expect(res.subtotal).toBe(240);
    expect(res.discountRate).toBe(0.10);
    expect(res.discountAmount).toBe(24);
    expect(res.total).toBe(216);
    expect(res.reason).toBe('10% off subtotal over 200');
  });

  test('calculateDiscount: 15% Fresh category discount (> 3 Fresh items)', () => {
    const items = [{ price: 10, quantity: 4, category: 'Fresh' }];
    const res = discountService.calculateDiscount(items);
    expect(res.subtotal).toBe(40);
    expect(res.discountRate).toBe(0.15);
    expect(res.discountAmount).toBe(6);
    expect(res.total).toBe(34);
    expect(res.reason).toBe('15% off Fresh category discount');
  });

  test('calculateDiscount: Best discount wins (15% vs 10%)', () => {
    const items = [{ price: 60, quantity: 4, category: 'Fresh' }]; // Subtotal 240, Fresh qty 4
    const res = discountService.calculateDiscount(items);
    expect(res.subtotal).toBe(240);
    expect(res.discountRate).toBe(0.15); // 15% is better than 10%
    expect(res.discountAmount).toBe(36);
    expect(res.total).toBe(204);
  });

  test('calculateDiscount: Decimal rounding', () => {
    const items = [{ price: 33.33, quantity: 1, category: 'Fresh' }];
    const res = discountService.calculateDiscount(items);
    expect(res.subtotal).toBe(33.33);
    // Add 3 more fresh items to get 15% discount
    items.push({ price: 10, quantity: 3, category: 'Fresh' });
    const res2 = discountService.calculateDiscount(items);
    // subtotal = 33.33 + 30 = 63.33
    // discount = 63.33 * 0.15 = 9.4995 -> 9.50
    // total = 63.33 - 9.50 = 53.83
    expect(res2.subtotal).toBe(63.33);
    expect(res2.discountAmount).toBe(9.5);
    expect(res2.total).toBe(53.83);
  });
});

describe('Bonus Challenge A & B: Checkout Integration', () => {
  let conn;
  
  beforeAll(async () => {
    // We can't easily mock the pool connection for real transaction tests in this environment
    // without potentially messing up other tests or requiring a real DB.
    // However, we can mock the pool.query if needed.
  });

  test('orderService.checkout should apply discounts', async () => {
    // Mock pool.getConnection
    const mockConn = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: jest.fn()
    };
    jest.spyOn(pool, 'getConnection').mockResolvedValue(mockConn);

    // Mock STEP 1: Pickup slot
    mockConn.query.mockResolvedValueOnce([[ { id: 1 } ]]);
    
    // Mock STEP 2: Products
    mockConn.query.mockResolvedValueOnce([[ { id: 101, name: 'Fresh Tomato', price: 100, size: 'M', quantity: 10, category: 'Fresh' } ]]);
    
    // Mock STEP 4: Insert order
    mockConn.query.mockResolvedValueOnce([{ insertId: 500 }]);
    
    // Mock STEP 5: Insert order items & Update stock
    mockConn.query.mockResolvedValueOnce([]); // insert order_items
    mockConn.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // update products
    
    // Mock STEP 6: Clear cart (in order.service we call clearCart which uses pool or conn)
    // Actually clearCart is imported, we might need to mock it too if it's tricky.
    // For now let's assume it works or mock it.
    const cartService = require('../services/cart.service');
    jest.spyOn(cartService, 'clearCart').mockResolvedValue();

    const result = await orderService.checkout({
      buyer_id: 1,
      pickup_slot_id: 1,
      items: [{ product_id: 101, quantity: 4 }] // 4 items -> 15% discount
    });

    expect(result.subtotal).toBe(400);
    expect(result.discount_rate).toBe(0.15);
    expect(result.total).toBe(340);
    expect(result.order_id).toBe(500);
    expect(mockConn.commit).toHaveBeenCalled();
    
    pool.getConnection.mockRestore();
  });

  test('orderService.checkout should throw OUT_OF_STOCK if quantity exceeds stock', async () => {
    const mockConn = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: jest.fn()
    };
    jest.spyOn(pool, 'getConnection').mockResolvedValue(mockConn);

    mockConn.query.mockResolvedValueOnce([[ { id: 1 } ]]); // slot
    mockConn.query.mockResolvedValueOnce([[ { id: 101, quantity: 2, price: 10 } ]]); // product (only 2 in stock)

    await expect(orderService.checkout({
      buyer_id: 1,
      pickup_slot_id: 1,
      items: [{ product_id: 101, quantity: 5 }]
    })).rejects.toThrow('Product 101 is out of stock');

    expect(mockConn.rollback).toHaveBeenCalled();
    pool.getConnection.mockRestore();
  });
});

describe('Bonus Challenge C: Recommendations', () => {
  test('productService.getRecommendations should call database with correct query', async () => {
    const spy = jest.spyOn(pool, 'query').mockResolvedValue([[]]);
    
    await productService.getRecommendations(123, 5);
    
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('JOIN order_items related_item'),
      [123, 123, 5]
    );
    
    spy.mockRestore();
  });
});
