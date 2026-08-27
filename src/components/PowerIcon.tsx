import React, { useState } from 'react';
import { 
  Zap, 
  Sword, 
  Shield, 
  Waves, 
  Droplet, 
  Compass, 
  Flame, 
  Skull, 
  Feather, 
  Sun, 
  Moon, 
  BookOpen, 
  Eye, 
  Heart, 
  Sparkles, 
  Wind, 
  Crosshair, 
  Anchor, 
  Hammer, 
  Target, 
  Crown, 
  Trees, 
  Ghost,
  Activity,
  Layers
} from 'lucide-react';

interface PowerIconProps {
  iconUrl?: string;
  name?: string; // alias for iconUrl
  godColor?: string;
  className?: string;
  size?: number;
  altText?: string;
}

export const PowerIcon: React.FC<PowerIconProps> = ({
  iconUrl,
  name,
  godColor = '#3b82f6',
  className = 'w-6 h-6',
  size = 24,
  altText = 'Ícone de Poder'
}) => {
  const [imgError, setImgError] = useState(false);
  const effectiveIcon = (iconUrl || name || 'zap').trim();

  const isImage = !imgError && effectiveIcon && (
    effectiveIcon.startsWith('http://') || 
    effectiveIcon.startsWith('https://') || 
    effectiveIcon.startsWith('data:') ||
    effectiveIcon.startsWith('/') ||
    effectiveIcon.includes('.png') ||
    effectiveIcon.includes('.jpg') ||
    effectiveIcon.includes('.jpeg') ||
    effectiveIcon.includes('.webp') ||
    effectiveIcon.includes('.svg') ||
    effectiveIcon.includes('.gif') ||
    effectiveIcon.includes('imgur.com') ||
    effectiveIcon.includes('dropbox.com') ||
    effectiveIcon.includes('2img.net') ||
    effectiveIcon.includes('discordapp.')
  );

  if (isImage) {
    return (
      <img
        src={effectiveIcon}
        alt={altText}
        referrerPolicy="no-referrer"
        className={`object-cover rounded-xl ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  // Key map of icons
  const iconKey = effectiveIcon.toLowerCase();

  switch (iconKey) {
    case 'sword':
    case 'espada':
    case 'arma':
      return <Sword size={size} className={className} style={{ color: godColor }} />;
    case 'shield':
    case 'escudo':
    case 'defesa':
      return <Shield size={size} className={className} style={{ color: godColor }} />;
    case 'waves':
    case 'ondas':
    case 'mar':
    case 'agua':
      return <Waves size={size} className={className} style={{ color: godColor }} />;
    case 'droplet':
    case 'gota':
      return <Droplet size={size} className={className} style={{ color: godColor }} />;
    case 'compass':
    case 'bussola':
      return <Compass size={size} className={className} style={{ color: godColor }} />;
    case 'flame':
    case 'fogo':
    case 'chama':
      return <Flame size={size} className={className} style={{ color: godColor }} />;
    case 'skull':
    case 'caveira':
    case 'morte':
      return <Skull size={size} className={className} style={{ color: godColor }} />;
    case 'feather':
    case 'pena':
    case 'vento':
      return <Feather size={size} className={className} style={{ color: godColor }} />;
    case 'sun':
    case 'sol':
    case 'luz':
      return <Sun size={size} className={className} style={{ color: godColor }} />;
    case 'moon':
    case 'lua':
    case 'noite':
      return <Moon size={size} className={className} style={{ color: godColor }} />;
    case 'book':
    case 'livro':
    case 'sabedoria':
      return <BookOpen size={size} className={className} style={{ color: godColor }} />;
    case 'eye':
    case 'olho':
    case 'visao':
      return <Eye size={size} className={className} style={{ color: godColor }} />;
    case 'heart':
    case 'coracao':
    case 'amor':
      return <Heart size={size} className={className} style={{ color: godColor }} />;
    case 'sparkles':
    case 'magia':
    case 'brilho':
      return <Sparkles size={size} className={className} style={{ color: godColor }} />;
    case 'wind':
    case 'ar':
      return <Wind size={size} className={className} style={{ color: godColor }} />;
    case 'crosshair':
    case 'mira':
      return <Crosshair size={size} className={className} style={{ color: godColor }} />;
    case 'anchor':
    case 'ancora':
      return <Anchor size={size} className={className} style={{ color: godColor }} />;
    case 'hammer':
    case 'martelo':
    case 'forja':
      return <Hammer size={size} className={className} style={{ color: godColor }} />;
    case 'target':
    case 'alvo':
      return <Target size={size} className={className} style={{ color: godColor }} />;
    case 'crown':
    case 'coroa':
      return <Crown size={size} className={className} style={{ color: godColor }} />;
    case 'tree':
    case 'arvore':
    case 'natureza':
      return <Trees size={size} className={className} style={{ color: godColor }} />;
    case 'ghost':
    case 'fantasma':
      return <Ghost size={size} className={className} style={{ color: godColor }} />;
    case 'activity':
    case 'vigor':
      return <Activity size={size} className={className} style={{ color: godColor }} />;
    case 'layers':
      return <Layers size={size} className={className} style={{ color: godColor }} />;
    case 'zap':
    case 'raio':
    default:
      return <Zap size={size} className={className} style={{ color: godColor }} />;
  }
};
