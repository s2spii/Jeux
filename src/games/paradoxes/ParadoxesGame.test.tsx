import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../components/Toasts';
import { ParadoxesGame } from './ParadoxesGame';
import { useAuth } from '../../store/auth';
import { useStats } from '../../store/stats';

function renderGame() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <ParadoxesGame />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('ParadoxesGame integration', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuth.setState({
      user: {
        id: 'u1',
        username: 'Joueur',
        isGuest: true,
        createdAt: Date.now(),
        role: 'player',
      },
      error: null,
    });
    useStats.setState({ history: [], unlocked: [], pendingUnlocks: [] });
  });

  it('starts a training run and registers moves on the board', () => {
    renderGame();

    // Launch the training mode (first "Jouer" button).
    fireEvent.click(screen.getAllByRole('button', { name: /^Jouer$/i })[0]);

    // Board shows the move counter at zero.
    expect(screen.getByText(/Coups 0\//)).toBeInTheDocument();

    // Apply one control; the move counter advances.
    fireEvent.click(screen.getByRole('button', { name: /Incrémenter cellule 1/i }));
    expect(screen.getByText(/Coups 1\//)).toBeInTheDocument();

    // The powers panel is present.
    expect(screen.getByText(/Pouvoirs temporaires/i)).toBeInTheDocument();
  });

  it('lets the player choose a difficulty in training', () => {
    renderGame();
    const board = screen.getByText(/Entraînement/i).closest('.card')!;
    fireEvent.click(within(board as HTMLElement).getByRole('button', { name: /^difficile$/i }));
    // Still on setup, difficulty selected (button now primary).
    expect(screen.getByText(/Choisissez un mode/i)).toBeInTheDocument();
  });
});
