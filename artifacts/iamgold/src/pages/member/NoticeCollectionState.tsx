type NoticeCollectionStateKind = 'loading' | 'empty' | 'error';

export function NoticeCollectionState({ state, onRetry, className = '' }: {
  state: NoticeCollectionStateKind;
  onRetry?: () => void;
  className?: string;
}) {
  if (state === 'loading') {
    return <div className={`industrial-notice-state industrial-notice-loading ${className}`} role="status" aria-label="Chargement des avis" aria-busy="true">
      {[0, 1, 2].map(item => <span className="industrial-notice-skeleton" key={item}><i/><b/><small/></span>)}
    </div>;
  }
  if (state === 'empty') {
    return <div className={`industrial-notice-state industrial-notice-empty ${className}`} role="status">
      <span aria-hidden="true">—</span><p>Aucun avis de référence à afficher.</p>
    </div>;
  }
  return <div className={`industrial-notice-state industrial-notice-error ${className}`} role="alert">
    <p>Impossible d’afficher les avis.</p>
    {onRetry && <button type="button" onClick={onRetry}>Réessayer</button>}
  </div>;
}
