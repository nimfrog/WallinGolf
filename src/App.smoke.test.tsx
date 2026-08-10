/**
 * @vitest-environment jsdom
 *
 * Runtime-röktest som renderar hela appen och kör igenom den viktigaste
 * flödet: startsida → guide (spelare + bana) → översikt → starta runda →
 * scorevy. Fångar renderingsfel som en ren typkontroll inte hittar.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe('WallinMatch – appflöde', () => {
  it('startsidan visar appnamnet och knappen Ny turnering', () => {
    render(<App />);
    const headings = screen.getAllByRole('heading');
    expect(headings.some((h) => h.textContent?.includes('WallinMatch'))).toBe(true);
    expect(screen.getByRole('button', { name: /Ny turnering/i })).toBeTruthy();
  });

  it('kör igenom guiden och startar en runda utan renderingsfel', () => {
    render(<App />);

    // Starta guiden.
    fireEvent.click(screen.getByRole('button', { name: /Ny turnering/i }));
    expect(screen.getByText(/Steg 1 · Spelare/i)).toBeTruthy();

    // Exempelspelarna är förifyllda.
    expect(screen.getByDisplayValue('Andreas')).toBeTruthy();
    expect(screen.getByDisplayValue('Martin')).toBeTruthy();

    // Vidare till bana.
    fireEvent.click(screen.getByRole('button', { name: /Nästa · Välj bana/i }));
    expect(screen.getByText(/Skapa ny bana/i)).toBeTruthy();

    // Namnge banan (9 hål med SI 1..9 är förvalt).
    fireEvent.change(screen.getByPlaceholderText(/Viksjö GK/i), {
      target: { value: 'Testbanan GK' },
    });

    // Skapa turneringen.
    fireEvent.click(screen.getByRole('button', { name: /Skapa turnering/i }));
    expect(screen.getByText(/Turneringsöversikt/i)).toBeTruthy();
    expect(screen.getAllByText(/Runda 1/i).length).toBeGreaterThan(0);

    // Starta runda 1.
    fireEvent.click(screen.getByRole('button', { name: /Starta runda 1/i }));

    // Scorevyn visar hålrubrik och spelare.
    expect(screen.getByText('Hål')).toBeTruthy();
    expect(screen.getByText('Par 4')).toBeTruthy();
    // Alla fyra spelare renderas som scorekort.
    for (const name of ['Andreas', 'Martin', 'Jessica', 'Melker']) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }

    // Bottennavigeringen finns.
    expect(screen.getByRole('button', { name: /Matcher/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Scorekort/i })).toBeTruthy();
  });

  it('sparar pågående turnering i localStorage', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Ny turnering/i }));
    fireEvent.click(screen.getByRole('button', { name: /Nästa · Välj bana/i }));
    fireEvent.change(screen.getByPlaceholderText(/Viksjö GK/i), {
      target: { value: 'Testbanan GK' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Skapa turnering/i }));

    const raw = window.localStorage.getItem('wallinmatch:v1');
    expect(raw).toBeTruthy();
    const data = JSON.parse(raw!);
    expect(data.currentTournament).toBeTruthy();
    expect(data.currentTournament.players).toHaveLength(4);
    expect(data.currentTournament.rounds).toHaveLength(3);
    expect(data.courses).toHaveLength(1);
  });

  it('byter till matcher-fliken och visar båda matcherna', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Ny turnering/i }));
    fireEvent.click(screen.getByRole('button', { name: /Nästa · Välj bana/i }));
    fireEvent.change(screen.getByPlaceholderText(/Viksjö GK/i), {
      target: { value: 'Testbanan GK' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Skapa turnering/i }));
    fireEvent.click(screen.getByRole('button', { name: /Starta runda 1/i }));

    fireEvent.click(screen.getByRole('button', { name: /Matcher/i }));
    // Två matchkort.
    expect(screen.getAllByText(/Match 1/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Match 2/i).length).toBeGreaterThan(0);
  });
});
