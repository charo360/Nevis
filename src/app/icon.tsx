import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #3B82F6 0%, #A855F7 100%)',
          borderRadius: 8,
        }}
      >
        <div
          style={{
            color: '#ffffff',
            fontFamily:
              'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif',
            fontWeight: 700,
            fontSize: 20,
            lineHeight: 1,
            transform: 'translateY(2%)',
          }}
        >
          ✦
        </div>
      </div>
    ),
    { ...size }
  )
}
