import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../components/Toasts';
import { EnqueteGame } from './EnqueteGame';
import { generateCase } from './engine';
import { CAMPAIGN } from './campaign';
import { useAuth } from '../../store/auth';
import { useStats } from '../../store/stats';

function renderGame() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <EnqueteGame />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('EnqueteGame integration', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuth.setState({
      user: {
        id: 'u1',
        username: 'Limier',
        isGuest: true,
        createdAt: Date.now(),
        role: 'player',
      },
      error: null,
    });
    useStats.setState({ history: [], unlocked: [], pendingUnlocks: [] });
  });

  it('solves the first campaign case by accusing the right suspect', async () => {
    // Determine the culprit deterministically from the same generator inputs.
    const first = CAMPAIGN[0];
    const expected = generateCase(first.seed, first.difficulty, first.templateId);
    const culpritName = expected.suspects[expected.solution.culprit];

    renderGame();

    // Start the first campaign case.
    fireEvent.click(screen.getAllByRole('button', { name: /Enquêter/i })[0]);

    // Board renders with the accuse action.
    const accuse = await screen.findByRole('button', { name: /Accuser/i });
    fireEvent.click(accuse);

    // The accusation modal lists suspects; pick the culprit.
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: culpritName }));

    // Verdict: case solved.
    await waitFor(() =>
      expect(screen.getByText(/Affaire résolue/i)).toBeInTheDocument(),
    );

    const entry = useStats.getState().history[0];
    expect(entry.game).toBe('enquete');
    expect(entry.meta.solved).toBe(true);
    expect(entry.score).toBeGreaterThan(0);
  });
});
