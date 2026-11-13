import type { CSSProperties } from 'react';
import { useState } from 'react';

export const lotteryReferencePrizes = [
  { number: '6', amount: 'FCFA 2 000', color: '#f2ad21' },
  { number: '7', amount: 'FCFA 10 000', color: '#08783e' },
  { number: '8', amount: 'FCFA 50 000', color: '#bd201e' },
  { number: '9', amount: 'FCFA 100 000', color: '#1355a1' },
  { number: '1', amount: 'FCFA 500', color: '#bd201e' },
  { number: '2', amount: 'FCFA 100', color: '#1355a1' },
  { number: '3', amount: 'FCFA 200', color: '#08783e' },
  { number: '4', amount: 'FCFA 500', color: '#1355a1' },
  { number: '5', amount: 'FCFA 1 000', color: '#bd201e' },
];

function point(radius: number, degrees: number) {
  const radians = (degrees - 90) * Math.PI / 180;
  return [180 + radius * Math.cos(radians), 180 + radius * Math.sin(radians)] as const;
}

function sectorPath(start: number, end: number) {
  const [sx, sy] = point(149, start);
  const [ex, ey] = point(149, end);
  return `M 180 180 L ${sx} ${sy} A 149 149 0 0 1 ${ex} ${ey} Z`;
}

