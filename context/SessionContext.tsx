import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren, useRef } from 'react';
import { SessionContextType, SessionState, SessionStage, UserRole, Participant, Photo } from '../types';
import { PHOTO_FOLDERS, INITIAL_SESSION_CODE } from '../constants';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, update as firebaseUpdate } from 'firebase/database';

// --- CONFIGURATION FIREBASE ---
// POUR PUBLIER L'APP : Remplacez ces valeurs par celles de votre projet Firebase.
// Sans cela, l'app fonctionnera en mode "local" (BroadcastChannel) uniquement.
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

// Initialize Firebase only if config is present
let db: any = null;
if (FIREBASE_CONFIG.apiKey) {
    try {
        const app = initializeApp(FIREBASE_CONFIG);
        db = getDatabase(app);
        console.log("Firebase initialized successfully");
    } catch (e) {
        console.error("Firebase init failed:", e);
    }
}

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

  // --- SYNC ENGINE (Firebase OR BroadcastChannel) ---
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isRemoteUpdate = useRef(false);
  const sessionRef = useRef(session); // Keep track of latest session for callbacks

  // Update ref whenever session changes
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Helper to handle state updates
  // This replaces standard setSession to ensure we broadcast changes
  const updateSession = (updater: (prev: SessionState) => SessionState) => {
      const newState = updater(sessionRef.current);
      
      // 1. Update Local State (Instant UI)
      setSession(newState);
      isRemoteUpdate.current = false; // We initiated this change

      // 2. Broadcast to Cloud (Firebase)
      if (db) {
          // We use the session code as the unique ID in the database
          const sessionRefPath = ref(db, `sessions/${newState.code}`);
          // We set the whole state. For a larger app, we would patch fields.
          set(sessionRefPath, newState).catch(err => console.error("Firebase write error:", err));
      } 
      // 3. Fallback to Local Broadcast (if no Firebase)
      else if (channelRef.current) {
          channelRef.current.postMessage(newState);
      }
  };

  useEffect(() => {
    // A. FIREBASE LISTENER (If Configured)
    if (db) {
        const sessionCode = session.code;
        const sessionRefPath = ref(db, `sessions/${sessionCode}`);
        
        const unsubscribe = onValue(sessionRefPath, (snapshot) => {
            const val = snapshot.val();
            if (val) {
                // If we receive data from cloud, update local state
                // We check JSON stringify to avoid infinite loops if objects are identical
                if (JSON.stringify(val) !== JSON.stringify(sessionRef.current)) {
                    isRemoteUpdate.current = true;
                    setSession(val);
                }
            }
        });

        return () => unsubscribe();
    } 
    
    // B. BROADCAST CHANNEL LISTENER (Fallback)
    else {
        channelRef.current = new BroadcastChannel('photo_expression_sync');
        channelRef.current.onmessage = (event) => {
            if (event.data === 'REQUEST_SYNC') {
                if (sessionRef.current.theme) {
                    channelRef.current?.postMessage(sessionRef.current);
                }
                return;
            }
            if (event.data && typeof event.data === 'object' && 'stage' in event.data) {
                isRemoteUpdate.current = true;
                setSession(event.data);
            }
        };
        // Ask for state on load
        channelRef.current.postMessage('REQUEST_SYNC');
        return () => channelRef.current?.close();
    }
  }, [session.code]); // Re-subscribe if code changes

  // Timer Effect
  useEffect(() => {
    let interval: any;
    // Only the Animateur drives the timer (Source of Truth)
    // In Firebase mode, Animateur writes to DB, others listen.
    const shouldDriveTimer = role === UserRole.ANIMATEUR;

    if (session.isTimerRunning && session.timerSeconds > 0 && shouldDriveTimer) {
      interval = setInterval(() => {
        // We use updateSession to push the new time to everyone
        updateSession(prev => ({ ...prev, timerSeconds: prev.timerSeconds - 1 }));
      }, 1000);
    } else if (session.isTimerRunning && session.timerSeconds === 0 && shouldDriveTimer) {
       // Timer finished
       updateSession(prev => {
           // If we are in selection phase and time runs out, force random selection
           if (prev.stage === SessionStage.SELECTION_PHASE) {
               // We need to call the logic for forceRandomSelection here but inside the update cycle
               // To avoid code duplication, we'll just stop timer here and let Animateur click the button
               // Or trigger it automatically (Complex due to side effects). 
               // Let's just stop the timer.
               return { ...prev, isTimerRunning: false };
           }
           return { ...prev, isTimerRunning: false };
       });
    }
    return () => clearInterval(interval);
  }, [session.isTimerRunning, session.timerSeconds, session.stage, role]);

  // Actions wrapped with updateSession
  const createSession = (theme: string, question: string, photos: Photo[]) => {
    updateSession(prev => ({ 
        ...prev, 
        theme, 
        taskQuestion: question, 
        photos: photos,
        stage: SessionStage.LOBBY 
    }));
  };

  const startSession = () => {
    updateSession(prev => ({ ...prev, stage: SessionStage.PRESENTATION }));
  };

  const startSilentPhase = (durationMinutes: number) => {
      startSelectionPhase();
  };

  const toggleTimer = () => {
     updateSession(prev => ({ ...prev, isTimerRunning: !prev.isTimerRunning }));
  };

  const startSelectionPhase = () => {
    updateSession(prev => ({ 
      ...prev, 
      stage: SessionStage.SELECTION_PHASE, 
      timerSeconds: 300, 
      isTimerRunning: true 
    }));
  };

  const selectPhoto = (photoId: string, userId: string) => {
    updateSession(prev => {
      const photoTaken = prev.photos.find(p => p.id === photoId)?.selectedByUserId;
      if (photoTaken && photoTaken !== userId) return prev; // Guard

      const updatedPhotos = prev.photos.map(p => 
        p.selectedByUserId === userId ? { ...p, selectedByUserId: undefined } : p
      );
      
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
    updateSession(prev => {
        const participantsWithPhotos = prev.participants.filter(p => p.selectedPhotoId);
        const sortedParticipants = participantsWithPhotos.sort((a, b) => 
            (a.selectionTimestamp || Infinity) - (b.selectionTimestamp || Infinity)
        );
        const speakingOrder = sortedParticipants.map(p => p.id);
        
        return {
          ...prev,
          stage: SessionStage.SPEAKING_TOUR,
          speakingOrder: speakingOrder,
          currentSpeakerId: speakingOrder[0],
          currentSubjectId: undefined,
          isTimerRunning: false
        };
    });
  };

  const startDebateTour = () => {
    updateSession(prev => {
        const participantsWithPhotos = prev.participants.filter(p => p.selectedPhotoId);
        if (participantsWithPhotos.length < 2) return { ...prev, stage: SessionStage.ENDED }; // Skip if not enough people

        return {
          ...prev,
          stage: SessionStage.DEBATE_TOUR,
          currentSubjectId: participantsWithPhotos[0].id,
          currentSpeakerId: participantsWithPhotos[1].id,
          isTimerRunning: false
        };
    });
  };

  const nextSpeaker = () => {
    updateSession(prev => {
       const participants = prev.participants.filter(p => p.selectedPhotoId);
       
       if (prev.stage === SessionStage.SPEAKING_TOUR) {
           const order = prev.speakingOrder || participants.map(p => p.id);
           const currentIndex = order.indexOf(prev.currentSpeakerId || '');
           const nextIndex = currentIndex + 1;

           if (nextIndex >= order.length) {
               return { ...prev, stage: SessionStage.ROUND_TRANSITION, currentSpeakerId: undefined };
           }
           return { ...prev, currentSpeakerId: order[nextIndex] };
       }

       if (prev.stage === SessionStage.DEBATE_TOUR) {
           const currentSubjectIndex = participants.findIndex(p => p.id === prev.currentSubjectId);
           const currentSpeakerIndex = participants.findIndex(p => p.id === prev.currentSpeakerId);

           let nextSpeakerIndex = currentSpeakerIndex + 1;
           let nextSubjectIndex = currentSubjectIndex;

           while (true) {
               if (nextSpeakerIndex >= participants.length) {
                   nextSubjectIndex++;
                   nextSpeakerIndex = 0;
               }
               if (nextSubjectIndex >= participants.length) {
                   return { ...prev, stage: SessionStage.SYNTHESIS, currentSpeakerId: undefined, currentSubjectId: undefined };
               }
               if (participants[nextSpeakerIndex].id !== participants[nextSubjectIndex].id) {
                   return { 
                       ...prev, 
                       currentSubjectId: participants[nextSubjectIndex].id,
                       currentSpeakerId: participants[nextSpeakerIndex].id 
                   };
               }
               nextSpeakerIndex++;
           }
       }
       return prev;
    });
  };

  const endSession = () => {
    updateSession(prev => ({ ...prev, stage: SessionStage.ENDED }));
  };

  const resetSession = () => {
    updateSession(() => ({
      code: INITIAL_SESSION_CODE,
      theme: '',
      taskQuestion: '',
      stage: SessionStage.LOBBY,
      timerSeconds: 300,
      isTimerRunning: false,
      participants: INITIAL_PARTICIPANTS,
      photos: PHOTO_FOLDERS[0].photos,
      notes: '',
    }));
  };

  const updateNotes = (text: string) => {
    updateSession(prev => ({ ...prev, notes: text }));
  };

  const joinSession = (code: string, name: string, userId: string) => {
      // For participants, we just add ourselves to the DB list if not there
      updateSession(prev => {
          if (prev.participants.some(p => p.id === userId)) return prev;
          
          const newUser: Participant = {
              id: userId,
              name: name,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
              status: 'waiting'
          };
          return { ...prev, participants: [...prev.participants, newUser] };
      });
      setRole(UserRole.PARTICIPANT);
  };

  const addGuestParticipant = (name: string, roleLabel?: string) => {
      const newId = `guest-${Date.now()}`;
      const newGuest: Participant = {
          id: newId,
          name: name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
          status: 'waiting',
          isGuest: true,
          roleLabel: roleLabel
      };
      updateSession(prev => ({ ...prev, participants: [...prev.participants, newGuest] }));
  };

  const removeParticipant = (userId: string) => {
      updateSession(prev => {
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
      updateSession(prev => ({
          ...prev,
          timerSeconds: prev.timerSeconds + seconds,
          isTimerRunning: true
      }));
  };

  const forceRandomSelection = () => {
      updateSession(prev => {
          const unselectedParticipants = prev.participants.filter(p => !p.selectedPhotoId);
          let availablePhotos = prev.photos.filter(p => !p.selectedByUserId);
          availablePhotos = availablePhotos.sort(() => Math.random() - 0.5);

          const newPhotos = [...prev.photos];
          const newParticipants = prev.participants.map(p => ({...p}));
          const timestamp = Date.now();

          unselectedParticipants.forEach((participant, index) => {
              if (index < availablePhotos.length) {
                  const photo = availablePhotos[index];
                  const photoIndex = newPhotos.findIndex(p => p.id === photo.id);
                  if (photoIndex !== -1) {
                      newPhotos[photoIndex] = { ...newPhotos[photoIndex], selectedByUserId: participant.id };
                  }
                  const partIndex = newParticipants.findIndex(p => p.id === participant.id);
                  if (partIndex !== -1) {
                      newParticipants[partIndex] = {
                          ...newParticipants[partIndex],
                          selectedPhotoId: photo.id,
                          status: 'selected',
                          selectionTimestamp: timestamp
                      };
                  }
              }
          });

          const validParticipants = newParticipants.filter(p => p.selectedPhotoId);
          const hasParticipants = newParticipants.length > 0;
          const nextStage = hasParticipants ? SessionStage.SPEAKING_TOUR : prev.stage;
          const sorted = validParticipants.sort((a, b) => (a.selectionTimestamp || Infinity) - (b.selectionTimestamp || Infinity));
          const speakingOrder = sorted.map(p => p.id);

          return {
              ...prev,
              photos: newPhotos,
              participants: newParticipants,
              isTimerRunning: false,
              stage: nextStage,
              speakingOrder: speakingOrder,
              currentSpeakerId: speakingOrder[0],
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
