import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SessionContextType, SessionState, SessionStage, UserRole, Participant } from '../types';
import { MOCK_PHOTOS, INITIAL_SESSION_CODE } from '../constants';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within a SessionProvider');
  return context;
};

const INITIAL_PARTICIPANTS: Participant[] = [
  { id: 'user-1', name: 'Alice', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', status: 'waiting' },
  { id: 'user-2', name: 'Bob', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', status: 'waiting' },
  { id: 'current-user', name: 'Moi (Participant)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Me', status: 'waiting' },
];

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole>(UserRole.NONE);
  
  const [session, setSession] = useState<SessionState>({
    code: INITIAL_SESSION_CODE,
    theme: '',
    taskQuestion: '',
    stage: SessionStage.LOBBY,
    timerSeconds: 300, // 5 mins
    isTimerRunning: false,
    participants: INITIAL_PARTICIPANTS,
    photos: MOCK_PHOTOS,
    notes: '',
  });

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (session.isTimerRunning && session.timerSeconds > 0) {
      interval = setInterval(() => {
        setSession(prev => ({ ...prev, timerSeconds: prev.timerSeconds - 1 }));
      }, 1000);
    } else if (session.timerSeconds === 0) {
       setSession(prev => ({ ...prev, isTimerRunning: false }));
    }
    return () => clearInterval(interval);
  }, [session.isTimerRunning, session.timerSeconds]);

  // Actions
  const createSession = (theme: string, question: string) => {
    setSession(prev => ({ ...prev, theme, taskQuestion: question, stage: SessionStage.LOBBY }));
  };

  const startSession = () => {
    setSession(prev => ({ ...prev, stage: SessionStage.PRESENTATION }));
  };

  const startSilentPhase = (durationMinutes: number) => {
    setSession(prev => ({ 
      ...prev, 
      stage: SessionStage.SILENT_PHASE, 
      timerSeconds: durationMinutes * 60,
      isTimerRunning: true,
      participants: prev.participants.map(p => ({...p, status: 'thinking'}))
    }));
  };

  const toggleTimer = () => {
     setSession(prev => ({ ...prev, isTimerRunning: !prev.isTimerRunning }));
  };

  const startSelectionPhase = () => {
    setSession(prev => ({ 
      ...prev, 
      stage: SessionStage.SELECTION_PHASE, 
      isTimerRunning: false 
    }));
  };

  const selectPhoto = (photoId: string) => {
    // Current user logic (simulated for the demo)
    const currentUserId = 'current-user';
    
    // Check if photo is taken
    const photoTaken = session.photos.find(p => p.id === photoId)?.selectedByUserId;
    if (photoTaken && photoTaken !== currentUserId) {
        alert("Cette photo a déjà été choisie. Veuillez en choisir une autre.");
        return;
    }

    setSession(prev => {
      // Release old photo if any
      const updatedPhotos = prev.photos.map(p => 
        p.selectedByUserId === currentUserId ? { ...p, selectedByUserId: undefined } : p
      );
      
      // Select new
      const finalPhotos = updatedPhotos.map(p => 
        p.id === photoId ? { ...p, selectedByUserId: currentUserId } : p
      );

      const updatedParticipants = prev.participants.map(p => 
        p.id === currentUserId ? { ...p, selectedPhotoId: photoId, status: 'selected' as const } : p
      );

      return { ...prev, photos: finalPhotos, participants: updatedParticipants };
    });
  };

  const startSpeakingTour = () => {
    // Find first participant with a photo
    const firstSpeaker = session.participants.find(p => p.selectedPhotoId);
    setSession(prev => ({
      ...prev,
      stage: SessionStage.SPEAKING_TOUR,
      currentSpeakerId: firstSpeaker?.id
    }));
  };

  const nextSpeaker = () => {
    setSession(prev => {
       const currentIndex = prev.participants.findIndex(p => p.id === prev.currentSpeakerId);
       let nextIndex = currentIndex + 1;
       
       // Find next person with a photo
       while(nextIndex < prev.participants.length && !prev.participants[nextIndex].selectedPhotoId) {
           nextIndex++;
       }

       if (nextIndex >= prev.participants.length) {
           return { ...prev, stage: SessionStage.SYNTHESIS, currentSpeakerId: undefined };
       }
       
       return { ...prev, currentSpeakerId: prev.participants[nextIndex].id };
    });
  };

  const endSession = () => {
    setSession(prev => ({ ...prev, stage: SessionStage.ENDED }));
  };

  const updateNotes = (text: string) => {
    setSession(prev => ({ ...prev, notes: text }));
  };

  const joinSession = (code: string, name: string) => {
      // Simulation: Just set role to participant
      setRole(UserRole.PARTICIPANT);
  };

  return (
    <SessionContext.Provider value={{
      role,
      setRole,
      session,
      createSession,
      startSession,
      startSilentPhase,
      startSelectionPhase,
      startSpeakingTour,
      nextSpeaker,
      endSession,
      joinSession,
      selectPhoto,
      toggleTimer,
      updateNotes
    }}>
      {children}
    </SessionContext.Provider>
  );
};