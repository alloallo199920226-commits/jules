import { useId, type SVGProps } from 'react';

type GlyphName = 'recharge' | 'withdrawal' | 'bullion' | 'coins' | 'success' | 'failed' | 'search' | 'calendar' | 'filter' | 'download' | 'history';
export function HistoryGlyph({ name, className, ...props }: SVGProps<SVGSVGElement> & { name: GlyphName }) {
  const metalId = `iamgold-metal-${useId().replace(/:/g, '')}`;
  const metal = `url(#${metalId})`;
  const gold = <defs><linearGradient id={metalId} x1="0" y1="0" x2="0.9" y2="1"><stop stopColor="#fff4b9"/><stop offset=".34" stopColor="#f5c64d"/><stop offset=".68" stopColor="#b57a16"/><stop offset="1" stopColor="#ffe28a"/></linearGradient></defs>;
  const stroke = name === 'success' ? '#20cf70' : name === 'failed' ? '#ef4b42' : metal;
  const common = { fill: 'none', stroke, strokeWidth: 2.1, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let mark;
  switch (name) {
    case 'coins': mark = <><ellipse cx="12" cy="18" rx="8.2" ry="3.2" fill={metal} stroke="#ffe9a1"/><path d="M3.8 14.6c0 1.8 3.7 3.3 8.2 3.3s8.2-1.5 8.2-3.3M3.8 11.2c0 1.8 3.7 3.3 8.2 3.3s8.2-1.5 8.2-3.3M3.8 11.2V18M20.2 11.2V18M3.8 8c0-1.8 3.7-3.2 8.2-3.2s8.2 1.4 8.2 3.2-3.7 3.2-8.2 3.2S3.8 9.8 3.8 8Z" {...common}/><ellipse cx="12" cy="8" rx="8.2" ry="3.2" fill={metal} stroke="#ffe9a1"/></>; break;
    case 'bullion': mark = <><path d="m3 15 3-6h12l3 6-9 5z" fill={metal} stroke="#ffe9a1"/><path d="m3 15 9 5 9-5M6 9l6 11m6-11-6 11" {...common}/></>; break;
    case 'recharge': mark = <><rect x="4" y="5" width="14" height="15" rx="2.5" {...common}/><path d="M8 12h7m-3.5-3.5V15.5M17 8l3 3-3 3" {...common}/></>; break;
    case 'withdrawal': mark = <><rect x="4" y="5" width="14" height="15" rx="2.5" {...common}/><path d="M8 13h7m-3.5-3.5V16.5M17 8l3 3-3 3" transform="rotate(180 17 11)" {...common}/></>; break;
    case 'success': mark = <><circle cx="12" cy="12" r="9" fill="#127e42" stroke="#4cdf87" strokeWidth="1.5"/><path d="m7.4 12.2 3.1 3.1 6.3-6.6" stroke="#e5ffdd" strokeWidth="2.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>; break;
    case 'failed': mark = <><circle cx="12" cy="12" r="9" fill="#922821" stroke="#ff7764" strokeWidth="1.5"/><path d="m8.5 8.5 7 7m0-7-7 7" stroke="#fff0dd" strokeWidth="2.4" strokeLinecap="round"/></>; break;
    case 'search': mark = <><circle cx="10.5" cy="10.5" r="6.1" {...common}/><path d="m15 15 5 5" {...common}/></>; break;
    case 'calendar': mark = <><rect x="3.5" y="5" width="17" height="15" rx="2" {...common}/><path d="M7.5 3.5v4M16.5 3.5v4M4 9h16M8 12.5h.1m4 0h.1m4 0h.1M8 16h.1m4 0h.1" {...common}/></>; break;
    case 'filter': mark = <><path d="M3 5h18l-7 8v5l-4 2v-7z" {...common}/></>; break;
    case 'download': mark = <><path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4" {...common}/></>; break;
    default: mark = <><circle cx="12" cy="12" r="9" {...common}/><path d="M12 7v5l3.5 2M5 4v4h4" {...common}/></>;
  }
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>{gold}{mark}</svg>;
}
