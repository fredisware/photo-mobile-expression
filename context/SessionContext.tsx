import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren } from 'react';
import { SessionContextType, SessionState, SessionStage, UserRole, Participant, Photo } from '../types';
import { PHOTO_FOLDERS, INITIAL_SESSION_CODE } from '../constants';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within a SessionProvider');
  return context;
};

// Start with empty list - user will add themselves via "Join" or Animateur adds guests
const INITIAL_PARTICIPANTS: Participant[] = [];

export const SessionProvider = ({ children }: PropsWithChildren) => {
  const [role, setRole] = useState<UserRole>(UserRole.NONE);
  
  const [session, setSession] = useState<SessionState>({
    code: INITIAL_SESSION_CODE,
    theme: '',
    taskQuestion: '',
    stage: SessionStage.LOBBY,
    timerSeconds: 300, // 5 mins
    isTimerRunning: false,
    participants: INITIAL_PARTICIPANTS,
    photos: PHOTO_FOLDERS[0].photos, // Default start
    notes: '',
  });

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (session.isTimerRunning && session.timerSeconds > 0) {
      interval = setInterval(() => {
        setSession(prev => ({ ...prev, timerSeconds: prev.timerSeconds - 1 }));
      }, 1000);
    } else if (session.isTimerRunning && session.timerSeconds === 0) {
       // Timer finished
       setSession(prev => ({ ...prev, isTimerRunning: false }));
       
       // If we are in selection phase and time runs out, force random selection for remaining users
       if (session.stage === SessionStage.SELECTION_PHASE) {
           forceRandomSelection();
       }
    }
    return () => clearInterval(interval);
  }, [session.isTimerRunning, session.timerSeconds, session.stage]);

  // Actions
  const createSession = (theme: string, question: string, photos: Photo[]) => {
    setSession(prev => ({ 
        ...prev, 
        theme, 
        taskQuestion: question, 
        photos: photos,
        stage: SessionStage.LOBBY 
    }));
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
    // Start with 5 minutes for selection
    setSession(prev => ({ 
      ...prev, 
      stage: SessionStage.SELECTION_PHASE, 
      timerSeconds: 300, // 5 minutes
      isTimerRunning: true 
    }));
  };

  const selectPhoto = (photoId: string, userId: string) => {
    // Check if photo is taken by someone else
    const photoTaken = session.photos.find(p => p.id === photoId)?.selectedByUserId;
    if (photoTaken && photoTaken !== userId) {
        // Only alert if manual selection (handled in UI usually, but good safeguard)
        return;
    }

    setSession(prev => {
      // Release old photo if any for this user
      const updatedPhotos = prev.photos.map(p => 
        p.selectedByUserId === userId ? { ...p, selectedByUserId: undefined } : p
      );
      
      // Select new
      const finalPhotos = updatedPhotos.map(p => 
        p.id === photoId ? { ...p, selectedByUserId: userId } : p
      );

      const updatedParticipants = prev.participants.map(p => 
        p.id === userId ? { ...p, selectedPhotoId: photoId, status: 'selected' as const } : p
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
      currentSpeakerId: firstSpeaker?.id,
      currentSubjectId: undefined, // Not used in 1st round (Subject = Speaker)
      isTimerRunning: false // Stop any timer
    }));
  };

  const startDebateTour = () => {
    // Logic: Subject is Participant 0. Speaker is Participant 1 (since 0 cannot react to 0).
    const participantsWithPhotos = session.participants.filter(p => p.selectedPhotoId);
    
    if (participantsWithPhotos.length < 2) {
        // Edge case: not enough people to debate, skip to end
        endSession();
        return;
    }

    setSession(prev => ({
      ...prev,
      stage: SessionStage.DEBATE_TOUR,
      currentSubjectId: participantsWithPhotos[0].id,
      currentSpeakerId: participantsWithPhotos[1].id,
      isTimerRunning: false
    }));
  };

  const nextSpeaker = () => {
    setSession(prev => {
       const participants = prev.participants.filter(p => p.selectedPhotoId); // Only consider active participants
       
       // --- LOGIC FOR ROUND 1 (Speaking Tour) ---
       if (prev.stage === SessionStage.SPEAKING_TOUR) {
           const currentIndex = participants.findIndex(p => p.id === prev.currentSpeakerId);
           const nextIndex = currentIndex + 1;

           if (nextIndex >= participants.length) {
               return { ...prev, stage: SessionStage.ROUND_TRANSITION, currentSpeakerId: undefined };
           }
           return { ...prev, currentSpeakerId: participants[nextIndex].id };
       }

       // --- LOGIC FOR ROUND 2 (Debate Tour: N*(N-1)) ---
       if (prev.stage === SessionStage.DEBATE_TOUR) {
           const currentSubjectIndex = participants.findIndex(p => p.id === prev.currentSubjectId);
           const currentSpeakerIndex = participants.findIndex(p => p.id === prev.currentSpeakerId);

           let nextSpeakerIndex = currentSpeakerIndex + 1;
           let nextSubjectIndex = currentSubjectIndex;

           // Find the next valid speaker/subject pair
           // Loop until we find a valid pair or finish everything
           while (true) {
               // If we exhausted speakers for this subject, move to next subject
               if (nextSpeakerIndex >= participants.length) {
                   nextSubjectIndex++;
                   nextSpeakerIndex = 0; // Reset speaker to start of list
               }

               // If we exhausted all subjects, we are done
               if (nextSubjectIndex >= participants.length) {
                   return { ...prev, stage: SessionStage.SYNTHESIS, currentSpeakerId: undefined, currentSubjectId: undefined };
               }

               // CONSTRAINT: A participant does not speak about their own photo in Round 2
               // They only react to others.
               if (participants[nextSpeakerIndex].id !== participants[nextSubjectIndex].id) {
                   // Found a valid pair!
                   return { 
                       ...prev, 
                       currentSubjectId: participants[nextSubjectIndex].id,
                       currentSpeakerId: participants[nextSpeakerIndex].id 
                   };
               }

               // If invalid (self-talk), just increment and loop again
               nextSpeakerIndex++;
           }
       }

       // Fallback
       return prev;
    });
  };

  const endSession = () => {
    setSession(prev => ({ ...prev, stage: SessionStage.ENDED })); // Manually go to synthesis if needed from transition
  };

  const resetSession = () => {
    setSession({
      code: INITIAL_SESSION_CODE,
      theme: '',
      taskQuestion: '',
      stage: SessionStage.LOBBY,
      timerSeconds: 300,
      isTimerRunning: false,
      participants: INITIAL_PARTICIPANTS,
      photos: PHOTO_FOLDERS[0].photos,
      notes: '',
    });
    // Do NOT reset role here, to keep the user as Animateur/Participant
  };

  const updateNotes = (text: string) => {
    setSession(prev => ({ ...prev, notes: text }));
  };

  const joinSession = (code: string, name: string) => {
      // Logic for simulation: Add the current user to the list if not already there
      setSession(prev => {
          if (prev.participants.some(p => p.id === 'current-user')) {
              return prev;
          }
          const newUser: Participant = {
              id: 'current-user',
              name: name,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
              status: 'waiting'
          };
          return {
              ...prev,
              participants: [...prev.participants, newUser]
          };
      });
      setRole(UserRole.PARTICIPANT);
  };

  const addGuestParticipant = (name: string) => {
      const newId = `guest-${Date.now()}`;
      const newGuest: Participant = {
          id: newId,
          name: name,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
          status: 'waiting',
          isGuest: true
      };
      setSession(prev => ({
          ...prev,
          participants: [...prev.participants, newGuest]
      }));
  };

  const removeParticipant = (userId: string) => {
      setSession(prev => {
          // If the user had a photo selected, release it
          const updatedPhotos = prev.photos.map(p => 
              p.selectedByUserId === userId ? { ...p, selectedByUserId: undefined } : p
          );
          
          return {
              ...prev,
              photos: updatedPhotos,
              participants: prev.participants.filter(p => p.id !== userId)
          };
      });
  };

  const addTime = (seconds: number) => {
      setSession(prev => ({
          ...prev,
          timerSeconds: prev.timerSeconds + seconds,
          isTimerRunning: true // Ensure it starts running if it was stopped
      }));
  };

  const forceRandomSelection = () => {
      setSession(prev => {
          let availablePhotos = prev.photos.filter(p => !p.selectedByUserId);
          const unselectedParticipants = prev.participants.filter(p => !p.selectedPhotoId);
          
          let photosUpdate = [...prev.photos];
          let participantsUpdate = [...prev.participants];

          // Shuffle available photos to ensure randomness
          availablePhotos = availablePhotos.sort(() => Math.random() - 0.5);

          unselectedParticipants.forEach((participant, index) => {
              if (index < availablePhotos.length) {
                  const photoToAssign = availablePhotos[index];
                  
                  // Update Photo
                  photosUpdate = photosUpdate.map(p => 
                      p.id === photoToAssign.id ? { ...p, selectedByUserId: participant.id } : p
                  );

                  // Update Participant
                  participantsUpdate = participantsUpdate.map(p => 
                      p.id === participant.id ? { ...p, selectedPhotoId: photoToAssign.id, status: 'selected' as const } : p
                  );
              }
          });

          // AUTO-START SESSION LOGIC
          // Find valid participants (those who now have a photo)
          const validParticipants = participantsUpdate.filter(p => p.selectedPhotoId);
          const nextStage = validParticipants.length > 0 ? SessionStage.SPEAKING_TOUR : prev.stage;
          const firstSpeakerId = validParticipants.length > 0 ? validParticipants[0].id : undefined;

          return {
              ...prev,
              photos: photosUpdate,
              participants: participantsUpdate,
              isTimerRunning: false, // Stop timer after forcing
              stage: nextStage, // Jump directly to Speaking Tour
              currentSpeakerId: firstSpeakerId,
              currentSubjectId: undefined
          };
      });
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
      startDebateTour,
      nextSpeaker,
      endSession,
      resetSession,
      joinSession,
      addGuestParticipant,
      selectPhoto,
      toggleTimer,
      updateNotes,
      removeParticipant,
      addTime,
      forceRandomSelection
    }}>
      {children}
    </SessionContext.Provider>
  );
};