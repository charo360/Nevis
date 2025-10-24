/**
 * Debug Brand Profile Update Issue
 * Test the brand profile update functionality to identify why updates aren't being saved
 */

console.log('🔍 Debugging Brand Profile Update Issue...\n');

async function testBrandProfileUpdate() {
  console.log('🧪 Testing Brand Profile Update Functionality...');
  console.log('');
  
  // Test 1: Check if the API endpoint exists and responds
  console.log('📡 Test 1: Testing API endpoint availability...');
  try {
    const response = await fetch('http://localhost:3001/api/brand-profiles', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      console.log('✅ GET /api/brand-profiles - SUCCESS (endpoint exists)');
      const data = await response.json();
      console.log('📊 Response:', {
        hasProfiles: Array.isArray(data) && data.length > 0,
        profileCount: Array.isArray(data) ? data.length : 'Not an array',
        firstProfileId: Array.isArray(data) && data.length > 0 ? data[0].id : 'No profiles'
      });
    } else {
      console.log('❌ GET /api/brand-profiles - FAILED:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ GET /api/brand-profiles - ERROR:', error.message);
  }
  
  console.log('');
  
  // Test 2: Try to update a specific brand profile (we'll need to get the ID first)
  console.log('📡 Test 2: Testing brand profile update...');
  console.log('⚠️  Note: This test requires authentication and a valid profile ID');
  console.log('');
  
  console.log('🔍 Common Issues to Check:');
  console.log('1. Authentication: Is the user properly authenticated?');
  console.log('2. Authorization: Does the Bearer token work?');
  console.log('3. Profile ID: Is the profile ID valid and exists?');
  console.log('4. Request Format: Is the request body properly formatted?');
  console.log('5. Database Connection: Is Supabase connection working?');
  console.log('6. API Route: Is the PUT /api/brand-profiles/[id] route working?');
  console.log('');
  
  console.log('🎯 Expected Flow for Brand Profile Update:');
  console.log('1. User fills out brand profile form');
  console.log('2. User clicks "Save Changes" or "Update Profile"');
  console.log('3. Frontend calls updateProfile() from unified brand context');
  console.log('4. Context makes PUT request to /api/brand-profiles/[id]');
  console.log('5. API route validates auth and updates database');
  console.log('6. Database update is committed to Supabase');
  console.log('7. Frontend state is updated with new data');
  console.log('8. User sees success message');
  console.log('');
  
  console.log('🚨 Potential Issues:');
  console.log('1. Frontend State Issue: Form data not being captured correctly');
  console.log('2. API Authentication Issue: Bearer token missing or invalid');
  console.log('3. Database Update Issue: Supabase update failing silently');
  console.log('4. Response Handling Issue: Success response not updating frontend state');
  console.log('5. Caching Issue: Old data being cached and not refreshed');
  console.log('');
  
  console.log('📋 Debugging Steps:');
  console.log('1. Check browser Network tab for API calls when saving');
  console.log('2. Check server logs for any error messages');
  console.log('3. Check if the PUT request is being made to the correct endpoint');
  console.log('4. Check if the request includes proper Authorization header');
  console.log('5. Check if the response is successful (200 status)');
  console.log('6. Check if the frontend state is being updated after successful save');
  console.log('');
  
  console.log('🔧 Quick Fixes to Try:');
  console.log('1. Hard refresh the page (Ctrl+F5) to clear any cached data');
  console.log('2. Check browser console for JavaScript errors');
  console.log('3. Try updating a single field at a time to isolate the issue');
  console.log('4. Check if the issue happens with all fields or specific ones');
  console.log('5. Try creating a new brand profile to see if the issue is update-specific');
  console.log('');
  
  console.log('🎯 Server Logs to Look For:');
  console.log('When updating a brand profile, you should see:');
  console.log('- "📋 Processing brand profile update:"');
  console.log('- "💾 Updating brand profile in Supabase:"');
  console.log('- "✅ Brand profile updated successfully" or similar success message');
  console.log('');
  console.log('If you see error messages like:');
  console.log('- "❌ Supabase update error:"');
  console.log('- "Error updating brand profile:"');
  console.log('- "Failed to update brand profile"');
  console.log('Then there\'s a database or API issue.');
  console.log('');
  
  console.log('🔍 Next Steps:');
  console.log('1. Try updating a brand profile in the UI');
  console.log('2. Watch this terminal for server log messages');
  console.log('3. Check browser Network tab for API calls');
  console.log('4. Report back what you see in the logs and network tab');
}

// Run the test
testBrandProfileUpdate().catch(console.error);
