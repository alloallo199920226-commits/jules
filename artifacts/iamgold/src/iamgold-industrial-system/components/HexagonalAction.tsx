import { useId } from 'react';
import { IndustrialIcon, type IndustrialIconName } from '../icons';
import { IndustrialArtwork, type IndustrialArtworkName } from '../icons/IndustrialArtwork';

export function HexagonalAction({ label, icon, artwork, onClick, testId }: {
  label: string;
  icon: IndustrialIconName;
  artwork?: IndustrialArtworkName;
  onClick: () => void;
  testId: string;
}) {
  const id = useId().replace(/:/g, '');
  return <button type="button" className="ig-hex-action" aria-label={label} onClick={onClick} data-testid={testId}>
    <svg className="ig-hex-action-frame" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`ig-hex-gold-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff2b8"/><stop offset=".2" stopColor="#c68d2e"/><stop offset=".43" stopColor="#fff0a8"/>
          <stop offset=".67" stopColor="#95631c"/><stop offset=".86" stopColor="#f1d47b"/><stop offset="1" stopColor="#754d15"/>
        </linearGradient>
        <linearGradient id={`ig-hex-face-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#2a5878"/><stop offset=".46" stopColor="#123858"/><stop offset="1" stopColor="#07172e"/>
        </linearGradient>
        <linearGradient id={`ig-hex-glint-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#fff8d8" stopOpacity=".8"/><stop offset="1" stopColor="#fff8d8" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d="M50 1 95 25v50L50 99 5 75V25Z" transform="translate(0 1)" fill="#04101f" stroke="#020b15" strokeWidth="4"/>
      <path d="M50 1 95 25v50L50 99 5 75V25Z" fill={`url(#ig-hex-gold-${id})`} stroke="#ffe9a1" strokeWidth="1.2"/>
      <path d="M50 5 91 27v46L50 95 9 73V27Z" fill="#9a6c21" stroke="#4d3817" strokeWidth=".8"/>
      <path d="M50 8 87 29v42L50 92 13 71V29Z" fill={`url(#ig-hex-face-${id})`} stroke="#e7cb78" strokeWidth=".8"/>
      <path d="m16 29 34-19 34 19" fill="none" stroke={`url(#ig-hex-glint-${id})`} strokeWidth="1.5"/>
      <path d="m12 70 38 22 38-22" fill="none" stroke="#071321" strokeOpacity=".75" strokeWidth="2"/>
    </svg>
    <span className="ig-hex-action-art" aria-hidden="true">{artwork ? <IndustrialArtwork name={artwork}/> : <IndustrialIcon name={icon} size={47}/>}</span>
    <span className="ig-hex-action-label">{label}</span>
  </button>;
}