export function LotteryWheel({ chances, onUnavailable, previewing }: {
  chances: number;
  onUnavailable: () => void;
  previewing: boolean;
}) {
  const [completedTurns, setCompletedTurns] = useState(0);
  const bolts = Array.from({ length: 18 }, (_, index) => point(166, index * 20));
  const sparks = Array.from({ length: 12 }, (_, index) => index);
  return (
    <div className={`lottery-wheel-wrap${previewing ? ' is-previewing' : ''}`}>
      <div className="lottery-wheel-sparks" aria-hidden="true">
        {sparks.map((spark) => <i key={spark} />)}
      </div>
      <div className="lottery-pointer" aria-hidden="true"><i /></div>
      <svg
        className="lottery-wheel-svg"
        style={{ '--wheel-angle': `${completedTurns * 720}deg` } as CSSProperties}
        onAnimationEnd={(event) => {
          if (event.animationName === 'lottery-preview-turn') setCompletedTurns((turns) => turns + 1);
        }}
        viewBox="0 0 360 360"
        role="img"
        aria-label="Roue décorative de neuf segments, valeurs affichées à titre indicatif"
      >
        <defs>
          <linearGradient id="royalWheelRim" x1="15" y1="8" x2="345" y2="352" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffce3" /><stop offset=".07" stopColor="#a85f0c" /><stop offset=".14" stopColor="#fff0a2" /><stop offset=".23" stopColor="#e2a321" /><stop offset=".34" stopColor="#fff8c8" /><stop offset=".47" stopColor="#9c5809" /><stop offset=".58" stopColor="#ffe98a" /><stop offset=".7" stopColor="#bd7910" /><stop offset=".81" stopColor="#fff7cb" /><stop offset=".91" stopColor="#a4660c" /><stop offset="1" stopColor="#fff8d4" />
          </linearGradient>
          <radialGradient id="royalWheelFace" cx=".22" cy=".14" r="1">
            <stop stopColor="#ffffff" stopOpacity=".23"/><stop offset=".3" stopColor="#fff" stopOpacity=".04"/><stop offset=".78" stopColor="#fff" stopOpacity=".02"/><stop offset="1" stopColor="#00152c" stopOpacity=".24"/>
          </radialGradient>
          <radialGradient id="royalWheelBulb">
            <stop stopColor="#fffef0"/><stop offset=".24" stopColor="#fff8ca"/><stop offset=".51" stopColor="#fff3a0"/><stop offset=".72" stopColor="#f5b526"/><stop offset="1" stopColor="#8d4b04"/>
          </radialGradient>
          <radialGradient id="royalWheelHub" cx=".32" cy=".2" r=".9">
            <stop stopColor="#477894"/><stop offset=".18" stopColor="#183e5d"/><stop offset=".45" stopColor="#092b49"/><stop offset=".8" stopColor="#06182d"/><stop offset="1" stopColor="#020914"/>
          </radialGradient>
          <radialGradient id="royalWheelGlow" cx=".3" cy=".14" r=".95">
            <stop stopColor="#fff" stopOpacity=".3"/><stop offset=".42" stopColor="#fff" stopOpacity=".07"/><stop offset="1" stopColor="#061326" stopOpacity=".1"/>
          </radialGradient>
          <filter id="wheelBulbShadow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx="180" cy="180" r="178" fill="#07111d" stroke="#fff3bb" strokeWidth="1" />
        <circle cx="180" cy="180" r="175" fill="url(#royalWheelRim)" stroke="#633b09" strokeWidth="2" />
        <circle cx="180" cy="180" r="167" fill="#fff2a7" stroke="#6d460e" strokeWidth="2" />
        <circle cx="180" cy="180" r="160" fill="#071a2e" stroke="#f9e7a1" strokeWidth="2" />
        {lotteryReferencePrizes.map((prize, index) => {
          const start = index * 40 - 20;
          const [x, y] = point(105, index * 40);
          const labelStyle = { '--wheel-angle': `${index * 40}deg` } as CSSProperties;
          return (
            <g key={prize.number}>
              <path d={sectorPath(start, start + 40)} fill={prize.color} stroke="#fff2a2" strokeWidth="2" />
              <path d={sectorPath(start + 2, start + 38)} fill="url(#royalWheelFace)" stroke="#fff9d7" strokeOpacity=".35" strokeWidth="1.2" />
              <g transform={`translate(${x} ${y}) rotate(${index * 40})`} className="lottery-wheel-label" style={labelStyle}>
                <circle cy="-11" r="18.4" fill="#321d11" opacity=".8" />
                <circle cy="-13" r="16" fill="url(#royalWheelRim)" stroke="#fff7c8" strokeWidth="1.6" />
                <circle cy="-13" r="12.2" fill={prize.color} stroke="#fff7dc" strokeWidth="1.2" />
                <circle cy="-17" r="5" fill="#fff" opacity=".19" />
                <text y="-7" textAnchor="middle" fill="#fffef4" stroke="#401a0e" strokeWidth=".8" paintOrder="stroke" fontFamily="Georgia,serif" fontWeight="700" fontSize="17">{prize.number}</text>
                <text y="24" textAnchor="middle" fill="#fff9df" stroke="#39210c" strokeWidth="1.5" paintOrder="stroke" fontFamily="DM Sans,sans-serif" fontWeight="800" fontSize="9">{prize.amount.replaceAll(' ', '')}</text>
              </g>
            </g>
          );
        })}
        <circle cx="180" cy="180" r="157" fill="none" stroke="#fff9d5" strokeOpacity=".8" strokeWidth="2" />
        <circle cx="180" cy="180" r="151" fill="none" stroke="#7a4d12" strokeWidth="3" />
        <circle cx="180" cy="180" r="149" fill="url(#royalWheelGlow)" pointerEvents="none" />
        <circle cx="180" cy="180" r="57" fill="url(#royalWheelRim)" stroke="#fff7c7" strokeWidth="2" />
        <circle cx="180" cy="180" r="49" fill="url(#royalWheelHub)" stroke="#69420d" strokeWidth="2" />
        <circle cx="180" cy="180" r="43" fill="none" stroke="#fff4bf" strokeOpacity=".34" strokeWidth="1" />
        <path d="M163 148l5-11 12 7 12-7 5 11 10 3-7 9-1-5-19 12-19-12-1 5-7-9z" fill="url(#royalWheelRim)" stroke="#fff4bf" strokeWidth="1.5" />
        <text x="180" y="183" textAnchor="middle" fill="#fff3aa" fontFamily="Barlow Condensed,sans-serif" fontWeight="900" fontSize="15" letterSpacing="1">IAMGOLD</text>
        {bolts.map(([x, y], index) => <g key={index} filter="url(#wheelBulbShadow)"><circle cx={x} cy={y} r="5.8" fill="#482b0b" stroke="#ffe8a0" strokeWidth="1" /><circle cx={x} cy={y} r="3.7" fill="url(#royalWheelBulb)" stroke="#fff5c7" strokeWidth=".8" /></g>)}
      </svg>
      <div className="lottery-wheel-crown" aria-hidden="true"><span /><span /><span /></div>
      <button
        type="button"
        className="lottery-spin"
        onClick={onUnavailable}
        aria-label={`Tirage indisponible. Chances disponibles : ${chances}`}
        data-testid="button-lottery-spin"
      >
        <strong>TIRER</strong>
        <span>Chances : {chances}</span>
      </button>
    </div>
  );
}
