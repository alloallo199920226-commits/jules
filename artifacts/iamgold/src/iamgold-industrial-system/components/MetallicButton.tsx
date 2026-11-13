import type { ButtonHTMLAttributes, ReactNode } from 'react';

type MetallicButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'gold' | 'sapphire';
};

export function MetallicButton({ children, variant = 'gold', className = '', ...props }: MetallicButtonProps) {
  return (
    <button {...props} className={`ig-metallic-button ig-metallic-button--${variant} ${className}`}>
      <span className="ig-metallic-button-face">{children}</span>
    </button>
  );
}
