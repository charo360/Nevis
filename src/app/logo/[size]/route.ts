import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'

// Allowed sizes to keep things predictable
const ALLOWED_SIZES = new Set([32, 64, 128, 256, 512, 1024])

export async function GET(
  _req: Request,
  context: { params: { size?: string } }
) {
  const raw = context.params?.size || '256'
  const parsed = parseInt(raw, 10)
  const size = ALLOWED_SIZES.has(parsed) ? parsed : 256

  // Render the same shape as public/favicon.svg, but rasterized to PNG at requested size
  return new ImageResponse(
    (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="6" fill="#2563eb" />
        <path
          d="M8 24V8h4.5l6 12L24.5 8H29v16h-4v-9.5L19.5 24h-3L11 14.5V24H8z"
          fill="white"
        />
      </svg>
    ),
    {
      width: size,
      height: size,
    }
  )
}

