import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';

type Props = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: 'rose' | 'lilac' | 'peach' | 'sky';
  index?: number;
  onClick: () => void;
};

export default function ActivityCard({ title, description, icon: Icon, tone, index = 0, onClick }: Props) {
  return (
    <button
      type="button"
      className={`activity-tile tone-${tone} rise`}
      style={{ '--i': index + 2 } as CSSProperties}
      onClick={onClick}
    >
      <span className="activity-icon" aria-hidden>
        <Icon size={28} strokeWidth={2.2} />
      </span>
      <span className="activity-title">{title}</span>
      <span className="activity-desc">{description}</span>
      <span className="activity-go" aria-hidden>→</span>
    </button>
  );
}
