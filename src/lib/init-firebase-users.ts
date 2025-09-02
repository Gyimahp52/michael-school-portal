import { setupDefaultUsers } from './firebase-setup';

// This script can be run to initialize default users in Firebase
// You can run this in the browser console or create a temporary component to execute it

export const initializeUsers = async () => {
  try {
    console.log('🔥 Initializing Firebase users...');
    await setupDefaultUsers();
    console.log('✨ All users have been initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing users:', error);
  }
};

// Uncomment the line below to run automatically when this file is imported
// initializeUsers();