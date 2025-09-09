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
      <svg width= { size } height = { size } viewBox = "0 0 32 32" xmlns = "http://www.w3.org/2000/svg" >
      <defs>
      <linearGradient id="g" x1 = "0" y1 = "0" x2 = "1" y2 = "1" >
      <stop offset="0%" stopColor = "#3B82F6" />
      <stop offset="100%" stopColor = "#A855F7" />
      </linearGradient>
      </defs>
      < rect width = "32" height = "32" rx = "8" fill = "url(#g)" />
      <path fill="#fff" fillRule = "evenodd" d = "M16 7c1.3 3.2 3.1 5 6.1 6.1C19 14.4 17.2 16.2 16 19.2 14.8 16.2 13 14.4 9.9 13.1 12.9 12 14.7 10.2 16 7z M16 9.8c0.7 1.6 1.9 2.8 4 3.4-2.1 0.6-3.3 1.8-4 4-0.7-2.2-1.9-3.4-4-4 2.1-0.6 3.3-1.8 4-3.4z" />
      <circle cx="10.2" cy = "24.0" r = "1.4" fill = "#fff" />
      <rect x="24.4" y = "9.5" width = "3.0" height = "1.2" rx = "0.6" fill = "#fff" />
      <rect x="25.3" y = "8.6" width = "1.2" height = "3.0" rx = "0.6" fill = "#fff" />
      </svg>
  ),
    { width: size, height: size }
  )
}
