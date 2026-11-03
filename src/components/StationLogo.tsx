import React from 'react';

interface StationLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  title?: string;
  subtitle?: string;
  customLogoUrl?: string;
}

export function StationZizIcon({ className = "w-full h-full", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="react-ziz-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="100%" stopColor="#f8fafc"/>
        </linearGradient>

        <linearGradient id="react-gazelle-orange" x1="15%" y1="15%" x2="85%" y2="85%">
          <stop offset="0%" stopColor="#fbbf24"/>
          <stop offset="25%" stopColor="#f97316"/>
          <stop offset="70%" stopColor="#ea580c"/>
          <stop offset="100%" stopColor="#c2410c"/>
        </linearGradient>

        <linearGradient id="react-gazelle-dark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ea580c"/>
          <stop offset="100%" stopColor="#9a3412"/>
        </linearGradient>

        <linearGradient id="react-ziz-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399"/>
          <stop offset="35%" stopColor="#10b981"/>
          <stop offset="80%" stopColor="#059669"/>
          <stop offset="100%" stopColor="#047857"/>
        </linearGradient>

        <filter id="react-soft-shadow" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.12"/>
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.08"/>
        </filter>
      </defs>

      {/* Rounded white squircle container */}
      <rect 
        x="18" 
        y="18" 
        width="476" 
        height="476" 
        rx="114" 
        fill="url(#react-ziz-bg)" 
        stroke="#e2e8f0" 
        strokeWidth="6"
        filter="url(#react-soft-shadow)"
      />

      <g transform="translate(6, -4)">
        {/* Secondary wave */}
        <path d="M 105,392 C 165,418 245,412 318,382 C 265,398 195,404 105,392 Z" fill="#047857" opacity="0.45"/>

        {/* Primary Emerald dynamic wave */}
        <path 
          d="M 72,364 C 125,388 200,396 280,366 C 342,342 396,298 442,262 C 392,295 332,336 264,352 C 194,368 126,362 72,364 Z" 
          fill="url(#react-ziz-emerald)" 
        />

        {/* Green top highlight */}
        <path 
          d="M 130,377 C 190,380 255,360 318,332 C 370,308 412,278 438,264 C 410,280 366,312 314,335 C 250,363 186,381 130,377 Z" 
          fill="#6ee7b7" 
          opacity="0.65"
        />

        {/* Far limbs */}
        <path d="M 288,236 C 305,252 324,268 348,276 C 353,278 350,284 344,284 C 324,280 306,264 284,244 Z" fill="url(#react-gazelle-dark)"/>
        <path d="M 174,232 C 152,260 130,294 92,330 C 88,334 84,329 87,325 C 118,290 142,254 165,226 Z" fill="url(#react-gazelle-dark)"/>

        {/* Leaping Gazelle Body */}
        <path 
          d="
            M 276,140
            C 254,116 226,94 184,78
            C 180,76 182,72 186,73
            C 226,88 258,112 278,133
            C 284,120 295,114 298,116
            C 302,118 299,129 292,142
            C 308,148 322,158 338,172
            C 342,176 340,183 333,185
            C 322,187 310,183 302,176
            C 293,188 295,208 302,228
            C 324,238 356,246 392,242
            C 398,241 400,247 394,250
            C 362,264 328,258 302,242
            C 295,252 286,258 273,260
            C 252,262 233,254 212,245
            C 188,235 171,235 156,243
            C 136,270 117,306 72,356
            C 68,360 63,356 67,351
            C 106,300 130,256 151,226
            C 147,215 149,203 158,196
            C 162,194 165,198 162,203
            C 171,194 188,192 211,196
            C 236,200 255,196 268,178
            C 265,164 269,151 276,140
            Z" 
          fill="url(#react-gazelle-orange)"
        />

        {/* Horn ridge */}
        <path d="M 272,137 C 248,113 218,90 178,74 C 174,72 176,69 180,70 C 222,86 254,110 272,137 Z" fill="#ea580c"/>

        {/* Eye */}
        <circle cx="310" cy="165" r="4" fill="#ffffff"/>
        <circle cx="311" cy="164.5" r="2.2" fill="#7c2d12"/>

        {/* Flank highlight */}
        <path d="M 215,206 C 240,210 258,224 270,240 C 254,244 236,240 218,233 C 202,227 192,222 182,224 C 194,214 204,208 215,206 Z" fill="#fde68a" opacity="0.55"/>

        {/* Energy drop */}
        <path d="M 398,124 C 398,124 382,150 382,162 A 16 16 0 0 0 414 162 C 414,150 398,124 398,124 Z" fill="url(#react-gazelle-orange)"/>
        <circle cx="394" cy="158" r="3.5" fill="#ffffff" opacity="0.85"/>
      </g>
    </svg>
  );
}

export default function StationLogo({
  className = "",
  size = 40,
  showText = false,
  title = "STATION ZIZ SERVICE",
  subtitle = "ERP SYSTEM",
  customLogoUrl
}: StationLogoProps) {
  const isCustomImage = customLogoUrl && (customLogoUrl.startsWith('data:') || customLogoUrl.startsWith('http') || customLogoUrl.length > 20);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        style={{ width: size, height: size }}
        className="shrink-0 rounded-xl overflow-hidden shadow-sm flex items-center justify-center transition-transform hover:scale-105"
      >
        {isCustomImage ? (
          <img src={customLogoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <StationZizIcon />
        )}
      </div>

      {showText && (
        <div className="min-w-0">
          <h1 className="text-sm font-black text-white tracking-tight uppercase leading-tight truncate">
            {title}
          </h1>
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider truncate">
            {subtitle}
          </p>
        </div>
      )}
    </div>
  );
}
