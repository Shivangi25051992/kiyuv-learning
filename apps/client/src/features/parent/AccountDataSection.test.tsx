import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AccountDataSection } from './AccountDataSection.js';

afterEach(() => cleanup());

function setup(over: Partial<Parameters<typeof AccountDataSection>[0]> = {}) {
  const props = {
    childCount: 2,
    onExport: vi.fn(async () => '{"ok":1}'),
    onDelete: vi.fn(async () => {}),
    onSaveFile: vi.fn(),
    ...over,
  };
  render(<AccountDataSection {...props} />);
  return props;
}

describe('download my data', () => {
  it('saves the file the server prepared', async () => {
    const p = setup();
    fireEvent.click(screen.getByRole('button', { name: /download my data/i }));
    await waitFor(() => expect(p.onSaveFile).toHaveBeenCalledWith('kiyuv-my-data.json', '{"ok":1}'));
    expect(screen.getByRole('status').textContent).toMatch(/ready/i);
  });

  it('asks for the PIN again when it has timed out', async () => {
    setup({ onExport: vi.fn(async () => { throw { code: 'functions/permission-denied' }; }) });
    fireEvent.click(screen.getByRole('button', { name: /download my data/i }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/PIN has timed out/i);
  });
});

describe('delete my account', () => {
  it('does nothing until the confirmation word is typed', async () => {
    const p = setup();
    fireEvent.click(screen.getByRole('button', { name: /delete my account/i }));
    const go = screen.getByRole('button', { name: /delete everything/i }) as HTMLButtonElement;
    expect(go.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/to confirm/i), { target: { value: 'delet' } });
    expect(go.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/to confirm/i), { target: { value: 'delete' } });
    expect(go.disabled).toBe(false);
    fireEvent.click(go);
    await waitFor(() => expect(p.onDelete).toHaveBeenCalledTimes(1));
  });

  it('can be cancelled without deleting', () => {
    const p = setup();
    fireEvent.click(screen.getByRole('button', { name: /delete my account/i }));
    fireEvent.click(screen.getByRole('button', { name: /keep my account/i }));
    expect(screen.queryByRole('button', { name: /delete everything/i })).toBeNull();
    expect(p.onDelete).not.toHaveBeenCalled();
  });

  it('says how many profiles go, and shows an error when deleting fails', async () => {
    setup({ childCount: 3, onDelete: vi.fn(async () => { throw new Error('offline'); }) });
    fireEvent.click(screen.getByRole('button', { name: /delete my account/i }));
    expect(screen.getByText(/all 3 child profiles/i)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/to confirm/i), { target: { value: 'DELETE' } });
    fireEvent.click(screen.getByRole('button', { name: /delete everything/i }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/could not delete/i);
    expect((screen.getByRole('button', { name: /delete everything/i }) as HTMLButtonElement).disabled).toBe(false);
  });
});
