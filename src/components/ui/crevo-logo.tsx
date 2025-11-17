import React from 'react';

interface CrevoLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function CrevoLogo({ className = '', width = 140, height = 40 }: CrevoLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 140 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Crevo text */}
      <g>
        {/* C */}
        <path
          d="M2 20C2 11.163 9.163 4 18 4C23.523 4 28.418 6.477 31.314 10.343L27.686 13.657C25.842 11.023 22.158 9.2 18 9.2C12.477 9.2 7.2 13.477 7.2 20C7.2 26.523 12.477 30.8 18 30.8C22.158 30.8 25.842 28.977 27.686 26.343L31.314 29.657C28.418 33.523 23.523 36 18 36C9.163 36 2 28.837 2 20Z"
          fill="url(#textGradient)"
        />

        {/* r */}
        <path
          d="M35 8H42V14.4C43.6 10.8 46.4 8.8 50.4 8.8V15.6C49.6 15.2 48.8 15.2 48 15.2C45.2 15.2 42 17.2 42 21.4V32H35V8Z"
          fill="url(#textGradient)"
        />

        {/* e */}
        <path
          d="M54 20C54 13.373 58.373 9 65 9C71.627 9 76 13.373 76 20C76 20.667 76 21.333 75.667 22H61.333C61.667 24.667 63.333 26 65.667 26C67.333 26 68.667 25.333 69.667 24L73.333 27.333C71.333 30.667 67.667 32 64.667 32C58 32 54 27.627 54 20ZM65.667 15.333C63.333 15.333 61.667 16.667 61.333 18.667H70C69.667 16.667 68 15.333 65.667 15.333Z"
          fill="url(#textGradient)"
        />

        {/* v */}
        <path
          d="M80 8H87.2L92.4 24.8L97.6 8H104.8L96.8 32H88L80 8Z"
          fill="url(#textGradient)"
        />

        {/* o */}
        <path
          d="M108 20C108 13.373 112.373 9 119 9C125.627 9 130 13.373 130 20C130 26.627 125.627 31 119 31C112.373 31 108 26.627 108 20ZM123 20C123 17.239 121.761 16 119 16C116.239 16 115 17.239 115 20C115 22.761 116.239 24 119 24C121.761 24 123 22.761 123 20Z"
          fill="url(#textGradient)"
        />
      </g>

      {/* Plus icon - positioned after the text */}
      <g transform="translate(132, 12)">
        <rect x="0" y="4" width="3" height="3" rx="0.5" fill="#C084FC" />
        <rect x="4" y="0" width="3" height="3" rx="0.5" fill="#C084FC" />
        <rect x="4" y="8" width="3" height="3" rx="0.5" fill="#C084FC" />
        <rect x="4" y="4" width="3" height="3" rx="0.5" fill="#E879F9" />
        <rect x="8" y="4" width="3" height="3" rx="0.5" fill="#C084FC" />
      </g>

      {/* Gradients */}
      <defs>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="30%" stopColor="#3B82F6" />
          <stop offset="60%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>
    </svg>
  );
}
