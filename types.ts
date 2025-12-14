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
  ROUND_TRANSITION = 'ROUND_TRANSITION', // Intermission between rounds
  DEBATE_TOUR = 'DEBATE_TOUR', // Second round: Feedback/Group discussion
  SYNTHESIS = 'SYNTHESIS', // Final notes
  ENDED = 'ENDED'
}

export interface Photo {
  id: string;
  url: string;
  keywords: string[];
  selectedByUserId?: string; // If null, available
}

export interface PhotoFolder {
  id: string;
  name: string;
  description: string;
  cover: string;
  photos: Photo[];
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  status: 'waiting' | 'thinking' | 'selected' | 'speaking' | 'done';
  selectedPhotoId?: string;
  selectionTimestamp?: number; // To track who picked first
  isGuest?: boolean; // True if the user has no phone and is managed by Animateur
  roleLabel?: string; // e.g. "Animateur"
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
  currentSpeakerId?: string; // The person talking
  currentSubjectId?: string; // The person whose photo is being discussed (Debate Tour)
  speakingOrder?: string[]; // Array of IDs defining the turn order based on selection time
  notes: string;
}

export interface SessionContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  session: SessionState;
  // Actions
  createSession: (theme: string, question: string, photos: Photo[]) => void;
  startSession: () => void;
  startSilentPhase: (durationMinutes: number) => void;
  startSelectionPhase: () => void;
  startSpeakingTour: () => void;
  startDebateTour: () => void;
  nextSpeaker: () => void;
  endSession: () => void;
  resetSession: () => void; // Completely reset app
  joinSession: (code: string, name: string, userId: string) => void;
  addGuestParticipant: (name: string, roleLabel?: string) => void;
  selectPhoto: (photoId: string, userId: string) => void;
  toggleTimer: () => void;
  updateNotes: (notes: string) => void;
  // New Moderation & Timer features
  removeParticipant: (userId: string) => void;
  addTime: (seconds: number) => void;
  forceRandomSelection: () => void;
}