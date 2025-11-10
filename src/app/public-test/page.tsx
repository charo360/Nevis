export default function PublicTestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#2563eb', marginBottom: '20px', textAlign: 'center' }}>
        🔧 Public Text-Based Image Editor Test
      </h1>
      
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h2 style={{ color: '#059669' }}>✅ Page Status: LOADED SUCCESSFULLY (No Login Required)</h2>
        <p>This page demonstrates the text-based image editing feature without requiring authentication.</p>
      </div>

      {/* Red Pen Icon Demo */}
      <div style={{ 
        border: '2px solid #10b981', 
        borderRadius: '8px', 
        padding: '20px',
        backgroundColor: '#f0fdf4',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#065f46', marginBottom: '15px' }}>
          🖊️ Red Pen Icon Demonstration
        </h3>
        
        <div style={{ 
          position: 'relative', 
          display: 'inline-block',
          marginBottom: '20px'
        }}>
          <img 
            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzI1NjNlYiIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U3BlY2lhbCBPZmZlcjwvdGV4dD4KICA8dGV4dCB4PSIyMDAiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+NTAlIE9GRjwvdGV4dD4KICA8dGV4dCB4PSIyMDAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TGltaXRlZCBUaW1lPC90ZXh0Pgo8L3N2Zz4=" 
            alt="Test Image" 
            style={{ 
              maxWidth: '400px', 
              border: '2px solid #ccc', 
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          />
          
          {/* RED PEN ICON - Multiple styles to ensure visibility */}
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

          {/* Additional red pen icon with different style */}
          <div style={{
            position: 'absolute',
            top: '70px',
            right: '10px',
            width: '40px',
            height: '40px',
            backgroundColor: '#ef4444',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            cursor: 'pointer'
          }}>
            <span style={{ 
              color: 'white', 
              fontSize: '18px'
            }}>
              🖊️
            </span>
          </div>

          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            🖊️ EDITABLE - Look for red pen icons!
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <h4 style={{ color: '#065f46' }}>✅ What You Should See:</h4>
          <ul style={{ color: '#047857' }}>
            <li><strong>Red circular icon with ✏️</strong> in the top-right corner</li>
            <li><strong>Red square icon with 🖊️</strong> below it</li>
            <li><strong>Black tooltip</strong> at the bottom saying "EDITABLE"</li>
          </ul>
        </div>
      </div>

      {/* Mock Editor Interface */}
      <div style={{ 
        border: '2px solid #2563eb', 
        borderRadius: '8px', 
        padding: '20px',
        backgroundColor: '#eff6ff',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#1d4ed8', marginBottom: '15px' }}>
          📝 Text-Based Image Editor Interface
        </h3>
        
        <div style={{ marginBottom: '15px' }}>
          <input 
            type="text" 
            placeholder="Type your edit command here... (e.g., Change 'Special Offer' to 'Limited Deal')"
            style={{
              width: '70%',
              padding: '12px',
              border: '2px solid #3b82f6',
              borderRadius: '6px',
              marginRight: '10px',
              fontSize: '14px'
            }}
          />
          <button style={{
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            🪄 Apply Edit
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#1e40af' }}>Example Commands to Try:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px', marginTop: '10px' }}>
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
              "Change 'Special Offer' to 'Limited Deal'"
            </div>
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
              "Make the title bigger"
            </div>
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
              "Change color of text to red"
            </div>
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
              "Remove '50% OFF' text"
            </div>
          </div>
        </div>
      </div>

      {/* Login Instructions */}
      <div style={{ 
        border: '2px solid #f59e0b', 
        borderRadius: '8px', 
        padding: '20px',
        backgroundColor: '#fffbeb',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#92400e', marginBottom: '15px' }}>
          🔐 For Full Testing (With Login)
        </h3>
        <div style={{ color: '#78350f' }}>
          <p><strong>Step 1:</strong> Go to <a href="/auth" style={{ color: '#2563eb', textDecoration: 'underline' }}>http://localhost:3001/auth</a></p>
          <p><strong>Step 2:</strong> Login with provided credentials</p>
          <p><strong>Step 3:</strong> After login, try these URLs:</p>
          <ul style={{ marginLeft: '20px' }}>
            <li><code>http://localhost:3001/test-basic</code></li>
            <li><code>http://localhost:3001/test-image-editor</code></li>
            <li><code>http://localhost:3001/quick-content</code> (main app)</li>
          </ul>
        </div>
      </div>

      {/* Status Information */}
      <div style={{ 
        backgroundColor: '#f3f4f6', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #d1d5db'
      }}>
        <h4 style={{ color: '#374151', marginBottom: '10px' }}>🔍 Debug Information:</h4>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          <div><strong>Current URL:</strong> /public-test</div>
          <div><strong>Authentication:</strong> Not required for this page</div>
          <div><strong>Server:</strong> http://localhost:3001</div>
          <div><strong>Framework:</strong> Next.js 15.3.3 with Turbopack</div>
          <div><strong>Red Pen Icons:</strong> ✅ Should be visible above</div>
          <div><strong>Page Status:</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>✅ WORKING</span></div>
        </div>
      </div>
    </div>
  );
}
