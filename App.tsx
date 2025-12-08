import React from 'react';
import { SessionProvider, useSession } from './context/SessionContext';
import Layout from './components/Layout';
import WelcomeScreen from './screens/WelcomeScreen';
import AnimateurFlow from './screens/animateur/AnimateurFlow';
import ParticipantFlow from './screens/participant/ParticipantFlow';
import { UserRole } from './types';

const AppContent = () => {
  const { role } = useSession();

  return (
    <Layout>
      {role === UserRole.NONE && <WelcomeScreen />}
      {role === UserRole.ANIMATEUR && <AnimateurFlow />}
      {role === UserRole.PARTICIPANT && <ParticipantFlow />}
    </Layout>
  );
};

const App = () => {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
};

export default App;
