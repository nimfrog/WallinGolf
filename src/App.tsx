import { useState } from 'react';
import type { Screen } from './navigation';
import { AppProvider } from './state/AppContext';
import { HomeScreen } from './screens/HomeScreen';
import { NewTournamentWizard } from './screens/wizard/NewTournamentWizard';
import { OverviewScreen } from './screens/OverviewScreen';
import { RoundScreen } from './screens/round/RoundScreen';
import { RoundFinishScreen } from './screens/RoundFinishScreen';
import { FinishedScreen } from './screens/FinishedScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { HistoryDetailScreen } from './screens/HistoryDetailScreen';

function Router() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const navigate = (next: Screen) => {
    setScreen(next);
    // Scrolla till toppen vid varje skärmbyte (skyddat för miljöer utan scrollTo).
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0 });
      } catch {
        /* ignorera – saknas i vissa testmiljöer */
      }
    }
  };

  switch (screen.name) {
    case 'home':
      return <HomeScreen navigate={navigate} />;
    case 'new':
      return <NewTournamentWizard navigate={navigate} />;
    case 'overview':
      return <OverviewScreen navigate={navigate} />;
    case 'round':
      return <RoundScreen roundNumber={screen.roundNumber} navigate={navigate} />;
    case 'roundFinish':
      return <RoundFinishScreen roundNumber={screen.roundNumber} navigate={navigate} />;
    case 'finished':
      return <FinishedScreen tournamentId={screen.tournamentId} navigate={navigate} />;
    case 'history':
      return <HistoryScreen navigate={navigate} />;
    case 'historyDetail':
      return (
        <HistoryDetailScreen tournamentId={screen.tournamentId} navigate={navigate} />
      );
    default:
      return <HomeScreen navigate={navigate} />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen">
        <Router />
      </div>
    </AppProvider>
  );
}
