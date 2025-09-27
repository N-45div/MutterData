import { ImageResponse } from 'next/og'
 
// Route segment config
export const runtime = 'edge'
 
// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'
 
// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 24,
          background: '#EA580C',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '8px',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Data visualization icon */}
          <rect x="3" y="8" width="18" height="10" rx="2" stroke="white" strokeWidth="2" fill="none"/>
          <line x1="6" y1="11" x2="15" y2="11" stroke="white" strokeWidth="1"/>
          <line x1="6" y1="13" x2="12" y2="13" stroke="white" strokeWidth="1"/>
          <line x1="6" y1="15" x2="18" y2="15" stroke="white" strokeWidth="1"/>
          {/* Voice waves */}
          <path d="M1 12C1 12 2 10 3 12C3 12 3 14 1 12Z" fill="white"/>
          <path d="M21 12C21 12 22 10 23 12C23 12 23 14 21 12Z" fill="white"/>
        </svg>
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported icons size metadata
      // config to also set the ImageResponse's width and height.
      ...size,
    }
  )
}
