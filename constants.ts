import { Photo, PhotoFolder } from './types';

// Updated Social Photos with robust URLs reflecting "Yapaka" themes (emotions, society, daily life)
const SOCIAL_PHOTOS: Photo[] = [
  { id: 's1', url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80', keywords: ['groupe', 'amitié'] },
  { id: 's2', url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&q=80', keywords: ['solitude', 'lecture'] },
  { id: 's3', url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80', keywords: ['fête', 'joie'] },
  { id: 's4', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80', keywords: ['regard', 'femme'] },
  { id: 's5', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&q=80', keywords: ['portrait', 'homme'] },
  { id: 's6', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80', keywords: ['éducation', 'enfant'] },
  { id: 's7', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80', keywords: ['diversité', 'mains'] },
  { id: 's8', url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80', keywords: ['travail', 'bureau'] },
  { id: 's9', url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&q=80', keywords: ['tristesse', 'réflexion'] },
  { id: 's10', url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80', keywords: ['entraide', 'équipe'] },
  { id: 's11', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80', keywords: ['groupe', 'disussion'] },
  { id: 's12', url: 'https://images.unsplash.com/photo-1516737488439-51205b15796e?w=800&q=80', keywords: ['pingouins', 'famille'] },
  { id: 's13', url: 'https://images.unsplash.com/photo-1504384308090-c54be3855463?w=800&q=80', keywords: ['repas', 'partage'] },
  { id: 's14', url: 'https://images.unsplash.com/photo-1551847677-dc82d764e1eb?w=800&q=80', keywords: ['dialogue', 'couple'] },
  { id: 's15', url: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800&q=80', keywords: ['lien', 'maternité'] },
  { id: 's16', url: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=800&q=80', keywords: ['foule', 'concert'] },
  { id: 's17', url: 'https://images.unsplash.com/photo-1533227297464-96878c71e33d?w=800&q=80', keywords: ['sport', 'handicap'] },
  { id: 's18', url: 'https://images.unsplash.com/photo-1520342868574-5fa3804e551c?w=800&q=80', keywords: ['temps', 'horloge'] },
  { id: 's19', url: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80', keywords: ['travail', 'ordinateur'] },
  { id: 's20', url: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1ef4d?w=800&q=80', keywords: ['conflit', 'guerre'] },
  { id: 's21', url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80', keywords: ['organisation', 'planning'] },
  { id: 's22', url: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800&q=80', keywords: ['industrie', 'technique'] },
  { id: 's23', url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80', keywords: ['écologie', 'déchet'] },
  { id: 's24', url: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=800&q=80', keywords: ['succès', 'héros'] },
];

export const PHOTO_FOLDERS: PhotoFolder[] = [
  {
    id: 'social',
    name: 'Vie Sociale & Émotions',
    description: 'Scènes du quotidien, interactions humaines et société.',
    cover: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&q=80',
    photos: SOCIAL_PHOTOS
  }
];

export const MOCK_PHOTOS = SOCIAL_PHOTOS; // Default fallback
export const INITIAL_SESSION_CODE = "XJ9-2B";