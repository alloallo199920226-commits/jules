import { useId } from 'react';

export function IndustrialNavFrame() {
  const id = useId().replace(/:/g, '');
  return <svg className="ig-nav-machine-frame" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`ig-nav-rim-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#fff2b9"/><stop offset=".18" stopColor="#9c6b20"/><stop offset=".38" stopColor="#f8dc88"/>
        <stop offset=".67" stopColor="#795016"/><stop offset=".84" stopColor="#e9c66c"/><stop offset="1" stopColor="#825718"/>
      </linearGradient>
      <linearGradient id={`ig-nav-face-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#214d70"/><stop offset=".28" stopColor="#143653"/><stop offset="1" stopColor="#07172e"/>
      </linearGradient>
    </defs>
    <path d="M0 12 5 2H23L27 0H73L77 2H95L100 12V89L94 98H6L0 89Z" transform="translate(0 2)" fill="#020b17"/>
    <path d="M0 12 5 2H23L27 0H73L77 2H95L100 12V89L94 98H6L0 89Z" fill={`url(#ig-nav-rim-${id})`} stroke="#ffebac" strokeWidth=".7"/>
    <path d="M1.5 13 6 4H23.5L27.7 2H72.3L76.5 4H94L98.5 13V87L93 96H7L1.5 87Z" fill={`url(#ig-nav-face-${id})`} stroke="#152b40" strokeWidth=".65"/>
    <path d="M1 13 6 4H23.5L27.7 2H72.3L76.5 4H94L99 13M2 87 7 96H93L98 87" fill="none" stroke="#fff0b4" strokeOpacity=".58" strokeWidth=".7"/>
    <path d="M0 20 4 14M100 20 96 14M0 81 4 87M100 81 96 87" fill="none" stroke="#f7dc8a" strokeOpacity=".8" strokeWidth=".7"/>
  </svg>;
}

export function ActiveNavPlaque({ active }: { active: boolean }) {
  const id = useId().replace(/:/g, '');
  if (!active) return null;
  return <svg className="ig-nav-active-plaque" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`ig-nav-active-edge-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#fff6c9"/><stop offset=".3" stopColor="#bd8b2e"/><stop offset=".62" stopColor="#f4d983"/><stop offset="1" stopColor="#875b1c"/>
      </linearGradient>
      <linearGradient id={`ig-nav-active-face-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#fff0ad"/><stop offset=".28" stopColor="#d8ad4d"/><stop offset=".58" stopColor="#a87524"/><stop offset=".8" stopColor="#f2d47a"/><stop offset="1" stopColor="#95681f"/>
      </linearGradient>
    </defs>
    <path d="M8 15 20 2H80L92 15V83L80 98H20L8 83Z" transform="translate(0 1)" fill="#04101d"/>
    <path d="M8 15 20 2H80L92 15V83L80 98H20L8 83Z" fill={`url(#ig-nav-active-edge-${id})`} stroke="#fff0b1" strokeWidth="1.2"/>
    <path d="M12 17 22 6H78L88 17V81L77 94H23L12 81Z" fill={`url(#ig-nav-active-face-${id})`} stroke="#fff4c8" strokeOpacity=".8" strokeWidth=".75"/>
    <path d="M22 7H78" stroke="#fff9dd" strokeOpacity=".92" strokeWidth="1.5"/>
    <path d="M13 80 23 93H77L87 80" fill="none" stroke="#704915" strokeOpacity=".75" strokeWidth="1.8"/>
  </svg>;
}
