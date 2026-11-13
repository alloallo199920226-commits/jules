import './member-gold-badge.css';

type MemberGoldBadgeProps = {
  size?: 22 | 24 | 26;
  className?: string;
};

export function MemberGoldBadge({ size = 24, className = '' }: MemberGoldBadgeProps) {
  return (
    <span
      className={`member-gold-badge${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Badge membre IAMGOLD"
      title="Badge membre IAMGOLD"
    >
      <img src="/iamgold-industrial-art/member-gold-badge.svg?v=2" alt="" aria-hidden="true" />
    </span>
  );
}
