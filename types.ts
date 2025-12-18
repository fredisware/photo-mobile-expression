
export enum UserRole {
  ANIMATEUR = 'ANIMATEUR',
  PARTICIPANT = 'PARTICIPANT',
  MOCKUP = 'MOCKUP',
  NONE = 'NONE'
}

export enum SessionStage {
  LOBBY = 'LOBBY',
  PRESENTATION = 'PRESENTATION',
  SILENT_PHASE = 'SILENT_PHASE',
  SELECTION_PHASE = 'SELECTION_PHASE',
  SPEAKING_TOUR = 'SPEAKING_TOUR',
  ROUND_TRANSITION = 'ROUND_TRANSITION',
  DEBATE_TOUR = 'DEBATE_TOUR',
  SYNTHESIS = 'SYNTHESIS',
  ENDED = 'ENDED'
}

export interface Photo {
  id: string;
  url: string;
  keywords: string[];
  selectedByUserId?: string;
  rotation?: number;
}

export interface PhotoFolder {
  id: string;
  name: string;
  description: string;
  cover: string;
  photos: Photo[];
}

export interface SessionTemplate {
  id: string;
  title: string;
  question: string;
  description: string;
  defaultFolderId: string;
  icon?: string;
  isSystem?: boolean;
  archived?: boolean;
  archiveDate?: string;
  archiveNotes?: string;
  enableEmotionInput?: boolean;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  status: 'waiting' | 'thinking' | 'selected' | 'speaking' | 'done';
  selectedPhotoId?: string;
  emotionWord?: string;
  selectionTimestamp?: number;
  isGuest?: boolean;
  roleLabel?: string;
}

export interface SessionState {
  code: string;
  theme: string;
  taskQuestion: string;
  enableEmotionInput: boolean;
  originTemplateId?: string;
  stage: SessionStage;
  timerSeconds: number;
  isTimerRunning: boolean;
  participants: Participant[];
  photos: Photo[];
  currentSpeakerId?: string;
  currentSubjectId?: string;
  speakingOrder?: string[];
  notes: string;
}

export interface SessionContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  session: SessionState;
  templates: SessionTemplate[];
  saveTemplate: (template: SessionTemplate) => void;
  deleteTemplate: (id: string) => void;
  toggleArchiveTemplate: (id: string) => void;
  createSession: (theme: string, question: string, photos: Photo[], enableEmotionInput: boolean, originTemplateId?: string, initialNotes?: string) => void;
  startSession: () => void;
  startSilentPhase: (durationMinutes: number) => void;
  startSelectionPhase: () => void;
  startSpeakingTour: () => void;
  startDebateTour: () => void;
  goToRoundTransition: () => void;
  setSpeaker: (participantId: string | undefined, markPreviousAsDone?: boolean) => void;
  nextSpeaker: () => void;
  endSession: () => void;
  resetSession: () => void;
  joinSession: (code: string, name: string, userId: string) => void;
  addGuestParticipant: (name: string, roleLabel?: string) => void;
  selectPhoto: (photoId: string, userId: string, emotionWord?: string) => void;
  rotatePhoto: (photoId: string) => void;
  toggleTimer: () => void;
  updateNotes: (notes: string) => void;
  removeParticipant: (userId: string) => void;
  addTime: (seconds: number) => void;
  forceRandomSelection: () => void;
}
