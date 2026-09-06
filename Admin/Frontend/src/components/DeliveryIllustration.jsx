import React from 'react';

export default function DeliveryIllustration() {
  return (
    <div className="illustration-container" style={{ width: '100%', maxWidth: '440px', position: 'relative' }}>
      <svg
        viewBox="0 0 500 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0px 15px 30px rgba(0,0,0,0.5))' }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="scooterBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD21F" />
            <stop offset="100%" stopColor="#D4A800" />
          </linearGradient>
          <linearGradient id="phoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E231B" />
            <stop offset="100%" stopColor="#10130E" />
          </linearGradient>
          <linearGradient id="parcelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C48E46" />
            <stop offset="100%" stopColor="#926224" />
          </linearGradient>
          <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD21F" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFD21F" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Grid Map Background */}
        <path d="M 40 320 Q 250 280 460 330" stroke="#242920" strokeWidth="3" strokeDasharray="6 6" />
        <path d="M 60 220 Q 240 180 440 240" stroke="#1F241C" strokeWidth="2" strokeDasharray="4 4" />

        {/* Floating Smartphone Device Frame */}
        <rect x="290" y="40" width="160" height="280" rx="24" fill="url(#phoneGrad)" stroke="#323B2B" strokeWidth="3" />
        <rect x="300" y="55" width="140" height="250" rx="16" fill="#0D0F0B" />
        {/* Notch */}
        <rect x="345" y="60" width="50" height="8" rx="4" fill="#1C2118" />

        {/* Smartphone UI elements */}
        <circle cx="370" cy="140" r="45" fill="#FFD21F" fillOpacity="0.08" />
        <path d="M 320 190 Q 350 120 410 160" stroke="#FFD21F" strokeWidth="3" strokeLinecap="round" />
        
        {/* Map Route Pin */}
        <circle cx="410" cy="160" r="16" fill="url(#pinGlow)" />
        <path d="M 410 148 C 404 148 400 152 400 157 C 400 165 410 174 410 174 C 410 174 420 165 420 157 C 420 152 416 148 410 148 Z" fill="#FFD21F" />
        <circle cx="410" cy="156" r="3.5" fill="#0D0F0B" />

        {/* Mini UI Card inside phone */}
        <rect x="312" y="225" width="116" height="65" rx="10" fill="#171A14" stroke="#2A3125" />
        <rect x="322" y="238" width="40" height="6" rx="3" fill="#FFD21F" />
        <rect x="322" y="250" width="70" height="5" rx="2.5" fill="#525B49" />
        <rect x="322" y="260" width="55" height="5" rx="2.5" fill="#383E32" />
        <circle cx="408" cy="245" r="8" fill="#22C55E" fillOpacity="0.2" />
        <path d="M 405 245 L 407 247 L 411 243" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Delivery Scooter */}
        <g id="yellowScooter">
          {/* Wheels */}
          <circle cx="110" cy="330" r="38" fill="#141711" stroke="#323B2B" strokeWidth="8" />
          <circle cx="110" cy="330" r="14" fill="#242920" />

          <circle cx="260" cy="330" r="38" fill="#141711" stroke="#323B2B" strokeWidth="8" />
          <circle cx="260" cy="330" r="14" fill="#242920" />

          {/* Scooter Base Frame */}
          <path d="M 110 330 L 160 330 L 195 305 L 245 305 L 260 330" stroke="#2B3226" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 175 305 L 185 240 L 230 220" stroke="#2B3226" strokeWidth="10" strokeLinecap="round" />

          {/* Yellow Main Body Shield */}
          <path d="M 130 300 Q 170 280 190 230 Q 220 225 235 240 Q 210 305 155 310 Z" fill="url(#scooterBody)" />

          {/* Seat */}
          <path d="M 105 255 C 105 250 145 245 165 255 C 165 265 110 268 105 255 Z" fill="#242920" />

          {/* Handlebar & Headlight */}
          <path d="M 225 210 L 245 200" stroke="#FFD21F" strokeWidth="6" strokeLinecap="round" />
          <circle cx="248" cy="198" r="9" fill="#FFF" stroke="#FFD21F" strokeWidth="3" />
          
          {/* DParcels Trunk/Delivery Box on Back */}
          <rect x="60" y="195" width="75" height="65" rx="8" fill="#FFD21F" stroke="#B8940A" strokeWidth="2" />
          <path d="M 60 215 L 135 215" stroke="#D4A800" strokeWidth="2" />
          <text x="97" y="238" textAnchor="middle" fill="#000" fontSize="11" fontWeight="800" fontFamily="sans-serif">DP</text>
        </g>

        {/* Stacked Parcel Boxes on Ground */}
        <g id="parcels">
          {/* Box 1 */}
          <rect x="220" y="340" width="55" height="42" rx="4" fill="url(#parcelGrad)" stroke="#664317" />
          <path d="M 247 340 L 247 382" stroke="#FFD21F" strokeWidth="3" />
          <path d="M 220 358 L 275 358" stroke="#FFD21F" strokeWidth="2" />

          {/* Box 2 */}
          <rect x="260" y="350" width="45" height="35" rx="3" fill="#D49942" stroke="#7A5119" />
          <path d="M 282 350 L 282 385" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 2" />
        </g>

        {/* Speed lines under scooter */}
        <line x1="30" y1="365" x2="180" y2="365" stroke="#FFD21F" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <line x1="10" y1="375" x2="130" y2="375" stroke="#FFD21F" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      </svg>
    </div>
  );
}
