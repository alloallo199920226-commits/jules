import type { ReactNode } from 'react';
import { Modal } from '@/pages/member/shared';

export function InvestmentModal({ children, productName, onClose }: {
  children: ReactNode;
  productName: string;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose} className="product-dialog" label={`Confirmation — ${productName}`}>
      {children}
    </Modal>
  );
}
