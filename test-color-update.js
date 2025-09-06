// Test script to verify Firebase-first brand color update functionality
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc } = require('firebase/firestore');

// Firebase configuration (same as in the app)
const firebaseConfig = {
  apiKey: "AIzaSyAIQQ-Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8",
  authDomain: "localbuzz-mpkuv.firebaseapp.com",
  projectId: "localbuzz-mpkuv",
  storageBucket: "localbuzz-mpkuv.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

async function testColorUpdate() {
  try {
    console.log('🔧 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Test user ID (replace with actual user ID)
    const userId = 'eOnae8ClpzcckeUqHGtUMTYQKEz1';
    const brandId = 'oiEGYMUu13emRYjhIXj5'; // Test Restaurant brand ID
    
    console.log('📖 Reading current brand profile...');
    const brandRef = doc(db, 'users', userId, 'brands', brandId);
    const brandDoc = await getDoc(brandRef);
    
    if (!brandDoc.exists()) {
      console.error('❌ Brand profile not found!');
      return;
    }
    
    const currentData = brandDoc.data();
    console.log('📊 Current brand colors:', {
      primaryColor: currentData.primaryColor,
      accentColor: currentData.accentColor,
      backgroundColor: currentData.backgroundColor
    });
    
    // Update colors to test values
    const newColors = {
      primaryColor: '#e11d48', // Red
      accentColor: '#f59e0b',  // Orange
      backgroundColor: '#f3f4f6' // Light gray
    };
    
    console.log('🎨 Updating brand colors to:', newColors);
    await updateDoc(brandRef, newColors);
    
    console.log('✅ Colors updated successfully!');
    
    // Verify the update
    console.log('🔍 Verifying update...');
    const updatedDoc = await getDoc(brandRef);
    const updatedData = updatedDoc.data();
    
    console.log('📊 Updated brand colors:', {
      primaryColor: updatedData.primaryColor,
      accentColor: updatedData.accentColor,
      backgroundColor: updatedData.backgroundColor
    });
    
    // Check if colors match
    const colorsMatch = 
      updatedData.primaryColor === newColors.primaryColor &&
      updatedData.accentColor === newColors.accentColor &&
      updatedData.backgroundColor === newColors.backgroundColor;
    
    if (colorsMatch) {
      console.log('🎉 SUCCESS! Brand colors updated correctly in Firebase!');
    } else {
      console.log('❌ FAILED! Colors do not match expected values.');
    }
    
  } catch (error) {
    console.error('❌ Error testing color update:', error);
  }
}

// Run the test
testColorUpdate();
