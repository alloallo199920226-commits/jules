import { useId } from 'react';
import type { VipLevelDefinition } from '@/config/vip-levels';
import './VipCrown.css';

type VipLevel = VipLevelDefinition['level'];
type CrownDesign = {
  silhouette: string;
  facets: string[];
  highlights: string[];
  band: string;
  jewels: Array<{ x: number; y: number; kind: 'steel' | 'ice' | 'sapphire' | 'gold' | 'emerald' }>;
};

const crownDesigns: Record<VipLevel, CrownDesign> = {
  0: {
    silhouette: 'M8 17 21 29 26 13 39 27 53 12 58 29 72 17 65 48 15 48Z',
    facets: ['M9 18 21 29 26 15 34 29 23 43 15 45Z', 'M39 27 53 14 58 29 49 44 38 31Z', 'M59 30 70 19 64 45 52 43Z'],
    highlights: ['M9 18 21 29 26 13', 'M39 27 53 12', 'M58 29 72 17'],
    band: 'M15 44 65 44 62 54 18 54Z',
    jewels: [{ x: 26, y: 14, kind: 'steel' }, { x: 53, y: 13, kind: 'steel' }],
  },
  1: {
    silhouette: 'M7 18 18 25 19 8 31 23 39 4 47 23 59 8 60 26 73 17 65 48 15 48Z',
    facets: ['M8 19 18 26 19 10 29 27 22 44 15 45Z', 'M31 24 39 6 47 24 43 43 32 35Z', 'M60 27 72 19 65 45 55 43Z'],
    highlights: ['M7 18 18 25 19 8', 'M19 8 31 23 39 4', 'M39 4 47 23 59 8', 'M60 26 73 17'],
    band: 'M15 44 65 44 62 54 18 54Z',
    jewels: [{ x: 19, y: 9, kind: 'ice' }, { x: 39, y: 5, kind: 'ice' }, { x: 59, y: 9, kind: 'ice' }],
  },
  2: {
    silhouette: 'M8 17 Q13 13 18 19 L27 7 33 23 40 3 47 23 56 8 62 22 Q67 16 73 19 L64 48 16 48Z',
    facets: ['M9 19 Q14 15 18 20L27 9 32 26 24 43 16 45Z', 'M33 24 40 5 47 24 44 43 33 36Z', 'M62 23 72 20 64 45 55 43 48 26 56 10Z'],
    highlights: ['M8 17Q13 13 18 19L27 7', 'M33 23 40 3 47 23', 'M56 8 62 22Q67 16 73 19'],
    band: 'M16 44 64 44 61 54 19 54Z',
    jewels: [{ x: 27, y: 9, kind: 'sapphire' }, { x: 40, y: 5, kind: 'ice' }, { x: 56, y: 10, kind: 'sapphire' }],
  },
  3: {
    silhouette: 'M6 18 18 27 20 11 31 23 39 2 47 23 60 10 61 27 74 17 66 48 14 48Z',
    facets: ['M7 19 18 28 20 13 31 25 25 43 14 45Z', 'M32 24 39 4 47 24 43 44 32 36Z', 'M61 28 73 19 66 45 54 43 48 25 60 12Z'],
    highlights: ['M6 18 18 27 20 11', 'M20 11 31 23 39 2 47 23', 'M60 10 61 27 74 17'],
    band: 'M14 44 66 44 63 54 17 54Z',
    jewels: [{ x: 20, y: 12, kind: 'gold' }, { x: 39, y: 5, kind: 'gold' }, { x: 60, y: 11, kind: 'gold' }],
  },
  4: {
    silhouette: 'M7 18 Q13 15 18 21 L23 11 31 20 33 7 40 18 49 7 51 21 61 12 62 27 Q68 20 73 18 L66 48 14 48Z',
    facets: ['M8 20Q14 17 18 22L23 13 31 22 26 43 14 45Z', 'M32 21 33 9 40 19 49 9 51 23 45 43 32 36Z', 'M62 28 72 20 66 45 54 43 51 24 61 14Z'],
    highlights: ['M7 18Q13 15 18 21L23 11 31 20', 'M33 7 40 18 49 7 51 21', 'M61 12 62 27Q68 20 73 18'],
    band: 'M14 44 66 44 63 54 17 54Z',
    jewels: [{ x: 23, y: 12, kind: 'emerald' }, { x: 40, y: 19, kind: 'gold' }, { x: 49, y: 8, kind: 'emerald' }, { x: 61, y: 13, kind: 'gold' }],
  },
};

