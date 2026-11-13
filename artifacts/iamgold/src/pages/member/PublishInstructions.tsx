import { IndustrialIcon } from '@/components/industrial-icons';
import { Modal } from './shared';

const art = `${import.meta.env.BASE_URL}iamgold-industrial-art/`;

export default function PublishInstructions({ onClose }: { onClose: () => void }) {
  return <Modal className="member-publish-dialog security-publish-modal" label="Informations sur les publications" onClose={onClose}>
    <div className="publish-dialog-art" aria-hidden="true"><img src={`${art}forum-reward-emblem.webp`} alt=""/></div>
    <p className="publish-dialog-eyebrow"><IndustrialIcon name="info" size={16}/> INFORMATION AUX MEMBRES</p>
    <h2>Partagez une preuve de retrait</h2>
    <p className="publish-dialog-copy">Ajoutez une capture de votre dernier retrait réussi à la publication. Avant l’envoi, vérifiez qu’elle ne révèle pas de données confidentielles.</p>
    <div className="publish-reference-amount">
      <span>RÉFÉRENCE AFFICHÉE</span>
      <strong>100–100 000 FCFA</strong>
      <small>Montant indicatif uniquement</small>
    </div>
    <p className="publish-dialog-caveat">Cette référence ne garantit aucune récompense. Aucun processus d’approbation ni de versement n’est configuré dans la plateforme.</p>
    <button className="publish-dialog-understood" type="button" onClick={onClose} data-testid="button-publish-consent"><IndustrialIcon name="secure" size={25}/>J’ai compris<IndustrialIcon name="arrow" size={20}/></button>
  </Modal>;
}
