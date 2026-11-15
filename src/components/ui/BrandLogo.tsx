import React, { useId } from 'react';
import { Award } from 'lucide-react';

interface EspCalcLogoMarkProps {
  size?: number;
  className?: string;
}

export const EspCalcLogoMark: React.FC<EspCalcLogoMarkProps> = ({
  size = 40,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const bgId = `esp-bg-${uid}`;
  const washId = `esp-wash-${uid}`;
  const borderId = `esp-border-${uid}`;
  const glyphId = `esp-glyph-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={bgId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1D2434" />
          <stop offset="100%" stopColor="#0B0E15" />
        </linearGradient>
        <radialGradient id={washId} cx="30%" cy="18%" r="75%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={borderId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="48%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id={glyphId} x1="50%" y1="24%" x2="50%" y2="76%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="52%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>

      <path
        d="M22 5 L78 5 L95 22 L95 72 L75 95 L25 95 L5 72 L5 22 Z"
        fill={`url(#${bgId})`}
      />
      <path
        d="M22 5 L78 5 L95 22 L95 72 L75 95 L25 95 L5 72 L5 22 Z"
        fill={`url(#${washId})`}
      />
      <path
        d="M22 5 L78 5 L95 22 L95 72 L75 95 L25 95 L5 72 L5 22 Z"
        stroke={`url(#${borderId})`}
        strokeWidth="3.6"
      />
      <path
        d="M26 12 L74 12 L88 26 L88 69 L71 88 L29 88 L12 69 L12 26 Z"
        stroke="#F59E0B"
        strokeOpacity="0.35"
        strokeWidth="1.8"
      />
      <path
        d="M30 27 L73 27 L67 38 L39 38 L39 62 L69 62 L75 73 L26 73 L26 31 Z"
        fill={`url(#${glyphId})`}
      />
      <path
        d="M44 44.5 L66 44.5 L61 55.5 L44 55.5 Z"
        fill={`url(#${glyphId})`}
      />
    </svg>
  );
};

interface OrganizerAvatarProps {
  name?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  size?: number;
  showCrown?: boolean;
}

export const OrganizerAvatar: React.FC<OrganizerAvatarProps> = ({
  name,
  email,
  photoUrl,
  size = 38,
  showCrown = true,
}) => {
  const source = (name || email || 'O').trim();
  const initial = source.length > 0 ? source.slice(0, 1).toUpperCase() : 'O';

  return (
    <div
      className="relative shrink-0 select-none"
      style={{ width: size, height: size }}
    >
      <div
        className="h-full w-full overflow-hidden rounded-full bg-[#161923] border-[1.75px] border-purple-400/80 shadow-[0_0_14px_rgba(168,85,247,0.3)] flex items-center justify-center"
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name || 'Organizer'}
            className="h-full w-full object-cover"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span
            className="font-extrabold text-amber-400"
            style={{ fontSize: Math.round(size * 0.42) }}
          >
            {initial}
          </span>
        )}
      </div>

      {showCrown && (
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-[#090B0F] bg-gradient-to-br from-amber-300 to-amber-600 text-[#090B0F]"
        >
          <Award className="h-2.5 w-2.5 stroke-[2.5]" />
        </span>
      )}
    </div>
  );
};
