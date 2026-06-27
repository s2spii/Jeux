import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../components/Toasts';
import { PetitBacGame } from './PetitBacGame';
import { useAuth } from '../../store/auth';
import { useStats } from '../../store/stats';

function renderGame() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <PetitBacGame />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('PetitBacGame integration (solo)', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuth.setState({
      user: {
        id: 'u1',
        username: 'Tester',
        isGuest: true,
        createdAt: Date.now(),
        role: 'player',
      },
      error: null,
    });
    useStats.setState({ history: [], unlocked: [], pendingUnlocks: [] });
  });

  it('plays a solo round and shows results + records a score', async () => {
    renderGame();

    // Setup screen → launch the round.
    fireEvent.click(screen.getByRole('button', { name: /Lancer la manche/i }));

    // The play screen shows the Stop button; finish the round immediately.
    const stop = await screen.findByRole('button', { name: /Stop/i });
    fireEvent.click(stop);

    // Results screen appears.
    await waitFor(() =>
      expect(screen.getByText(/Manche terminée/i)).toBeInTheDocument(),
    );

    // A history entry was recorded for the player.
    expect(useStats.getState().historyFor('u1').length).toBe(1);
    expect(useStats.getState().history[0].game).toBe('petitbac');
  });

  it('switches to local mode and configures players', () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: /👥 Local/i }));
    expect(screen.getByText(/Joueurs \(2\)/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Ajouter un joueur/i }));
    expect(screen.getByText(/Joueurs \(3\)/i)).toBeInTheDocument();
  });
});
