import React from 'react';
import { useSession } from '../context/SessionContext';
import { UserRole } from '../types';
import { Button } from '../components/Button';
import { Image, Users } from 'lucide-react';

const WelcomeScreen = () => {
  const { setRole } = useSession();

  return (
    <div className="flex flex-col h-full px-6 pt-12 pb-6">
      
      {/* Brand Header */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="w-24 h-24 bg-white rounded-[32px] shadow-lg flex items-center justify-center text-[#4A89DA]">
            <Image size={40} strokeWidth={1.5} />
        </div>
        <div className="text-center">
            <h1 className="text-2xl font-bold text-[#1C1C1E]">Photo-expression</h1>
            <p className="text-[#777B80] mt-2">Ateliers interactifs simplifiés</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 mb-8">
        <Button 
            onClick={() => setRole(UserRole.ANIMATEUR)} 
            className="flex gap-3"
        >
            <Users size={20} />
            Je suis Animateur
        </Button>
        <Button 
            variant="secondary" 
            onClick={() => setRole(UserRole.PARTICIPANT)}
            fullWidth
        >
            Je suis Participant
        </Button>
      </div>

      <p className="text-center text-xs text-gray-400">Version Alpha 0.1</p>
    </div>
  );
};

export default WelcomeScreen;
