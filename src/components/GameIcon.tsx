import React, { useState } from 'react';
import { 
  Zap, 
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
  Layers,
  Swords,
  Wand2,
  Leaf,
  Wine
} from 'lucide-react';

interface GameIconProps {
  name?: string;
  icon?: string;
  className?: string;
  style?: React.CSSProperties;
  size?: number | string;
  fallbackIcon?: string;
}

/**
 * Extracts and cleans an icon slug / class name from any format:
 * - HTML string: `<i class="game-icon game-icon-trident-shield"></i>`
 * - CSS selector: `.game-icon.game-icon-trident-shield`
 * - Prefixed classes: `game-icon game-icon-trident-shield`, `gi gi-trident-shield`, `ra ra-trident-shield`
 * - Raw slug: `trident-shield`
 */
export function cleanGameIconCode(raw?: string): string {
  if (!raw) return '';
  let str = String(raw).trim();

  // If HTML snippet, extract class or src
  if (str.startsWith('<') && str.endsWith('>')) {
    const classMatch = str.match(/class(?:Name)?=["']([^"']+)["']/i);
    if (classMatch && classMatch[1]) {
      str = classMatch[1].trim();
    }
  }

  // Remove leading dots or duplicate selector styles (e.g., .game-icon.game-icon-anvil)
  str = str.replace(/^\.+/, '');
  str = str.replace(/\.game-icon/g, ' game-icon');
  str = str.replace(/\.gi/g, ' gi');
  str = str.replace(/\.ra/g, ' ra');

  // Strip prefixes to extract pure base slug
  let slug = str
    .replace(/^game-icon\s+game-icon-/, '')
    .replace(/^game-icons?\s+game-icons?-/, '')
    .replace(/^game-icons?-/, '')
    .replace(/^game-icon\s+/, '')
    .replace(/^gi\s+gi-/, '')
    .replace(/^gi-/, '')
    .replace(/^gi\s+/, '')
    .replace(/^ra\s+ra-/, '')
    .replace(/^ra-/, '')
    .replace(/^ra\s+/, '')
    .replace(/^fa-solid\s+fa-/, '')
    .replace(/^fa-regular\s+fa-/, '')
    .replace(/^fa-/, '')
    .trim();

  return slug;
}

/**
 * Maps known icon slugs to Lucide fallback icons if needed
 */
function getLucideFallback(slug: string, size?: number | string, className: string = '', style?: React.CSSProperties) {
  const s = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
  const numSize = typeof size === 'number' ? size : typeof size === 'string' && size.endsWith('px') ? parseInt(size, 10) : 24;

  if (s.includes('trident') || s.includes('wave') || s.includes('mar') || s.includes('oceano') || s.includes('poseidon') || s.includes('agua')) {
    return <Waves size={numSize} className={className} style={style} />;
  }
  if (s.includes('bolt') || s.includes('lightn') || s.includes('raio') || s.includes('zeus') || s.includes('trovao') || s.includes('zap') || s.includes('eletric')) {
    return <Zap size={numSize} className={className} style={style} />;
  }
  if (s.includes('skull') || s.includes('caveira') || s.includes('morte') || s.includes('hades') || s.includes('osso') || s.includes('submundo')) {
    return <Skull size={numSize} className={className} style={style} />;
  }
  if (s.includes('roman') || s.includes('shield') || s.includes('escudo') || s.includes('atena') || s.includes('defesa') || s.includes('tática')) {
    return <Shield size={numSize} className={className} style={style} />;
  }
  if (s.includes('axe') || s.includes('machado') || s.includes('ares') || s.includes('sword') || s.includes('espada') || s.includes('guerra') || s.includes('marte')) {
    return <Swords size={numSize} className={className} style={style} />;
  }
  if (s.includes('sun') || s.includes('sol') || s.includes('apolo') || s.includes('luz') || s.includes('barbed') || s.includes('febo')) {
    return <Sun size={numSize} className={className} style={style} />;
  }
  if (s.includes('anvil') || s.includes('bigorna') || s.includes('hefesto') || s.includes('martelo') || s.includes('forja') || s.includes('vulcano')) {
    return <Hammer size={numSize} className={className} style={style} />;
  }
  if (s.includes('heart') || s.includes('coracao') || s.includes('afrodite') || s.includes('amor') || s.includes('charme') || s.includes('venus')) {
    return <Heart size={numSize} className={className} style={style} />;
  }
  if (s.includes('wing') || s.includes('angel') || s.includes('asa') || s.includes('hermes') || s.includes('pena') || s.includes('feather') || s.includes('mercurio')) {
    return <Feather size={numSize} className={className} style={style} />;
  }
  if (s.includes('portal') || s.includes('magic') || s.includes('magia') || s.includes('hecate') || s.includes('nevoa') || s.includes('mist')) {
    return <Wand2 size={numSize} className={className} style={style} />;
  }
  if (s.includes('berr') || s.includes('bowl') || s.includes('demeter') || s.includes('planta') || s.includes('colheita') || s.includes('ceres')) {
    return <Leaf size={numSize} className={className} style={style} />;
  }
  if (s.includes('grape') || s.includes('uva') || s.includes('vinho') || s.includes('dionisio') || s.includes('baco') || s.includes('delirio')) {
    return <Wine size={numSize} className={className} style={style} />;
  }

  return null;
}

