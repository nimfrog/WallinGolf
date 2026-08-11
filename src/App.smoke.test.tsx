/**
 * @vitest-environment jsdom
 *
 * Runtime-röktest som renderar hela appen och kör igenom det viktigaste
 * flödet: startsida → guide (spelare + bana) → översikt → starta runda →
 * scorevy. Fångar renderingsfel som en ren typkontroll inte hittar.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  window.localStorage.clear();
  // jsdom saknar scrollTo – stubba som no-op så navigering inte loggar brus.
  window.scrollTo = () => {};
  // Bekräfta dialoger automatiskt i testmiljön.
  window.confirm = () => true;
});

afterEach(() => {
  cleanup();
});

/** Går från startsidan till bansteget i guiden. */
function gotoCourseStep() {
  fireEvent.click(screen.getByRole('button', { name: /Ny turnering/i }));
  fireEvent.click(screen.getByRole('button', { name: /Nästa · Välj bana/i }));
}

/** Skapar en turnering med den förvalda banan (Viksjö) och startar runda 1. */
function createWithViksjoAndStartRound() {
  gotoCourseStep();
  fireEvent.click(screen.getByRole('button', { name: /Skapa turnering/i }));
  fireEvent.click(screen.getByRole('button', { name: /Starta runda 1/i }));
}

