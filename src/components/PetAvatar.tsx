import type { PetMood } from '../lib/types'

interface Props {
  mood: PetMood
  size?: number
  className?: string
}

/** Placeholder pet illustration. Replace with official Morning Pet artwork. */
export function PetAvatar({ mood, size = 160, className = '' }: Props) {
  const label = { sleepy: 'Your pet is still asleep', waking: 'Your pet is waking up', happy: 'Your pet is happy' }[mood]
  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={`${mood === 'happy' ? 'animate-hop' : ''} ${className}`}
    >
      {/* body */}
      <ellipse cx="80" cy="96" rx="58" ry="50" fill="var(--mp-sun)" />
      {/* ears */}
      <path d="M34 66 L40 24 L66 52 Z" fill="var(--mp-sun)" />
      <path d="M126 66 L120 24 L94 52 Z" fill="var(--mp-sun)" />
      <path d="M42 56 L45 36 L58 50 Z" fill="var(--mp-sun-strong)" opacity="0.6" />
      <path d="M118 56 L115 36 L102 50 Z" fill="var(--mp-sun-strong)" opacity="0.6" />
      {/* cheeks */}
      <circle cx="48" cy="104" r="9" fill="var(--mp-berry)" opacity="0.35" />
      <circle cx="112" cy="104" r="9" fill="var(--mp-berry)" opacity="0.35" />
      {/* eyes */}
      {mood === 'sleepy' ? (
        <g stroke="#3a2a1a" strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M52 88 q10 8 20 0" />
          <path d="M88 88 q10 8 20 0" />
        </g>
      ) : (
        <g fill="#3a2a1a">
          <circle cx="62" cy="86" r={mood === 'happy' ? 8 : 6} />
          <circle cx="98" cy="86" r={mood === 'happy' ? 8 : 6} />
          {mood === 'happy' && (
            <>
              <circle cx="65" cy="83" r="2.5" fill="#fff" />
              <circle cx="101" cy="83" r="2.5" fill="#fff" />
            </>
          )}
        </g>
      )}
      {/* mouth */}
      {mood === 'happy' ? (
        <path d="M66 106 q14 14 28 0 Z" fill="#3a2a1a" />
      ) : (
        <path d="M72 108 q8 5 16 0" stroke="#3a2a1a" strokeWidth="4" fill="none" strokeLinecap="round" />
      )}
      {/* zzz */}
      {mood === 'sleepy' && (
        <text x="120" y="40" fontSize="22" fontWeight="800" fill="var(--mp-sky)">
          z<tspan dx="2" dy="-10" fontSize="16">z</tspan>
        </text>
      )}
    </svg>
  )
}
