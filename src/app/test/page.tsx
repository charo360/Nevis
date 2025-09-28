// Simple test page to check if Next.js is working
export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎉 Nevis Test Page</h1>
      <p>If you can see this page, Next.js is working correctly!</p>
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h2>🎨 Logo Improvements Status</h2>
        <ul>
          <li>✅ Enhanced Logo Color Adaptation System</li>
          <li>✅ Smart Logo Positioning Algorithm</li>
          <li>✅ Platform-Optimized Logo Sizing</li>
          <li>✅ SVG Support & Transparency Preservation</li>
          <li>✅ Advanced Image Analysis</li>
        </ul>
      </div>
      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: '#0070f3', textDecoration: 'none' }} onClick={(e)=>{e.preventDefault(); window.location.href='/'}}>
          ← Back to Home
        </a>
      </div>
    </div>
  );
}
