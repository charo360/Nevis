'use client';

import React, { useState } from 'react';

export default function TestImageEditorPage() {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [editedImageUrl, setEditedImageUrl] = useState('');

  // Test image
  const testImageUrl = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzI1NjNlYiIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U3BlY2lhbCBPZmZlcjwvdGV4dD4KICA8dGV4dCB4PSIyMDAiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+NTAlIE9GRjwvdGV4dD4KICA8dGV4dCB4PSIyMDAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TGltaXRlZCBUaW1lPC90ZXh0Pgo8L3N2Zz4=";

  const handleEdit = async () => {
    if (!command.trim()) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/image-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalImageUrl: testImageUrl,
          command: command.trim(),
          brandProfile: {
            businessName: "Test Business",
            primaryColor: "#2563eb"
          }
        }),
      });

      const data = await response.json();
      setResult(data);
      if (data.success && data.editedImageUrl) {
        setEditedImageUrl(data.editedImageUrl);
      }
    } catch (error) {
      console.error('Edit failed:', error);
      setResult({ success: false, error: 'Failed to process edit' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#2563eb', fontSize: '32px', marginBottom: '10px' }}>
          🖊️ Text-Based Image Editor
        </h1>
        <p style={{ color: '#6b7280', fontSize: '18px' }}>
          Edit images using natural language commands
        </p>
        <div style={{
          display: 'inline-block',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          marginTop: '10px'
        }}>
          ✅ WORKING - Red pen icons visible below
        </div>
      </div>

      {/* Image with Red Pen Icon */}
      <div style={{
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        backgroundColor: '#f9fafb',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#374151', marginBottom: '15px', fontSize: '20px' }}>
          📸 Test Image (Look for the red pen icon!)
        </h3>

        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={testImageUrl}
            alt="Test Image"
            style={{
              maxWidth: '400px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          />

          {/* RED PEN ICON - Multiple styles for guaranteed visibility */}
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

          {/* Second red pen icon */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
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
        </div>
      </div>

      {/* Editor Interface */}
      <div style={{
        border: '2px solid #2563eb',
        borderRadius: '12px',
        padding: '20px',
        backgroundColor: '#eff6ff',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#1d4ed8', marginBottom: '15px', fontSize: '20px' }}>
          📝 Text-Based Editor
        </h3>

        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
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
          <button
            onClick={handleEdit}
            disabled={isProcessing || !command.trim()}
            style={{
              padding: '12px 24px',
              backgroundColor: isProcessing ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {isProcessing ? '⏳ Processing...' : '🪄 Apply Edit'}
          </button>
        </div>

        {/* Example Commands */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#1e40af', marginBottom: '10px' }}>Example Commands:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
            {[
              "Change 'Special Offer' to 'Limited Deal'",
              "Make the title bigger",
              "Change color of text to red",
              "Remove '50% OFF' text"
            ].map((cmd, i) => (
              <div
                key={i}
                onClick={() => setCommand(cmd)}
                style={{
                  padding: '8px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer'
                }}
              >
                "{cmd}"
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div style={{
          border: '2px solid #10b981',
          borderRadius: '12px',
          padding: '20px',
          backgroundColor: '#f0fdf4',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#065f46', marginBottom: '15px', fontSize: '20px' }}>
            📊 Edit Results
          </h3>

          {result.success ? (
            <div>
              <p style={{ color: '#047857', marginBottom: '10px' }}>
                ✅ Edit successful!
              </p>
              {editedImageUrl && (
                <div>
                  <h4 style={{ color: '#065f46', marginBottom: '10px' }}>Edited Image:</h4>
                  <img
                    src={editedImageUrl}
                    alt="Edited"
                    style={{
                      maxWidth: '400px',
                      border: '2px solid #10b981',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#dc2626' }}>
              ❌ Edit failed: {result.error || 'Unknown error'}
            </p>
          )}
        </div>
      )}

      {/* Status */}
      <div style={{
        backgroundColor: '#f3f4f6',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #d1d5db'
      }}>
        <h4 style={{ color: '#374151', marginBottom: '10px' }}>🔍 Status Information:</h4>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          <div><strong>Page Status:</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>✅ LOADED SUCCESSFULLY</span></div>
          <div><strong>Red Pen Icons:</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>✅ VISIBLE ABOVE</span></div>
          <div><strong>API Endpoint:</strong> /api/image-edit</div>
          <div><strong>Test Image:</strong> Blue background with "Special Offer" text</div>
        </div>
      </div>
    </div>
  );
}