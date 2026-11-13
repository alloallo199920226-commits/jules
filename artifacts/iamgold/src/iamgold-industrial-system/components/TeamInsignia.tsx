import { useId } from 'react';

const metals = {
  1: { top: '#fff0a8', mid: '#d6a63d', low: '#754510', edge: '#ffe9a1', shadow: '#42280d', accent: '#f6d77a' },
  2: { top: '#ffffff', mid: '#bcc8d2', low: '#52677a', edge: '#f4f7fa', shadow: '#24384b', accent: '#dce5ec' },
  3: { top: '#ffd4a0', mid: '#bd7040', low: '#572b1b', edge: '#ffe0b0', shadow: '#30180e', accent: '#e9a36c' },
} as const;

export function TeamInsignia({ level }: { level: number }) {
  const safeLevel = (level === 2 || level === 3 ? level : 1) as keyof typeof metals;
  const metal = metals[safeLevel];
  const id = useId().replace(/:/g, '');
  const gradient = `team-metal-${id}`;
  return (
    <span className={`team-medal team-medal-${safeLevel}`} aria-hidden="true">
      <svg viewBox="0 0 64 66" role="presentation">
        <defs>
          <linearGradient id={gradient} x1="10" y1="4" x2="53" y2="62" gradientUnits="userSpaceOnUse">
            <stop stopColor={metal.top} />
            <stop offset=".26" stopColor={metal.mid} />
            <stop offset=".52" stopColor={metal.low} />
            <stop offset=".78" stopColor={metal.mid} />
            <stop offset="1" stopColor={metal.top} />
          </linearGradient>
        </defs>
        <path d="M9 48C2 39 5 22 15 13M55 48c7-9 4-26-6-35" fill="none" stroke={metal.edge} strokeWidth="2.4" />
        <path d="M12 42 7 38m8-1-6-5m9-1-6-5m9-1-4-6m-1 31-7 2m39-10 5-4m-8-1 6-5m-9-1 6-5m-9-1 4-6m1 31 7 2" fill="none" stroke={metal.accent} strokeWidth="2" strokeLinecap="round" />
        <path d="m32 2 5 8 8-5 1 10 10 2-6 8 6 8-10 2-1 10-8-5-5 8-5-8-8 5-1-10-10-2 6-8-6-8 10-2 1-10 8 5z" fill={metal.shadow} stroke={metal.edge} strokeWidth="1.2" />
        <path d="m32 7 4 7 7-4 1 8 8 1-5 7 5 7-8 1-1 8-7-4-4 7-4-7-7 4-1-8-8-1 5-7-5-7 8-1 1-8 7 4z" fill={`url(#${gradient})`} stroke={metal.edge} strokeWidth="1.1" />
        <path d="m23 18 9-5 9 5-2 22-7 5-7-5z" fill={metal.shadow} stroke={metal.edge} strokeWidth="1.1" />
        <path d="m24 19 8-4v28l-6-4z" fill={`url(#${gradient})`} />
        {safeLevel === 1 && <path d="m24 17 3-6 5 4 5-4 3 6" fill="none" stroke={metal.edge} strokeWidth="2.2" strokeLinejoin="round" />}
        <path d="M23 21h18" stroke={metal.edge} strokeOpacity=".75" strokeWidth="1" />
        <text x="32" y="34" textAnchor="middle" fill="#fff9e9" fontFamily="Georgia,serif" fontSize="15" fontWeight="700">{safeLevel}</text>
        <path d="M17 51h30l-4 8H21z" fill={`url(#${gradient})`} stroke={metal.edge} strokeWidth="1" />
        <path d="M21 53h22" stroke={metal.top} strokeWidth="1" />
      </svg>
    </span>
  );
}
