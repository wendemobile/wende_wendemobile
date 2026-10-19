import fc from 'fast-check';

// Configure fast-check globally
fc.configureGlobal({
  numRuns: 100,
  verbose: false,
});

// Common arbitraries for property-based testing
export const arbitraries = {
  // String generators
  nonEmptyString: fc.string({ minLength: 1, maxLength: 100 }),
  username: fc.string({ minLength: 3, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
  email: fc.emailAddress(),
  password: fc.string({ minLength: 8, maxLength: 100 }),
  
  // Number generators
  positiveDecimal: fc.float({ min: 0.01, max: 999999.99, noNaN: true }),
  quantity: fc.float({ min: 0.001, max: 99999, noNaN: true }),
  
  // ID generators
  uuid: fc.uuid(),
  
  // Date generators
  pastDate: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  futureDate: fc.date({ min: new Date(), max: new Date('2030-12-31') }),
  
  // SKU generator
  sku: fc.stringMatching(/^[A-Z]{2,4}-[0-9]{4,8}$/),
  
  // Barcode generator
  barcode: fc.stringMatching(/^[A-Z0-9]{8,16}$/),
};

// Helper to create a valid item input
export function createItemInput(overrides = {}) {
  return {
    sku: `SKU-${Date.now()}`,
    name: 'Test Item',
    unitPrice: 100.00,
    costPrice: 50.00,
    barcode: `BC${Date.now()}`,
    ...overrides,
  };
}

// Helper to create a valid customer input
export function createCustomerInput(overrides = {}) {
  return {
    name: 'Test Customer',
    phone: '1234567890',
    email: 'test@example.com',
    creditLimit: 1000.00,
    ...overrides,
  };
}

// Helper to create a valid sale input
export function createSaleInput(overrides = {}) {
  return {
    locationId: 'test-location-id',
    cashierId: 'test-cashier-id',
    items: [],
    ...overrides,
  };
}

// Round decimal to 2 places (for currency)
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

// Round decimal to 3 places (for quantity)
export function roundQuantity(value: number): number {
  return Math.round(value * 1000) / 1000;
}
