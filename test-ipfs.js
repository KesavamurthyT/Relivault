// Test script for IPFS integration
// Run this with: node test-ipfs.js

// This is a simple test to verify IPFS functions work
// In a real Next.js app, these would be called from the frontend

console.log('Testing IPFS Integration...\n');

// Simulate environment variables (in real app, these come from .env.local)
process.env.NEXT_PUBLIC_PINATA_API_KEY = 'test_key';
process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY = 'test_secret';

// Test data
const testAadharData = {
  aadharNumber: '123456789012',
  userId: 'test-user-123',
  disasterType: 'flood',
  location: 'Test Location'
};

console.log('Test Data:', testAadharData);
console.log('\nTo test with real data:');
console.log('1. Set up your .env.local file with Pinata API keys');
console.log('2. Restart your Next.js development server');
console.log('3. Submit a claim through the form');
console.log('4. Check your Pinata dashboard for uploaded data');
console.log('\nThe form will now upload real data to IPFS instead of mock CIDs!');
