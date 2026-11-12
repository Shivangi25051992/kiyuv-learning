import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AboutLink } from './AboutModal.js';
import { PRIVACY_URL, TERMS_URL } from './links.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('About and credits', () => {
  it('opens, shows the sound credits and links to privacy and terms', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => 'Google Sound Library, CC BY 4.0' })));
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<AboutLink />);
    fireEvent.click(screen.getByRole('button', { name: /about, privacy and credits/i }));
    expect(await screen.findByRole('dialog', { name: /about and credits/i })).toBeTruthy();
    await waitFor(() => expect(screen.getByLabelText('Sound credits').textContent).toMatch(/CC BY 4.0/));
    expect(screen.getByText(/Noto Emoji/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /privacy policy/i }));
    fireEvent.click(screen.getByRole('button', { name: /terms of use/i }));
    await waitFor(() => expect(open).toHaveBeenCalledTimes(2));
    expect(open.mock.calls[0]![0]).toBe(PRIVACY_URL);
    expect(open.mock.calls[1]![0]).toBe(TERMS_URL);
  });

  it('still opens when the credits file cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    render(<AboutLink />);
    fireEvent.click(screen.getByRole('button', { name: /about, privacy and credits/i }));
    expect(await screen.findByText(/Fredoka and Nunito/)).toBeTruthy();
  });
});