type JewelKind = 'steel' | 'ice' | 'sapphire' | 'gold' | 'emerald';

export function VipCrown({ level, size = 64, className = '' }: { level: VipLevel; size?: number; className?: string }) {
  const instance = useId().replace(/:/g, '');
  const ids = {
    body: `vip-body-${instance}`,
    side: `vip-side-${instance}`,
    band: `vip-band-${instance}`,
    shadow: `vip-shadow-${instance}`,
    ice: `vip-ice-${instance}`,
    steel: `vip-steel-${instance}`,
    sapphire: `vip-sapphire-${instance}`,
    gold: `vip-gold-${instance}`,
    emerald: `vip-emerald-${instance}`,
  };
  const design = crownDesigns[level];
  const gradientRef = (kind: JewelKind) => `url(#${ids[kind]})`;
  return (
    <svg className={`vip-crown vip-crown-${level}${className ? ` ${className}` : ''}`} width={size} height={Math.round(size * .86)} viewBox="0 0 80 60" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={ids.body} x1="11" y1="8" x2="65" y2="52" gradientUnits="userSpaceOnUse">
          {level === 0 && <><stop stopColor="#E9EEF3"/><stop offset=".28" stopColor="#82909C"/><stop offset=".54" stopColor="#35434E"/><stop offset=".76" stopColor="#C8D0DA"/><stop offset="1" stopColor="#59646E"/></>}
          {level === 1 && <><stop stopColor="#FFFFFF"/><stop offset=".23" stopColor="#C9D7E5"/><stop offset=".48" stopColor="#718AA1"/><stop offset=".73" stopColor="#F5FAFF"/><stop offset="1" stopColor="#899BAD"/></>}
          {level === 2 && <><stop stopColor="#61D6FF"/><stop offset=".24" stopColor="#195BC8"/><stop offset=".5" stopColor="#08286E"/><stop offset=".75" stopColor="#3D9DFA"/><stop offset="1" stopColor="#071B53"/></>}
          {level === 3 && <><stop stopColor="#72B7FF"/><stop offset=".22" stopColor="#2055B0"/><stop offset=".5" stopColor="#091C61"/><stop offset=".76" stopColor="#4384E7"/><stop offset="1" stopColor="#102D76"/></>}
          {level === 4 && <><stop stopColor="#9CFFD1"/><stop offset=".22" stopColor="#249A63"/><stop offset=".5" stopColor="#06472E"/><stop offset=".76" stopColor="#45C982"/><stop offset="1" stopColor="#07351F"/></>}
        </linearGradient>
        <linearGradient id={ids.side} x1="40" y1="13" x2="68" y2="47" gradientUnits="userSpaceOnUse">
          <stop stopColor={level === 0 ? '#9DA8B1' : level === 1 ? '#D5E5F5' : level === 2 ? '#50BFFF' : level === 3 ? '#4F92F6' : '#55D996'}/>
          <stop offset="1" stopColor={level === 0 ? '#27313A' : level === 1 ? '#71849A' : level === 2 ? '#061747' : level === 3 ? '#071843' : '#032A1A'}/>
        </linearGradient>
        <linearGradient id={ids.band} x1="13" y1="43" x2="66" y2="55" gradientUnits="userSpaceOnUse">
          {level === 0 && <><stop stopColor="#F4F7FA"/><stop offset=".24" stopColor="#667480"/><stop offset=".55" stopColor="#303D47"/><stop offset=".78" stopColor="#D5DCE2"/><stop offset="1" stopColor="#59646D"/></>}
          {level === 1 && <><stop stopColor="#FFFFFF"/><stop offset=".24" stopColor="#A8BBCD"/><stop offset=".55" stopColor="#61788F"/><stop offset=".78" stopColor="#F8FCFF"/><stop offset="1" stopColor="#71849A"/></>}
          {level >= 2 && <><stop stopColor="#FFF0B0"/><stop offset=".2" stopColor="#D49A2B"/><stop offset=".5" stopColor="#775012"/><stop offset=".76" stopColor="#FFE48A"/><stop offset="1" stopColor="#956319"/></>}
        </linearGradient>
        <linearGradient id={ids.ice} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FFFFFF"/><stop offset=".52" stopColor="#9CDCF9"/><stop offset="1" stopColor="#446B91"/></linearGradient>
        <linearGradient id={ids.steel} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FFFFFF"/><stop offset=".36" stopColor="#B8C3CD"/><stop offset=".72" stopColor="#5E6C78"/><stop offset="1" stopColor="#E1E7EC"/></linearGradient>
        <linearGradient id={ids.sapphire} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#E4FCFF"/><stop offset=".34" stopColor="#4EC4FF"/><stop offset=".65" stopColor="#1255D5"/><stop offset="1" stopColor="#05205F"/></linearGradient>
        <linearGradient id={ids.gold} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FFF7C9"/><stop offset=".45" stopColor="#F2BF43"/><stop offset="1" stopColor="#9B5D10"/></linearGradient>
        <linearGradient id={ids.emerald} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#E0FFB3"/><stop offset=".4" stopColor="#42D88D"/><stop offset="1" stopColor="#087143"/></linearGradient>
        <filter id={ids.shadow} filterUnits="userSpaceOnUse" x="-5" y="-5" width="90" height="70" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.4"/><feOffset dy="2"/><feComponentTransfer><feFuncA type="linear" slope=".55"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <g filter={`url(#${ids.shadow})`} strokeLinejoin="round">
        <path d={design.silhouette} fill={`url(#${ids.body})`} stroke={level < 2 ? '#F7FAFD' : '#F6D77A'} strokeOpacity=".9" strokeWidth="1.3"/>
        {design.facets.map((path, index) => <path key={`facet-${index}`} d={path} fill={`url(#${ids.side})`} opacity={index === 1 ? '.77' : '.52'}/>)}
        {design.highlights.map((path, index) => <path key={`highlight-${index}`} d={path} fill="none" stroke={level < 2 ? '#FFFFFF' : '#FFE7A0'} strokeOpacity={index === 1 ? '.92' : '.68'} strokeWidth={index === 1 ? '1.5' : '1.1'} strokeLinecap="round"/>)}
        <path d={design.band} fill={`url(#${ids.band})`} stroke={level < 2 ? '#F5F8FB' : '#FFF0B0'} strokeWidth="1.1"/>
        <path d="M18 47H62" stroke={level < 2 ? '#26343F' : '#5A390E'} strokeOpacity=".7" strokeWidth="1.25"/>
        <path d="M20 50H60" stroke="#FFF7D1" strokeOpacity=".66" strokeWidth=".8"/>
        {design.jewels.map((jewel, index) => (
          <g key={`jewel-${index}`} transform={`translate(${jewel.x} ${jewel.y})`}>
            <path d="M0-3.5 3.3 0 0 3.5-3.3 0Z" fill={gradientRef(jewel.kind)} stroke={jewel.kind === 'gold' ? '#FFF4C5' : jewel.kind === 'steel' ? '#F4F7FA' : '#D9F5FF'} strokeWidth=".65"/>
            <path d="M-.7-2.1 0 0 1.7-1.9" fill="none" stroke="#FFFFFF" strokeOpacity=".82" strokeWidth=".65"/>
          </g>
        ))}
      </g>
    </svg>
  );
}
