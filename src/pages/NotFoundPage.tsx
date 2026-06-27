import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="center stack" style={{ padding: '60px 0' }}>
      <div style={{ fontSize: '4rem' }}>🔍</div>
      <h1>404 — Page introuvable</h1>
      <p className="muted">Cette piste ne mène nulle part.</p>
      <Link to="/" className="btn btn-primary">
        Retour à l'accueil
      </Link>
    </div>
  );
}
