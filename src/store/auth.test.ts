import { describe, it, expect, beforeEach } from 'vitest';
import { useAuth } from './auth';

function reset() {
  useAuth.setState({ user: null, error: null });
  localStorage.clear();
}

describe('auth store', () => {
  beforeEach(reset);

  it('creates the first account as admin', async () => {
    const ok = await useAuth.getState().signUp('Sherlock', 'secret123');
    expect(ok).toBe(true);
    expect(useAuth.getState().user?.role).toBe('admin');
    expect(useAuth.getState().user?.isGuest).toBe(false);
  });

  it('rejects duplicate usernames', async () => {
    await useAuth.getState().signUp('Watson', 'secret123');
    useAuth.getState().signOut();
    const ok = await useAuth.getState().signUp('watson', 'other123');
    expect(ok).toBe(false);
    expect(useAuth.getState().error).toMatch(/déjà pris/i);
  });

  it('validates weak passwords', async () => {
    const ok = await useAuth.getState().signUp('Lestrade', '123');
    expect(ok).toBe(false);
  });

  it('signs in with correct credentials and rejects wrong ones', async () => {
    await useAuth.getState().signUp('Mycroft', 'diogenes');
    useAuth.getState().signOut();
    expect(useAuth.getState().user).toBeNull();

    const bad = await useAuth.getState().signIn('Mycroft', 'wrong');
    expect(bad).toBe(false);

    const good = await useAuth.getState().signIn('Mycroft', 'diogenes');
    expect(good).toBe(true);
    expect(useAuth.getState().user?.username).toBe('Mycroft');
  });

  it('creates a transient guest', () => {
    useAuth.getState().playAsGuest('Anon');
    const u = useAuth.getState().user;
    expect(u?.isGuest).toBe(true);
    expect(u?.username).toMatch(/^Anon-/);
  });
});
