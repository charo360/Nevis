export default function SimpleTestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>
        🔧 Simple Test Page - WORKING!
      </h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#059669' }}>✅ Page Status: LOADED SUCCESSFULLY</h2>
        <p>This page loads without any complex dependencies or authentication.</p>
      </div>

      {/* Red pen icon demo */}
      <div style={{ 
        border: '2px solid #10b981', 
        borderRadius: '8px', 
        padding: '20px',
        backgroundColor: '#f0fdf4',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#065f46', marginBottom: '15px' }}>
          🖊️ Red Pen Icon Test
        </h3>
        
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{
            width: '400px',
            height: '300px',
            backgroundColor: '#2563eb',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            <div>Special Offer</div>
            <div style={{ fontSize: '18px', marginTop: '20px' }}>50% OFF</div>
            <div style={{ fontSize: '16px', marginTop: '20px' }}>Limited Time</div>
          </div>
          
          {/* RED PEN ICON */}
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '50px',
            height: '50px',
            backgroundColor: '#dc2626',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.5)',
            cursor: 'pointer',
            border: '3px solid white',
            zIndex: 10
          }}>
            <span style={{ 
              color: 'white', 
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              ✏️
            </span>
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <div style={{ 
        backgroundColor: '#f3f4f6', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #d1d5db'
      }}>
        <h4 style={{ color: '#374151', marginBottom: '10px' }}>🔗 Test Other Pages:</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a href="/test-image-editor" style={{ color: '#2563eb', textDecoration: 'underline' }}>
            /test-image-editor - Text-based image editor
          </a>
          <a href="/test-basic" style={{ color: '#2563eb', textDecoration: 'underline' }}>
            /test-basic - Basic test page
          </a>
          <a href="/public-test" style={{ color: '#2563eb', textDecoration: 'underline' }}>
            /public-test - Public test page
          </a>
          <a href="/auth" style={{ color: '#2563eb', textDecoration: 'underline' }}>
            /auth - Login page
          </a>
          <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
            / - Home page
          </a>
        </div>
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#6b7280' }}>
        <div><strong>Current URL:</strong> /simple-test</div>
        <div><strong>Server:</strong> http://localhost:3001</div>
        <div><strong>Status:</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>✅ WORKING</span></div>
      </div>
    </div>
  );
}
