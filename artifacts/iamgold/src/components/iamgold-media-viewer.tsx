import { useEffect, useRef, useState } from 'react';
import { IndustrialIcon } from './industrial-icons';
import './iamgold-media-viewer.css';

type Props = { src: string; alt: string; onClose: () => void };

export function downloadImage(src: string, filename = 'iamgold-piece-jointe') {
  void fetch(src, { credentials: 'include' }).then(response => {
    if (!response.ok) throw new Error('Téléchargement indisponible');
    return response.blob();
  }).then(blob => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }).catch(() => window.open(src, '_blank', 'noopener,noreferrer'));
}

export default function IamgoldMediaViewer({ src, alt, onClose }: Props) {
  const [zoom, setZoom] = useState(1);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  return <div className="ig-media-viewer" role="dialog" aria-modal="true" aria-label="Aperçu de la pièce jointe" onClick={onClose}>
    <button type="button" className="ig-viewer-close" aria-label="Fermer" onClick={onClose}><IndustrialIcon name="close"/></button>
    <div className="ig-viewer-tools" onClick={event => event.stopPropagation()}>
      <button type="button" aria-label="Zoom arrière" onClick={() => setZoom(value => Math.max(.5, value - .25))}>−</button>
      <span>{Math.round(zoom * 100)}%</span>
      <button type="button" aria-label="Zoom avant" onClick={() => setZoom(value => Math.min(3, value + .25))}>+</button>
      <button type="button" aria-label="Télécharger l’image" onClick={() => downloadImage(src)}><IndustrialIcon name="download"/></button>
    </div>
    <img src={src} alt={alt} style={{ transform: `scale(${zoom})` }} onClick={event => event.stopPropagation()}/>
  </div>;
}
