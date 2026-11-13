import { useId, type ReactNode } from 'react';

export type MetalShape = 'banner' | 'tray' | 'invite' | 'activities' | 'activity-tile' | 'support';

const paths: Record<MetalShape, string> = {
  banner: 'M5 13 12 3H88L95 13 99 50 94 87 87 97H13L5 87 1 50Z',
  tray: 'M4 7 12 2H88L96 7 99 20V80L96 93 88 98H12L4 93 1 80V20Z',
  invite: 'M1 20 10 4 36 4 43 1H88L99 15V78L94 94 75 98H9L1 85Z',
  activities: 'M7 2H93L99 12V85L92 98H8L1 86V15Z',
  'activity-tile': 'M9 2H91L99 13V84L91 98H9L1 85V14Z',
  support: 'M7 5H93L99 18V82L93 95H7L1 82V18Z',
};

export function MetalPanel({ shape, className = '', children, label }: {
  shape: MetalShape;
  className?: string;
  children: ReactNode;
  label?: string;
}) {
  const id = useId().replace(/:/g, '');
  return <div className={`ig-metal-panel ig-shape-${shape} ${className}`} aria-label={label}>
    <svg className="ig-panel-machining" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`ig-edge-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff2b7"/><stop offset=".18" stopColor="#bb8328"/><stop offset=".38" stopColor="#ffe9a0"/>
          <stop offset=".62" stopColor="#8c5e1a"/><stop offset=".81" stopColor="#f2d47c"/><stop offset="1" stopColor="#9c6c21"/>
        </linearGradient>
        <linearGradient id={`ig-face-${id}`} x1="0" y1="0" x2=".8" y2="1">
          {shape === 'tray'
            ? <><stop stopColor="#fbfcfd"/><stop offset=".5" stopColor="#e5e9ed"/><stop offset="1" stopColor="#c5cdd5"/></>
            : <><stop stopColor="#1c4569"/><stop offset=".5" stopColor="#102b4b"/><stop offset="1" stopColor="#07172e"/></>}
        </linearGradient>
        <linearGradient id={`ig-highlight-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#fff0b7" stopOpacity=".16"/><stop offset=".42" stopColor="#f4d67d" stopOpacity=".03"/><stop offset="1" stopColor="#92b8d4" stopOpacity=".1"/>
        </linearGradient>
      </defs>
      <path d={paths[shape]} transform="translate(0 2)" fill="#04101f" stroke="#061323" strokeWidth="3"/>
      <path d={paths[shape]} fill={`url(#ig-edge-${id})`} stroke="#e9cb72" strokeWidth="1.2"/>
      <path d={paths[shape]} transform="translate(0 1.25) scale(.985 .973) translate(.75 1.3)" fill={`url(#ig-face-${id})`} stroke="#fbe39a" strokeOpacity=".42" strokeWidth=".65"/>
      <path d={paths[shape]} transform="translate(0 1.25) scale(.955 .91) translate(2.35 4.6)" fill={`url(#ig-highlight-${id})`} stroke="#dce3ea" strokeOpacity=".18" strokeWidth=".45"/>
      <path d="M13 9H43M57 9h30M4 28v42M96 28v42" fill="none" stroke="#fff1b4" strokeOpacity=".28" strokeWidth=".45"/>
    </svg>
    <div className="ig-metal-panel-content">{children}</div>
  </div>;
}
