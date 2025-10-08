/**
 * Test Creative Studio Client-Side Issues
 */

console.log('🔍 Testing Creative Studio Client-Side...\n');

// Test 1: Check if the page loads without errors
console.log('1. Testing Creative Studio page access...');
fetch('http://localhost:3001/creative-studio')
  .then(response => {
    if (response.ok) {
      console.log('✅ Creative Studio page accessible');
      return response.text();
    } else {
      console.log('❌ Creative Studio page error:', response.status, response.statusText);
      return response.text();
    }
  })
  .then(html => {
    if (html.includes('Creative Studio')) {
      console.log('✅ Creative Studio page content loaded');
    } else {
      console.log('❌ Creative Studio page content missing');
    }
  })
  .catch(error => {
    console.log('❌ Creative Studio page request failed:', error.message);
  });

// Test 2: Check for any missing resources
console.log('\n2. Testing for missing resources...');
const resources = [
  '/api/test-creative-studio',
  '/api/test-proxy-env',
  '/api/artifacts'
];

resources.forEach(resource => {
  fetch(`http://localhost:3001${resource}`)
    .then(response => {
      if (response.ok) {
        console.log(`✅ ${resource} - OK`);
      } else {
        console.log(`❌ ${resource} - ${response.status}`);
      }
    })
    .catch(error => {
      console.log(`❌ ${resource} - Error: ${error.message}`);
    });
});

console.log('\n🎯 Next steps:');
console.log('- Check browser console for specific error messages');
console.log('- Look at Network tab for failed requests');
console.log('- Check if there are any missing JavaScript files or components');
