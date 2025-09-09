import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'

const ALLOWED_SIZES = new Set([32, 64, 128, 256, 512, 1024])

export async function GET(
  _req: Request,
  context: { params: { size?: string } }
) {
  const raw = context.params?.size || '256'
  const parsed = parseInt(raw, 10)
  const size = ALLOWED_SIZES.has(parsed) ? parsed : 256

  const bg = 'linear-gradient(135deg, #3B82F6 0%, #A855F7 100%)'
  const starSize = Math.round(size * 0.55)

  return new ImageResponse(
    (
      <div
        style= {{
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: bg,
    borderRadius: Math.round(size * 0.25),
  }}
      >
  <div
          style={
  {
    color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif',
        fontWeight: 700,
          fontSize: starSize,
            lineHeight: 1,
              transform: 'translateY(2%)',
          }
}
        >
          ✦
</div>
  </div>
    ),
{ width: size, height: size }
  )
}
