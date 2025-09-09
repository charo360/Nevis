import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <svg width={size.width} height={size.height} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#g)" />
        {/* Star */}
        <path d="M16 7c1.3 3.2 3.1 5 6.1 6.1C19 14.4 17.2 16.2 16 19.2 14.8 16.2 13 14.4 9.9 13.1 12.9 12 14.7 10.2 16 7z" fill="#fff" />
        {/* Bottom-left dot */}
        <circle cx="11.2" cy="22" r="1.2" fill="#fff" />
        {/* Top-right plus */}
        <rect x="22.2" y="8.4" width="3.2" height="1.2" rx="0.6" fill="#fff" />
        <rect x="23.2" y="7.4" width="1.2" height="3.2" rx="0.6" fill="#fff" />
      </svg>
    ),
    { ...size }
  )
}
