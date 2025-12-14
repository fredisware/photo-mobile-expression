import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren, useRef } from 'react';
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

  // --- BROADCAST CHANNEL FOR LOCAL MULTI-TAB TESTING ---
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isRemoteUpdate = useRef(false);
  const sessionRef = useRef(session); // Keep track of latest session for callbacks

  // Update ref whenever session changes so the listener has access to current state
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    // Create a channel for local synchronization
    channelRef.current = new BroadcastChannel('photo_expression_sync');

    channelRef.current.onmessage = (event) => {
      // 1. Handshake: A new tab asks "REQUEST_SYNC"
      if (event.data === 'REQUEST_SYNC') {
          // If we have a running session (theme is set), we share our state with the new tab
          if (sessionRef.current.theme) {
              channelRef.current?.postMessage(sessionRef.current);
          }
          return;
      }

      // 2. State Update: We received a session object
      if (event.data && typeof event.data === 'object' && 'stage' in event.data) {
          isRemoteUpdate.current = true;
          setSession(event.data);
      }
    };

    // When we open a new tab, ask existing tabs for the current state
    channelRef.current.postMessage('REQUEST_SYNC');

    return () => {
      channelRef.current?.close();
    };
  }, []);

  useEffect(() => {
    // Broadcast state changes to other tabs, BUT only if the change 
    // didn't come from a remote update (to avoid infinite loops)
    if (!isRemoteUpdate.current && channelRef.current) {
      channelRef.current.postMessage(session);
    }
    // Reset flag for next update
    isRemoteUpdate.current = false;
  }, [session]);
  // ----------------------------------------------------

  // Timer Effect
  useEffect(() => {
    let interval: any;
    // Only the Animateur (or if no role is set yet/testing) drives the timer to avoid conflict/double speed
    const shouldDriveTimer = role === UserRole.ANIMATEUR || role === UserRole.NONE;

    if (session.isTimerRunning && session.timerSeconds > 0 && shouldDriveTimer) {
      interval = setInterval(() => {
        setSession(prev => ({ ...prev, timerSeconds: prev.timerSeconds - 1 }));
      }, 1000);
    } else if (session.isTimerRunning && session.timerSeconds === 0 && shouldDriveTimer) {
       // Timer finished
       setSession(prev => ({ ...prev, isTimerRunning: false }));
       
       // If we are in selection phase and time runs out, force random selection for remaining users
       if (session.stage === SessionStage.SELECTION_PHASE) {
           forceRandomSelection();
       }
    }
    return () => clearInterval(interval);
  }, [session.isTimerRunning, session.timerSeconds, session.stage, role]);

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
      // Deprecated/Removed feature, redirects to selection now if called, or could be empty.
      // Keeping stub just in case but app logic shouldn't call it.
      startSelectionPhase();
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

      const timestamp = Date.now();

      const updatedParticipants = prev.participants.map(p => 
        p.id === userId ? { ...p, selectedPhotoId: photoId, status: 'selected' as const, selectionTimestamp: timestamp } : p
      );

      return { ...prev, photos: finalPhotos, participants: updatedParticipants };
    });
  };

  const startSpeakingTour = () => {
    // Logic: Sort participants by selectionTimestamp to determine speaking order
    const participantsWithPhotos = session.participants.filter(p => p.selectedPhotoId);
    
    // Sort ascending (earliest timestamp first)
    const sortedParticipants = participantsWithPhotos.sort((a, b) => 
        (a.selectionTimestamp || Infinity) - (b.selectionTimestamp || Infinity)
    );
    
    const speakingOrder = sortedParticipants.map(p => p.id);
    const firstSpeakerId = speakingOrder.length > 0 ? speakingOrder[0] : undefined;

    setSession(prev => ({
      ...prev,
      stage: SessionStage.SPEAKING_TOUR,
      speakingOrder: speakingOrder,
      currentSpeakerId: firstSpeakerId,
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
           // Use the determined speaking order if available, otherwise fallback to list order
           const order = prev.speakingOrder || participants.map(p => p.id);
           
           const currentIndex = order.indexOf(prev.currentSpeakerId || '');
           const nextIndex = currentIndex + 1;

           if (nextIndex >= order.length) {
               return { ...prev, stage: SessionStage.ROUND_TRANSITION, currentSpeakerId: undefined };
           }
           return { ...prev, currentSpeakerId: order[nextIndex] };
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
  };

  const updateNotes = (text: string) => {
    setSession(prev => ({ ...prev, notes: text }));
  };

  const joinSession = (code: string, name: string, userId: string) => {
      // Logic for simulation: Add the current user to the list if not already there
      setSession(prev => {
          if (prev.participants.some(p => p.id === userId)) {
              return prev;
          }
          const newUser: Participant = {
              id: userId,
              name: name,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
              status: 'waiting'
          };
          return {
              ...prev,
              participants: [...prev.participants, newUser]
          };
      });
      setRole(UserRole.PARTICIPANT);
  };

  const addGuestParticipant = (name: string, roleLabel?: string) => {
      const newId = `guest-${Date.now()}`;
      const newGuest: Participant = {
          id: newId,
          name: name,
          // Use avataaars for guests/animateur to match participants' style (nice icons)
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
          status: 'waiting',
          isGuest: true,
          roleLabel: roleLabel
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
          // 1. Identify unselected participants
          const unselectedParticipants = prev.participants.filter(p => !p.selectedPhotoId);
          
          // 2. Identify available photos
          let availablePhotos = prev.photos.filter(p => !p.selectedByUserId);
          // Shuffle photos to be random
          availablePhotos = availablePhotos.sort(() => Math.random() - 0.5);

          // 3. Clone state for robust mutation
          const newPhotos = [...prev.photos];
          const newParticipants = prev.participants.map(p => ({...p}));
          const timestamp = Date.now();

          // 4. Assign photos
          unselectedParticipants.forEach((participant, index) => {
              if (index < availablePhotos.length) {
                  const photo = availablePhotos[index];
                  
                  // Mark photo as taken in newPhotos array
                  const photoIndex = newPhotos.findIndex(p => p.id === photo.id);
                  if (photoIndex !== -1) {
                      newPhotos[photoIndex] = { ...newPhotos[photoIndex], selectedByUserId: participant.id };
                  }

                  // Assign to participant in newParticipants array
                  const partIndex = newParticipants.findIndex(p => p.id === participant.id);
                  if (partIndex !== -1) {
                      newParticipants[partIndex] = {
                          ...newParticipants[partIndex],
                          selectedPhotoId: photo.id,
                          status: 'selected',
                          selectionTimestamp: timestamp // Give them a timestamp so they appear in order (late)
                      };
                  }
              }
          });

          // 5. Determine next state
          // Get all participants who now have a photo (including those we just assigned)
          const validParticipants = newParticipants.filter(p => p.selectedPhotoId);
          
          // Logic update: Ensure we transition if there are participants in the session, even if weird edge cases happen.
          // This ensures the "Force" button is responsive.
          const hasParticipants = newParticipants.length > 0;
          const nextStage = hasParticipants ? SessionStage.SPEAKING_TOUR : prev.stage;
          
          // Need to calculate order immediately if we are jumping straight to speaking tour
          const sorted = validParticipants.sort((a, b) => (a.selectionTimestamp || Infinity) - (b.selectionTimestamp || Infinity));
          const speakingOrder = sorted.map(p => p.id);
          const firstSpeakerId = speakingOrder[0];

          return {
              ...prev,
              photos: newPhotos,
              participants: newParticipants,
              isTimerRunning: false, // Stop timer after forcing
              stage: nextStage, // Jump directly to Speaking Tour
              speakingOrder: speakingOrder,
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