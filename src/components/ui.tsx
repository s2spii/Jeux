import {
  type ButtonHTMLAttributes,
  type ReactNode,
  type PropsWithChildren,
  useEffect,
} from 'react';

type Variant = 'default' | 'primary' | 'accent' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

export function Button({
  variant = 'default',
  size = 'md',
  block,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const variantClass = variant === 'default' ? '' : `btn-${variant}`;
  const sizeClass = size === 'md' ? '' : `btn-${size}`;
  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${block ? 'btn-block' : ''} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = '',
  hover,
  as: As = 'div',
  ...rest
}: PropsWithChildren<{
  className?: string;
  hover?: boolean;
  as?: 'div' | 'article' | 'section';
  [k: string]: unknown;
}>) {
  return (
    <As className={`card ${hover ? 'card-hover' : ''} ${className}`.trim()} {...rest}>
      {children}
    </As>
  );
}

export function Badge({
  children,
  tone = 'default',
}: PropsWithChildren<{ tone?: 'default' | 'success' | 'danger' | 'accent' | 'brand' }>) {
  const cls = tone === 'default' ? '' : `badge-${tone}`;
  return <span className={`badge ${cls}`.trim()}>{children}</span>;
}

export function StatTile({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="stat-tile">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  id?: string;
}) {
  return (
    <label className="switch" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch-track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

export function Progress({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  closeLabel = 'Fermer',
}: PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title?: string;
  closeLabel?: string;
}>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>{title}</h2>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label={closeLabel}>
              ✕
            </Button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon = '🗒️', title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <div className="card center" style={{ padding: 40 }}>
      <div style={{ fontSize: '2.4rem', marginBottom: 8 }}>{icon}</div>
      <h3>{title}</h3>
      {hint && <p className="muted">{hint}</p>}
    </div>
  );
}
