import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

const COLORS = {
  bgTop: '#0B1220',
  bgBottom: '#05070C',
  glow: 'rgba(30,155,255,0.28)',
  accent: '#2EA1F7',
  accentSoft: '#8FD3FF',
  white: '#F5F7FA',
  muted: '#94A3B8',
  border: 'rgba(255,255,255,0.12)',
  pillBg: 'rgba(255,255,255,0.06)',
}

const TECH = ['Next.js', 'React', 'TypeScript', 'Node.js']

function loadAsset(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath))
}

export const ogImageSize = { width: 1200, height: 630 }
export const ogImageContentType = 'image/png'

export async function renderOgImage() {
  const portrait = loadAsset('src/assets/og-portrait.png')
  const portraitB64 = `data:image/png;base64,${portrait.toString('base64')}`

  const interRegular = loadAsset('src/assets/fonts/Inter-400.ttf')
  const interSemibold = loadAsset('src/assets/fonts/Inter-600.ttf')
  const interBold = loadAsset('src/assets/fonts/Inter-700.ttf')

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: `linear-gradient(135deg, ${COLORS.bgTop} 0%, ${COLORS.bgBottom} 100%)`,
          position: 'relative',
          fontFamily: 'Inter',
        }}
      >
        {/* ambient glow */}
        <div
          style={{
            position: 'absolute',
            top: -140,
            left: 260,
            width: 560,
            height: 560,
            borderRadius: 9999,
            background: COLORS.glow,
            filter: 'blur(40px)',
            display: 'flex',
          }}
        />

        {/* left: text content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: 660,
            padding: '0 0 0 64px',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 9999,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.pillBg,
              alignSelf: 'flex-start',
              marginBottom: 28,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: 9999, background: COLORS.accent, display: 'flex' }} />
            <span style={{ fontSize: 20, color: COLORS.accentSoft, fontFamily: 'Inter-Semibold' }}>
              ahmedamin.tech
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: 76,
              lineHeight: 1.05,
              color: COLORS.white,
              fontFamily: 'Inter-Bold',
              letterSpacing: -2,
            }}
          >
            Ahmed Amin
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: 34,
              marginTop: 14,
              color: COLORS.accent,
              fontFamily: 'Inter-Semibold',
            }}
          >
            Full-Stack Software Engineer
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: 22,
              marginTop: 20,
              color: COLORS.muted,
              maxWidth: 520,
              lineHeight: 1.5,
            }}
          >
            Building fast, modern web apps with Next.js, React &amp; AI-driven automation.
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 36, flexWrap: 'wrap' }}>
            {TECH.map((t) => (
              <div
                key={t}
                style={{
                  display: 'flex',
                  padding: '9px 18px',
                  borderRadius: 9999,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.pillBg,
                  color: '#CBD5E1',
                  fontSize: 19,
                  fontFamily: 'Inter-Semibold',
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* right: portrait panel */}
        <div
          style={{
            display: 'flex',
            position: 'relative',
            width: 540,
            height: '100%',
            marginLeft: 'auto',
          }}
        >
          <img
            src={portraitB64}
            width={540}
            height={630}
            style={{ objectFit: 'cover' }}
          />
          {/* fade the portrait's left edge into the background */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 160,
              height: '100%',
              display: 'flex',
              background: `linear-gradient(90deg, ${COLORS.bgBottom} 0%, rgba(5,7,12,0) 100%)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: 140,
              display: 'flex',
              background: `linear-gradient(0deg, ${COLORS.bgBottom} 0%, rgba(5,7,12,0) 100%)`,
            }}
          />
        </div>
      </div>
    ),
    {
      width: ogImageSize.width,
      height: ogImageSize.height,
      fonts: [
        { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
        { name: 'Inter-Semibold', data: interSemibold, weight: 600, style: 'normal' },
        { name: 'Inter-Bold', data: interBold, weight: 700, style: 'normal' },
      ],
    },
  )
}
