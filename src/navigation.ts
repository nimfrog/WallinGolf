/** Enkel skärm-baserad navigation utan router-beroende. */
export type Screen =
  | { name: 'home' }
  | { name: 'new' }
  | { name: 'overview' }
  | { name: 'round'; roundNumber: number }
  | { name: 'roundFinish'; roundNumber: number }
  | { name: 'finished'; tournamentId: string }
  | { name: 'history' }
  | { name: 'historyDetail'; tournamentId: string };

export type NavigateFn = (screen: Screen) => void;
