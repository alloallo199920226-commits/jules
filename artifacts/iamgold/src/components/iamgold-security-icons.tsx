import { useId } from 'react';

export type IamgoldSecurityIconName =
  | 'phone'
  | 'lock'
  | 'shield'
  | 'shieldLock'
  | 'eye'
  | 'eyeOff'
  | 'send'
  | 'power'
  | 'headset'
  | 'back'
  | 'ornament';

export function IamgoldSecurityIcon({ name, size = 24 }: { name: IamgoldSecurityIconName; size?: number }) {
  const gradientId = `ig-metal-${useId().replace(/:/g, '')}`;
  const blueId = `${gradientId}-blue`;
  const shineId = `${gradientId}-shine`;

  return <svg
    className="iamgold-security-icon"
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id={gradientId} x1="7" y1="4" x2="41" y2="45" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFF2B6"/>
        <stop offset=".24" stopColor="#FFD966"/>
        <stop offset=".53" stopColor="#F5B923"/>
        <stop offset=".78" stopColor="#B87912"/>
        <stop offset="1" stopColor="#FFE59A"/>
      </linearGradient>
      <linearGradient id={blueId} x1="10" y1="6" x2="37" y2="43" gradientUnits="userSpaceOnUse">
        <stop stopColor="#174C71"/>
        <stop offset=".58" stopColor="#082B49"/>
        <stop offset="1" stopColor="#03162D"/>
      </linearGradient>
      <linearGradient id={shineId} x1="12" y1="6" x2="35" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFF8D8"/>
        <stop offset="1" stopColor="#F5B923" stopOpacity=".2"/>
      </linearGradient>
    </defs>
    {name === 'phone' && <>
      <rect x="10" y="3.5" width="28" height="41" rx="6.5" fill="#03162D" stroke={gradientId ? `url(#${gradientId})` : '#F5B923'} strokeWidth="2.5"/>
      <rect x="14" y="9" width="20" height="27" rx="2.5" fill={`url(#${blueId})`} stroke="#FFD966" strokeWidth="1.25"/>
      <path d="M19 6.8h10" stroke={`url(#${shineId})`} strokeWidth="1.7" strokeLinecap="round"/>
      <circle cx="24" cy="40" r="1.8" fill="#FFD966"/>
      <path d="M17 12h14" stroke="#fff2b6" strokeOpacity=".38"/>
    </>}
    {name === 'lock' && <>
      <path d="M14 21v-7a10 10 0 0 1 20 0v7" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round"/>
      <path d="M12.5 20h23A3.5 3.5 0 0 1 39 23.5v16a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4v-16a3.5 3.5 0 0 1 3.5-3.5Z" fill={`url(#${gradientId})`} stroke="#FFF0B3" strokeWidth="1.5"/>
      <path d="M24 27a4 4 0 0 0-2 7.46V38h4v-3.54A4 4 0 0 0 24 27Z" fill={`url(#${blueId})`}/>
      <path d="M14 23h20" stroke="#fff8dc" strokeWidth="1.3" strokeLinecap="round" opacity=".9"/>
    </>}
    {(name === 'shield' || name === 'shieldLock') && <>
      <path d="M24 3 41 9v12c0 11-7 18.5-17 24C14 39.5 7 32 7 21V9l17-6Z" fill={`url(#${blueId})`} stroke={`url(#${gradientId})`} strokeWidth="3"/>
      {name === 'shieldLock' ? <>
        <path d="M18 22v-6a6 6 0 0 1 12 0v6" stroke={`url(#${gradientId})`} strokeWidth="3"/>
        <rect x="14" y="21" width="20" height="16" rx="3" fill={`url(#${gradientId})`} stroke="#FFF2B6"/>
        <path d="M24 25a3 3 0 0 0-1.4 5.65V33h2.8v-2.35A3 3 0 0 0 24 25Z" fill="#03162D"/>
      </> : <path d="m14.5 23.5 6 6L34 16" stroke={`url(#${gradientId})`} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round"/>}
      <path d="M11 11 24 6l13 5" stroke="#FFF2B6" strokeWidth="1.3" strokeLinecap="round" opacity=".88"/>
    </>}
    {name === 'eye' && <>
      <path d="M4 24s7-12 20-12 20 12 20 12-7 12-20 12S4 24 4 24Z" fill={`url(#${blueId})`} stroke={`url(#${gradientId})`} strokeWidth="2.8"/>
      <circle cx="24" cy="24" r="6.5" fill={`url(#${gradientId})`} stroke="#FFF1B5" strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="2.5" fill="#082B49"/>
      <path d="M10 22c3.7-4.8 8.4-7.2 14-7.2" stroke="#FFF4C9" strokeWidth="1.3" strokeLinecap="round"/>
    </>}
    {name === 'eyeOff' && <>
      <path d="M4 24s7-12 20-12 20 12 20 12-7 12-20 12S4 24 4 24Z" fill={`url(#${blueId})`} stroke={`url(#${gradientId})`} strokeWidth="2.8"/>
      <path d="M20 19a6.5 6.5 0 0 0 9 9M18.7 29.3a6.5 6.5 0 0 0 9.4-9.4" stroke={`url(#${gradientId})`} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="m7 7 34 34" stroke={`url(#${gradientId})`} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="m8.4 8.4 31.2 31.2" stroke="#FFF3BD" strokeWidth="1" strokeLinecap="round" opacity=".9"/>
    </>}
    {name === 'send' && <>
      <path d="m4 21 39-16-12.7 38-8.1-15.1L4 21Z" fill={`url(#${gradientId})`} stroke="#FFF1B5" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="m22.2 27.9 20-22.1-25 18.2" stroke={`url(#${blueId})`} strokeWidth="2.3" strokeLinejoin="round"/>
      <path d="m8 20.5 29-11.8" stroke="#FFF9DF" strokeWidth="1.4" strokeLinecap="round" opacity=".8"/>
    </>}
    {name === 'power' && <>
      <path d="M24 5v18" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round"/>
      <path d="M14.4 10.8a17 17 0 1 0 19.2 0" stroke={`url(#${gradientId})`} strokeWidth="4.5" strokeLinecap="round"/>
      <path d="M24 7v11" stroke="#FFF6D0" strokeWidth="1.2" strokeLinecap="round"/>
    </>}
    {name === 'headset' && <>
      <path d="M6 25v-3a18 18 0 0 1 36 0v3" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round"/>
      <path d="M7 23h7v15H9a4 4 0 0 1-4-4v-7a4 4 0 0 1 2-4ZM41 23h-7v15h5a4 4 0 0 0 4-4v-7a4 4 0 0 0-2-4Z" fill={`url(#${gradientId})`} stroke="#FFF1B5" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M14 35c2 4 5.5 6 10 6h4" stroke={`url(#${gradientId})`} strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="30" cy="41" r="2.2" fill="#FFD966"/>
      <path d="M9 26v7M39 26v7" stroke="#FFF7D4" strokeWidth="1.2" strokeLinecap="round"/>
    </>}
    {name === 'back' && <>
      <circle cx="24" cy="24" r="20" fill={`url(#${blueId})`} stroke={`url(#${gradientId})`} strokeWidth="3"/>
      <circle cx="24" cy="24" r="16.3" stroke="#FFD966" strokeOpacity=".7" strokeWidth="1"/>
      <path d="M27.5 14 17 24l10.5 10M18 24h17" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="m19 23.2 8.5-8" stroke="#FFF7D7" strokeWidth="1.2" strokeLinecap="round"/>
    </>}
    {name === 'ornament' && <>
      <path d="M5 39C15 37 21 29 26 15M9 35c-1-8-5-12-6-13 8 0 13 4 14 11M17 29c-1-8 2-13 4-16 4 7 4 12 .5 18M23 20c4-7 9-9 13-10-2 8-6 12-13 13M10 34c6 1 10 4 13 9" stroke={`url(#${gradientId})`} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.5 22c5 0 9 2.7 12 8M21 17c3 5 3 9 1 13M35 11c-1 5-4 9-10 11" stroke="#FFF3BE" strokeWidth="1" strokeLinecap="round"/>
      <circle cx="26" cy="14" r="1.6" fill="#FFF0AC"/>
    </>}
  </svg>;
}