describe('WallinMatch – appflöde', () => {
  it('startsidan visar appnamnet och knappen Ny turnering', () => {
    render(<App />);
    const headings = screen.getAllByRole('heading');
    expect(headings.some((h) => h.textContent?.includes('WallinMatch'))).toBe(true);
    expect(screen.getByRole('button', { name: /Ny turnering/i })).toBeTruthy();
  });

  it('Viksjö-banan finns förvald i guiden', () => {
    render(<App />);
    gotoCourseStep();
    // Den inbyggda banan visas som sparad bana.
    expect(screen.getAllByText(/Viksjö GK 9 hål/i).length).toBeGreaterThan(0);
  });

  it('kör igenom guiden med Viksjö och startar en runda utan renderingsfel', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Ny turnering/i }));
    expect(screen.getByText(/Steg 1 · Spelare/i)).toBeTruthy();
    expect(screen.getByDisplayValue('Andreas')).toBeTruthy();
    expect(screen.getByDisplayValue('Martin')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Nästa · Välj bana/i }));
    fireEvent.click(screen.getByRole('button', { name: /Skapa turnering/i }));

    expect(screen.getByText(/Turneringsöversikt/i)).toBeTruthy();
    expect(screen.getAllByText(/Runda 1/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /Starta runda 1/i }));

    // Viksjö hål 1 har par 3.
    expect(screen.getByText('Hål')).toBeTruthy();
    expect(screen.getByText('Par 3')).toBeTruthy();
    for (const name of ['Andreas', 'Martin', 'Jessica', 'Melker']) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }

    expect(screen.getByRole('button', { name: /Matcher/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Scorekort/i })).toBeTruthy();
  });

  it('sparar pågående turnering med Viksjö-banan i localStorage', () => {
    render(<App />);
    gotoCourseStep();
    fireEvent.click(screen.getByRole('button', { name: /Skapa turnering/i }));

    const raw = window.localStorage.getItem('wallinmatch:v1');
    expect(raw).toBeTruthy();
    const data = JSON.parse(raw!);
    expect(data.currentTournament).toBeTruthy();
    expect(data.currentTournament.players).toHaveLength(4);
    expect(data.currentTournament.rounds).toHaveLength(3);
    expect(data.currentTournament.course.name).toBe('Viksjö GK 9 hål');
    expect(data.currentTournament.course.holes).toHaveLength(9);
    // Endast den inbyggda banan finns sparad.
    expect(data.courses).toHaveLength(1);
  });

  it('kan även skapa en ny egen bana i guiden', () => {
    render(<App />);
    gotoCourseStep();
    // Byt till "Skapa ny bana".
    fireEvent.click(screen.getByText(/Skapa ny bana/i));
    fireEvent.change(screen.getByPlaceholderText(/Viksjö GK/i), {
      target: { value: 'Testbanan GK' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Skapa turnering/i }));

    expect(screen.getByText(/Turneringsöversikt/i)).toBeTruthy();

    const data = JSON.parse(window.localStorage.getItem('wallinmatch:v1')!);
    expect(data.currentTournament.course.name).toBe('Testbanan GK');
    // Inbyggd Viksjö + den nya banan.
    expect(data.courses).toHaveLength(2);
  });

  it('kan ta bort en egen bana men inte den inbyggda', () => {
    render(<App />);

    // Skapa en egen bana via en turnering.
    gotoCourseStep();
    fireEvent.click(screen.getByText(/Skapa ny bana/i));
    fireEvent.change(screen.getByPlaceholderText(/Viksjö GK/i), {
      target: { value: 'Bortabanan GK' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Skapa turnering/i }));

    // localStorage har nu inbyggd + egen bana.
    let data = JSON.parse(window.localStorage.getItem('wallinmatch:v1')!);
    expect(data.courses).toHaveLength(2);

    // Starta om appen och gå in i guiden igen.
    cleanup();
    render(<App />);
    // "Ny turnering" bekräftar (stubbat) att kasta pågående och öppnar guiden.
    fireEvent.click(screen.getByRole('button', { name: /Ny turnering/i }));
    fireEvent.click(screen.getByRole('button', { name: /Nästa · Välj bana/i }));

    // Den inbyggda banan har ingen ta-bort-knapp, den egna har det.
    expect(screen.queryByLabelText(/Ta bort Viksjö GK 9 hål/i)).toBeNull();
    fireEvent.click(screen.getByLabelText(/Ta bort Bortabanan GK/i));

    data = JSON.parse(window.localStorage.getItem('wallinmatch:v1')!);
    const names = data.courses.map((c: { name: string }) => c.name);
    expect(names).toContain('Viksjö GK 9 hål');
    expect(names).not.toContain('Bortabanan GK');
  });

  it('kan välja motståndare i runda 1 och slumpa lottningen', () => {
    render(<App />);
    gotoCourseStep();
    fireEvent.click(screen.getByRole('button', { name: /Skapa turnering/i }));

    const readTournament = () =>
      JSON.parse(window.localStorage.getItem('wallinmatch:v1')!).currentTournament;

    let t = readTournament();
    const byName = Object.fromEntries(
      t.players.map((p: { id: string; name: string }) => [p.name, p.id]),
    );
    const anchorId = t.players[0].id; // Andreas

    // Välj att Andreas möter Melker i runda 1.
    fireEvent.click(screen.getByRole('button', { name: 'Melker' }));

    t = readTournament();
    const r1 = t.rounds.find((r: { roundNumber: number }) => r.roundNumber === 1);
    const anchorMatch = r1.matches.find(
      (m: { player1Id: string; player2Id: string }) =>
        m.player1Id === anchorId || m.player2Id === anchorId,
    );
    const opp =
      anchorMatch.player1Id === anchorId
        ? anchorMatch.player2Id
        : anchorMatch.player1Id;
    expect(opp).toBe(byName['Melker']);

    // Slumpa – schemat ska fortfarande ha 3 rundor och 6 unika matcher.
    fireEvent.click(screen.getByRole('button', { name: /Slumpa lottning/i }));
    t = readTournament();
    expect(t.rounds).toHaveLength(3);
    const pairs = t.rounds.flatMap((r: { matches: { player1Id: string; player2Id: string }[] }) =>
      r.matches.map((m) => [m.player1Id, m.player2Id].sort().join('-')),
    );
    expect(new Set(pairs).size).toBe(6);
  });

  it('byter till matcher-fliken och visar båda matcherna', () => {
    render(<App />);
    createWithViksjoAndStartRound();

    fireEvent.click(screen.getByRole('button', { name: /Matcher/i }));
    expect(screen.getAllByText(/Match 1/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Match 2/i).length).toBeGreaterThan(0);
  });
});
