// Run this in your browser console when logged into Firebase Console
// This script will create the authentication users

// Configuration
const users = [
  {
    email: 'admin@school.com',
    password: 'admin123',
    displayName: 'Admin User'
  },
  {
    email: 'teacher@school.com',
    password: 'teacher123',
    displayName: 'Teacher One'
  },
  {
    email: 'accountant@school.com',
    password: 'account123',
    displayName: 'Accountant One'
  }
];

// Initialize Firebase
const config = {
  apiKey: "AIzaSyB1Rn0z9qmGtIGrdYkE8n7bXPqq06QlT7c",
  authDomain: "macl-school.firebaseapp.com",
  projectId: "macl-school"
};

// Only initialize if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(config);
}

const auth = firebase.auth();
const promises = [];

// Create each user
users.forEach(user => {
  const promise = auth.createUserWithEmailAndPassword(user.email, user.password)
    .then((userCredential) => {
      // Update user profile
      return userCredential.user.updateProfile({
        displayName: user.displayName
      });
    })
    .then(() => {
      console.log(`✅ Created user: ${user.email}`);
    })
    .catch(error => {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`ℹ️ User already exists: ${user.email}`);
      } else {
        console.error(`❌ Error creating user ${user.email}:`, error.message);
      }
    });
  
  promises.push(promise);
});

// Wait for all operations to complete
Promise.all(promises)
  .then(() => {
    console.log('✨ User setup completed!');
    console.log('You can now log in with these credentials:');
    users.forEach(user => {
      console.log(`Email: ${user.email} | Password: ${user.password}`);
    });
  });
