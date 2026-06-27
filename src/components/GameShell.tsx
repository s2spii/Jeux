import { useState, type ReactNode, type PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import { Button, Modal } from './ui';

/**
 * Common chrome around every game: title bar, a "Rules" button reachable at
 * any time, an optional HUD slot, and a quit-to-menu action. Keeps the three
 * games visually consistent and satisfies the "règles consultables à tout
 * moment" UX requirement.
 */
export function GameShell({
  title,
  emoji,
  rules,
  hud,
  toolbar,
  children,
}: PropsWithChildren<{
  title: string;
  emoji: string;
  rules: ReactNode;
  hud?: ReactNode;
  toolbar?: ReactNode;
}>) {
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="stack">
      <div className="row-between">
        <h1 style={{ margin: 0, fontSize: '1.6rem' }}>
          <span aria-hidden="true">{emoji} </span>
          {title}
        </h1>
        <div className="row" style={{ gap: 8 }}>
          {toolbar}
          <Button variant="ghost" size="sm" onClick={() => setShowRules(true)}>
            📖 Règles
          </Button>
          <Link to="/jeux" className="btn btn-ghost btn-sm">
            ✕ Quitter
          </Link>
        </div>
      </div>

      {hud}

      <div>{children}</div>

      <Modal open={showRules} onClose={() => setShowRules(false)} title={`Règles — ${title}`}>
        <div className="stack">{rules}</div>
      </Modal>
    </div>
  );
}
