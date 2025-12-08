export enum UserRole {
  ANIMATEUR = 'ANIMATEUR',
  PARTICIPANT = 'PARTICIPANT',
  NONE = 'NONE'
}

export enum SessionStage {
  LOBBY = 'LOBBY',
  PRESENTATION = 'PRESENTATION', // Theme & Question
  SILENT_PHASE = 'SILENT_PHASE', // Timer
  SELECTION_PHASE = 'SELECTION_PHASE', // Picking photos
  SPEAKING_TOUR = 'SPEAKING_TOUR', // Synthesis/Expression
  SYNTHESIS = 'SYNTHESIS', // Final notes
  ENDED = 'ENDED'
}

export interface Photo {
  id: string;
  url: string;
  keywords: string[];
  selectedByUserId?: string; // If null, available
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  status: 'waiting' | 'thinking' | 'selected' | 'speaking' | 'done';
  selectedPhotoId?: string;
}

export interface SessionState {
  code: string;
  theme: string;
  taskQuestion: string;
  stage: SessionStage;
  timerSeconds: number;
  isTimerRunning: boolean;
  participants: Participant[];
  photos: Photo[];
  currentSpeakerId?: string;
  notes: string;
}

export interface SessionContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  session: SessionState;
  // Actions
  createSession: (theme: string, question: string) => void;
  startSession: () => void;
  startSilentPhase: (durationMinutes: number) => void;
  startSelectionPhase: () => void;
  startSpeakingTour: () => void;
  nextSpeaker: () => void;
  endSession: () => void;
  joinSession: (code: string, name: string) => void;
  selectPhoto: (photoId: string) => void;
  toggleTimer: () => void;
  updateNotes: (notes: string) => void;
}
