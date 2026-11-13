import { ArrowLeft, IndustrialIcon, type IndustrialIconName } from '@/components/industrial-icons';

export function RoyalMasthead() {
  return (
    <section className="royal-masthead" aria-label="IAMGOLD">
      <img
        className="royal-masthead-panorama"
        src={`${import.meta.env.BASE_URL}iamgold-industrial-art/reference-crops/royal-panorama.webp`}
        alt="IAMGOLD, La plateforme AYALA — Fabrication & Raffinage d’Or"
      />
    </section>
  );
}

export function RoyalToolbar({
  title,
  onBack,
  action,
  actionLabel,
  onAction,
}: {
  title: string;
  onBack: () => void;
  action?: IndustrialIconName;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <header className="royal-toolbar">
      <button type="button" className="royal-toolbar-button royal-toolbar-back" onClick={onBack} aria-label="Retour" data-testid="button-royal-back">
        <ArrowLeft size={23} />
      </button>
      <h1>{title}</h1>
      {action && <button type="button" className="royal-toolbar-button royal-toolbar-action" onClick={onAction} aria-label={actionLabel} data-testid="button-royal-action">
        <IndustrialIcon name={action} size={24} />
      </button>}
    </header>
  );
}
