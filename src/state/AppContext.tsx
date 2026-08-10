import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppData,
  Course,
  Player,
  PlayerId,
  Round,
  Tournament,
} from '../types';
import { loadAppData, saveAppData } from '../storage/storage';
import { createId } from '../lib/id';
import { generateRoundRobinSchedule } from '../logic/schedule';
import { createInitialScores, isRoundFullyScored, playerIdsInRound } from '../logic/rounds';

interface AppContextValue {
  data: AppData;
  currentTournament: Tournament | null;
  history: Tournament[];
  courses: Course[];

  createTournament: (players: Player[], course: Course) => Tournament;
  discardCurrentTournament: () => void;
  upsertCourse: (course: Course) => void;

  startRound: (roundNumber: number) => void;
  setScore: (
    roundNumber: number,
    holeNumber: number,
    playerId: PlayerId,
    grossScore: number | null,
  ) => void;
  ensureHoleDefaults: (roundNumber: number, holeNumber: number) => void;
  /** Avslutar en runda. Returnerar den avslutade turneringen om alla tre rundor är klara. */
  completeRound: (roundNumber: number) => Tournament | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadAppData());

  // Spara efter varje ändring.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    saveAppData(data);
  }, [data]);

  const updateCurrent = useCallback(
    (updater: (t: Tournament) => Tournament) => {
      setData((prev) => {
        if (!prev.currentTournament) return prev;
        return { ...prev, currentTournament: updater(prev.currentTournament) };
      });
    },
    [],
  );

  const createTournament = useCallback((players: Player[], course: Course): Tournament => {
    const schedule = generateRoundRobinSchedule(players.map((p) => p.id));
    const rounds: Round[] = schedule.map((sched) => ({
      roundNumber: sched.roundNumber,
      matches: sched.matches.map((m) => ({
        id: createId('match'),
        player1Id: m.player1Id,
        player2Id: m.player2Id,
      })),
      scores: [],
      status: 'not_started',
    }));

    const tournament: Tournament = {
      id: createId('tour'),
      createdAt: new Date().toISOString(),
      players,
      course,
      rounds,
      status: 'active',
    };

    setData((prev) => {
      // Spara banan för återanvändning om den inte redan finns.
      const courseExists = prev.courses.some((c) => c.id === course.id);
      return {
        ...prev,
        currentTournament: tournament,
        courses: courseExists ? prev.courses : [...prev.courses, course],
      };
    });

    return tournament;
  }, []);

  const discardCurrentTournament = useCallback(() => {
    setData((prev) => ({ ...prev, currentTournament: null }));
  }, []);

  const upsertCourse = useCallback((course: Course) => {
    setData((prev) => {
      const exists = prev.courses.some((c) => c.id === course.id);
      return {
        ...prev,
        courses: exists
          ? prev.courses.map((c) => (c.id === course.id ? course : c))
          : [...prev.courses, course],
      };
    });
  }, []);

  const startRound = useCallback(
    (roundNumber: number) => {
      updateCurrent((t) => {
        // Endast en aktiv runda åt gången.
        const hasActive = t.rounds.some(
          (r) => r.status === 'in_progress' && r.roundNumber !== roundNumber,
        );
        if (hasActive) return t;

        return {
          ...t,
          rounds: t.rounds.map((r) => {
            if (r.roundNumber !== roundNumber) return r;
            if (r.status === 'completed') return r;
            const ids = playerIdsInRound(r);
            const scores =
              r.scores.length > 0 ? r.scores : createInitialScores(ids, t.course);
            return { ...r, status: 'in_progress', scores };
          }),
        };
      });
    },
    [updateCurrent],
  );

  const setScore = useCallback(
    (
      roundNumber: number,
      holeNumber: number,
      playerId: PlayerId,
      grossScore: number | null,
    ) => {
      updateCurrent((t) => ({
        ...t,
        rounds: t.rounds.map((r) => {
          if (r.roundNumber !== roundNumber) return r;
          let found = false;
          const scores = r.scores.map((s) => {
            if (s.holeNumber === holeNumber && s.playerId === playerId) {
              found = true;
              return { ...s, grossScore };
            }
            return s;
          });
          if (!found) scores.push({ holeNumber, playerId, grossScore });
          return { ...r, scores };
        }),
      }));
    },
    [updateCurrent],
  );

  const ensureHoleDefaults = useCallback(
    (roundNumber: number, holeNumber: number) => {
      updateCurrent((t) => {
        const round = t.rounds.find((r) => r.roundNumber === roundNumber);
        if (!round) return t;
        const hole = t.course.holes.find((h) => h.number === holeNumber);
        if (!hole) return t;
        const ids = playerIdsInRound(round);

        let changed = false;
        const scores = [...round.scores];
        for (const id of ids) {
          const existing = scores.find(
            (s) => s.holeNumber === holeNumber && s.playerId === id,
          );
          if (!existing) {
            scores.push({ holeNumber, playerId: id, grossScore: hole.par });
            changed = true;
          } else if (existing.grossScore == null) {
            const idx = scores.indexOf(existing);
            scores[idx] = { ...existing, grossScore: hole.par };
            changed = true;
          }
        }
        if (!changed) return t;

        return {
          ...t,
          rounds: t.rounds.map((r) =>
            r.roundNumber === roundNumber ? { ...r, scores } : r,
          ),
        };
      });
    },
    [updateCurrent],
  );

  const completeRound = useCallback(
    (roundNumber: number): Tournament | null => {
      let finished: Tournament | null = null;

      setData((prev) => {
        const t = prev.currentTournament;
        if (!t) return prev;

        const round = t.rounds.find((r) => r.roundNumber === roundNumber);
        if (!round || !isRoundFullyScored(round, t.course)) return prev;

        const rounds = t.rounds.map((r) =>
          r.roundNumber === roundNumber
            ? ({ ...r, status: 'completed' } as Round)
            : r,
        );
        const allCompleted = rounds.every((r) => r.status === 'completed');

        const updated: Tournament = {
          ...t,
          rounds,
          status: allCompleted ? 'finished' : 'active',
        };

        if (allCompleted) {
          finished = updated;
          return {
            ...prev,
            currentTournament: null,
            history: [updated, ...prev.history],
          };
        }

        return { ...prev, currentTournament: updated };
      });

      return finished;
    },
    [],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      currentTournament: data.currentTournament,
      history: data.history,
      courses: data.courses,
      createTournament,
      discardCurrentTournament,
      upsertCourse,
      startRound,
      setScore,
      ensureHoleDefaults,
      completeRound,
    }),
    [
      data,
      createTournament,
      discardCurrentTournament,
      upsertCourse,
      startRound,
      setScore,
      ensureHoleDefaults,
      completeRound,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp måste användas inom AppProvider');
  return ctx;
}
