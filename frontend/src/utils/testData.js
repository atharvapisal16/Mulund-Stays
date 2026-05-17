// TEST DATA - For Development Only
// Use these fake details for testing KYC and features

export const TEST_DATA = {
  // ── Test Aadhaar Numbers (12 digits) ────────────────
  aadhaar: [
    '123456789012',
    '234567890123',
    '345678901234',
    '456789012345',
  ],

  // ── Test PAN Numbers (10 characters) ────────────────
  pan: [
    'ABCDE1234F',
    'PQRST5678G',
    'XYZAB9012H',
    'KLMNO3456I',
  ],

  // ── Test Images (Free placeholder URLs) ──────────────
  placeholderImages: {
    // Unsplash - ID card style images
    idCardFront: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&h=300&fit=crop',
    idCardBack: 'https://images.unsplash.com/photo-1450151518806-7dfa48dd0fc1?w=500&h=300&fit=crop',
    document: 'https://images.unsplash.com/photo-1554224311-beab60c1b47b?w=500&h=300&fit=crop',
    
    // You can also use placeholder service
    randomId: () => `https://via.placeholder.com/500x300/cccccc/666666?text=ID+Document`,
  },

  // ── Test Users ──────────────────────────────────────
  testUsers: {
    guest: {
      fullName: 'Test Guest',
      email: 'guest@test.com',
      phone: '9876543210',
      password: 'Test@1234',
    },
    host: {
      fullName: 'Test Host',
      email: 'host@test.com',
      phone: '9876543211',
      password: 'Test@1234',
      aadhaar: '123456789012',
      pan: 'ABCDE1234F',
    },
  },
};

// ── Helper: Get Random Test Data ────────────────────
export const getRandomTestKYC = () => ({
  aadhaar: TEST_DATA.aadhaar[Math.floor(Math.random() * TEST_DATA.aadhaar.length)],
  pan: TEST_DATA.pan[Math.floor(Math.random() * TEST_DATA.pan.length)],
});

// ── Helper: Copy to Clipboard ──────────────────────
export const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  console.log(`✅ Copied: ${text}`);
};
