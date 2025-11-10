export default function TestBasicPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>
        🔧 Basic Test Page - Working!
      </h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>✅ Page Status: LOADED SUCCESSFULLY</h2>
        <p>If you can see this, the Next.js routing is working correctly.</p>
      </div>

      <div style={{ 
        position: 'relative', 
        display: 'inline-block',
        marginBottom: '30px'
      }}>
        <img 
          src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzI1NjNlYiIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U3BlY2lhbCBPZmZlcjwvdGV4dD4KICA8dGV4dCB4PSIyMDAiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+NTAlIE9GRjwvdGV4dD4KICA8dGV4dCB4PSIyMDAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TGltaXRlZCBUaW1lPC90ZXh0Pgo8L3N2Zz4=" 
          alt="Test Image" 
          style={{ 
            maxWidth: '400px', 
            border: '2px solid #ccc', 
            borderRadius: '8px' 
          }}
        />
        
        {/* RED PEN ICON - This MUST be visible! */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          width: '40px',
          height: '40px',
          backgroundColor: '#ef4444',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          cursor: 'pointer'
        }}>
          <span style={{ 
            color: 'white', 
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            ✏️
          </span>
        </div>

        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          🖊️ Editable with text commands
        </div>
      </div>

      <div style={{ 
        border: '2px solid #2563eb', 
        borderRadius: '8px', 
        padding: '20px',
        backgroundColor: '#f0f9ff'
      }}>
        <h3 style={{ color: '#1d4ed8', marginBottom: '15px' }}>
          📝 Text-Based Image Editor Test
        </h3>
        
        <div style={{ marginBottom: '15px' }}>
          <input 
            type="text" 
            placeholder="Type your edit command here..."
            style={{
              width: '70%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              marginRight: '10px'
            }}
          />
          <button style={{
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Apply Edit
          </button>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <strong>Example Commands:</strong>
          <ul style={{ marginTop: '10px' }}>
            <li>Change 'Special Offer' to 'Limited Deal'</li>
            <li>Make the title bigger</li>
            <li>Change color of text to red</li>
            <li>Remove '50% OFF' text</li>
          </ul>
        </div>

        <div style={{ 
          backgroundColor: '#e5e7eb', 
          padding: '10px', 
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <strong>Status:</strong> Basic page loaded successfully. 
          If you can see the red pen icon (✏️) above the image, the visual indicators are working!
        </div>
      </div>

      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <h4>Debug Information:</h4>
        <ul>
          <li>URL: /test-basic</li>
          <li>Framework: Next.js 15.3.3</li>
          <li>Rendering: Server-side + Client-side</li>
          <li>Red Pen Icon: ✅ Should be visible above image</li>
        </ul>
      </div>
    </div>
  );
}