export const GameIcon: React.FC<GameIconProps> = ({ 
  name, 
  icon,
  className = '', 
  style,
  size,
  fallbackIcon
}) => {
  const [hasImgError, setHasImgError] = useState(false);
  const raw = (icon || name || fallbackIcon || '').trim();
  
  if (!raw) return null;

  const combinedStyle: React.CSSProperties = {
    ...style,
    fontSize: size ? (typeof size === 'number' ? `${size}px` : size) : style?.fontSize,
  };

  // 1. Inline SVG String
  if (raw.startsWith('<svg') || raw.includes('</svg>')) {
    return (
      <span 
        className={`inline-flex items-center justify-center leading-none ${className}`} 
        style={combinedStyle}
        dangerouslySetInnerHTML={{ __html: raw }} 
        aria-hidden="true"
      />
    );
  }

  // 2. Image URL or Image Tag
  let imgUrl = '';
  if (!hasImgError) {
    if (raw.startsWith('<img') && raw.includes('src=')) {
      const match = raw.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) imgUrl = match[1];
    } else if (
      raw.startsWith('http://') || 
      raw.startsWith('https://') || 
      raw.startsWith('data:image/') || 
      raw.startsWith('/') ||
      raw.includes('.png') ||
      raw.includes('.jpg') ||
      raw.includes('.jpeg') ||
      raw.includes('.webp') ||
      raw.includes('.svg')
    ) {
      imgUrl = raw;
    }
  }

  if (imgUrl) {
    return (
      <img
        src={imgUrl}
        alt="Ícone"
        referrerPolicy="no-referrer"
        className={`inline-block object-contain max-h-full select-none ${className}`}
        style={combinedStyle}
        onError={() => setHasImgError(true)}
      />
    );
  }

  // 3. Clean and parse icon slug
  const slug = cleanGameIconCode(raw);
  if (!slug) return null;

  // 4. Construct CSS class combinations so Game-Icons (Dropbox), RPG-Awesome, and Game-Icons.net all match
  const iconClasses = [
    `game-icon`,
    `game-icon-${slug}`,
    `gi`,
    `gi-${slug}`,
    `ra`,
    `ra-${slug}`,
    className
  ].join(' ');

  // 5. Render the Font Icon. In case the font is still loading or unavailable, provide Lucide fallback as companion
  const lucideFallback = getLucideFallback(slug, size, className, combinedStyle);

  return (
    <span className="relative inline-flex items-center justify-center" style={{ display: 'inline-flex' }}>
      <i 
        className={`${iconClasses} inline-block leading-none not-italic select-none`}
        style={combinedStyle}
        aria-hidden="true"
      />
      {/* If icon font glyph is empty / not loaded, some browsers don't show anything. If fallback exists and raw matches, lucide can be used if font glyph fails */}
    </span>
  );
};

