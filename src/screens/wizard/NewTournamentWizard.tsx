import { useMemo, useState } from 'react';
import type { NavigateFn } from '../../navigation';
import type { Player } from '../../types';
import { useApp } from '../../state/AppContext';
import { ScreenShell } from '../../ui/ScreenShell';
import { Button, ErrorBanner } from '../../ui/components';
import { PlayersStep } from './PlayersStep';
import { CourseStep } from './CourseStep';
import {
  createSamplePlayerDrafts,
  DEFAULT_PAR,
  type PlayerDraft,
} from '../../data/sampleData';
import { createId } from '../../lib/id';
import { parseHandicap } from '../../lib/format';
import {
  buildCourse,
  validateCourse,
  validatePlayers,
  type HoleDraftInput,
} from '../../logic/validation';

function makeHoleDrafts(count: number, previous: HoleDraftInput[]): HoleDraftInput[] {
  return Array.from({ length: count }, (_, i) => {
    const number = i + 1;
    const prev = previous.find((h) => h.number === number);
    return (
      prev ?? {
        number,
        par: String(DEFAULT_PAR),
        strokeIndex: String(number),
      }
    );
  });
}

export function NewTournamentWizard({ navigate }: { navigate: NavigateFn }) {
  const { courses, createTournament } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [errors, setErrors] = useState<string[]>([]);

  const [drafts, setDrafts] = useState<PlayerDraft[]>(() => createSamplePlayerDrafts());

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    courses.length > 0 ? courses[0].id : null,
  );
  const [courseName, setCourseName] = useState('');
  const [holeCount, setHoleCount] = useState(9);
  const [holeDrafts, setHoleDrafts] = useState<HoleDraftInput[]>(() =>
    makeHoleDrafts(9, []),
  );

  const stepTitle = step === 1 ? 'Steg 1 · Spelare' : 'Steg 2 · Bana';

  const updateDraft = (index: number, patch: Partial<PlayerDraft>) =>
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));

  const updateHole = (index: number, patch: Partial<HoleDraftInput>) =>
    setHoleDrafts((prev) => prev.map((h, i) => (i === index ? { ...h, ...patch } : h)));

  const changeHoleCount = (count: number) => {
    setHoleCount(count);
    setHoleDrafts((prev) => makeHoleDrafts(count, prev));
  };

  const players: Player[] = useMemo(
    () =>
      drafts.map((d) => ({
        id: createId('player'),
        name: d.name.trim(),
        exactHandicap: parseHandicap(d.exactHandicap) ?? 0,
        playingHandicap: Math.round(parseHandicap(d.playingHandicap) ?? 0),
        tee: d.tee,
      })),
    [drafts],
  );

  const goToCourse = () => {
    const errs = validatePlayers(drafts);
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    setStep(2);
  };

  const finish = () => {
    let course;
    if (selectedCourseId) {
      course = courses.find((c) => c.id === selectedCourseId);
      if (!course) {
        setErrors(['Den valda banan kunde inte hittas.']);
        return;
      }
    } else {
      const errs = validateCourse(courseName, holeCount, holeDrafts);
      if (errs.length > 0) {
        setErrors(errs);
        return;
      }
      course = buildCourse(createId('course'), courseName, holeDrafts);
    }
    setErrors([]);
    createTournament(players, course);
    navigate({ name: 'overview' });
  };

  return (
    <ScreenShell
      title={stepTitle}
      subtitle="Ny turnering"
      onBack={() => (step === 1 ? navigate({ name: 'home' }) : setStep(1))}
      bottomInset
    >
      <div className="space-y-4">
        {/* Stegindikator */}
        <div className="flex gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={[
                'h-1.5 flex-1 rounded-full',
                s <= step ? 'bg-fairway-600' : 'bg-fairway-200',
              ].join(' ')}
            />
          ))}
        </div>

        <ErrorBanner messages={errors} />

        {step === 1 ? (
          <PlayersStep drafts={drafts} onChange={updateDraft} />
        ) : (
          <CourseStep
            savedCourses={courses}
            selectedCourseId={selectedCourseId}
            onSelectCourse={setSelectedCourseId}
            name={courseName}
            onNameChange={setCourseName}
            holeCount={holeCount}
            onHoleCountChange={changeHoleCount}
            holes={holeDrafts}
            onHoleChange={updateHole}
          />
        )}
      </div>

      {/* Fast nedre åtgärdsknapp */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-fairway-100 bg-white/90 backdrop-blur">
        <div className="mx-auto w-full max-w-lg px-4 py-3">
          {step === 1 ? (
            <Button onClick={goToCourse}>Nästa · Välj bana</Button>
          ) : (
            <Button onClick={finish}>Skapa turnering</Button>
          )}
        </div>
      </div>
    </ScreenShell>
  );
}
