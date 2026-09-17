import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Việc Làm KCN';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8FAFC',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 140,
            height: 140,
            background: 'linear-gradient(to bottom right, #FF6B35, #FF4500)',
            borderRadius: 36,
            marginBottom: 40,
            boxShadow: '0 8px 32px rgba(255,107,53,0.4)'
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="72"
            height="72"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M17 18h1" />
            <path d="M12 18h1" />
            <path d="M7 18h1" />
          </svg>
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 900,
            color: '#FF6B35',
            letterSpacing: '-0.02em',
            marginBottom: 20,
          }}
        >
          Việc Làm KCN
        </div>
        <div
          style={{
            fontSize: 36,
            color: '#64748B',
            fontWeight: 500,
          }}
        >
          Cơ hội việc làm mới mỗi ngày tại các khu công nghiệp
        </div>
      </div>
    ),
    { ...size }
  );
}
