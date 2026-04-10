/* =====================================================
   SOLO LEVEL UP — js/avatars.js
   Rank-based anime silhouette SVG avatars
   ===================================================== */

'use strict';

const AVATAR_SVGS = {

  /* ── NOVICE: Hooded mysterious figure, eyes glowing in darkness ── */
  novice: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="ng0" cx="50%" cy="40%" r="55%">
        <stop offset="0%" stop-color="var(--accent2)" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="var(--accent)"  stop-opacity="0.3"/>
      </radialGradient>
      <filter id="nf0">
        <feGaussianBlur stdDeviation="1.8" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="ne">
        <feGaussianBlur stdDeviation="1.2"/>
      </filter>
    </defs>
    <!-- Ground shadow -->
    <ellipse cx="28" cy="53" rx="15" ry="4" fill="var(--accent)" opacity="0.12"/>
    <!-- Cloak body -->
    <path d="M13 30 Q12 18 28 13 Q44 18 43 30 L45 53 Q28 57 11 53 Z"
          fill="url(#ng0)" opacity="0.22"/>
    <!-- Hood arc -->
    <path d="M16 21 Q16 9 28 7 Q40 9 40 21"
          stroke="var(--accent2)" stroke-width="1.8" fill="none" opacity="0.75"/>
    <!-- Head glow blob -->
    <ellipse cx="28" cy="19" rx="10" ry="11"
             fill="var(--accent)" opacity="0.6" filter="url(#nf0)"/>
    <!-- Inner face shadow -->
    <ellipse cx="28" cy="20" rx="7" ry="8" fill="var(--bg)" opacity="0.5"/>
    <!-- Glowing eyes -->
    <ellipse cx="24.5" cy="18.5" rx="2.2" ry="1.6" fill="var(--accent2)" filter="url(#ne)" opacity="0.9"/>
    <ellipse cx="31.5" cy="18.5" rx="2.2" ry="1.6" fill="var(--accent2)" filter="url(#ne)" opacity="0.9"/>
    <ellipse cx="24.5" cy="18.5" rx="1.1" ry="0.85" fill="white" opacity="1"/>
    <ellipse cx="31.5" cy="18.5" rx="1.1" ry="0.85" fill="white" opacity="1"/>
    <!-- Body silhouette -->
    <path d="M19 31 Q15 41 16 52 Q28 56 40 52 Q41 41 37 31 Q28 35.5 19 31Z"
          fill="var(--accent)" opacity="0.28"/>
    <!-- Floating mana sparks -->
    <circle cx="11" cy="24" r="1.1" fill="var(--accent3)" opacity="0.8"/>
    <circle cx="45" cy="28" r="1.3" fill="var(--accent2)" opacity="0.7"/>
    <circle cx="20" cy="8"  r="0.8" fill="var(--accent2)" opacity="0.5"/>
  </svg>`,

  /* ── WARRIOR: Battle-worn soldier, armoured shoulders, sword hilt ── */
  warrior: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="wg0" cx="50%" cy="30%" r="60%">
        <stop offset="0%" stop-color="var(--accent2)" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="var(--accent)"  stop-opacity="0.2"/>
      </radialGradient>
      <filter id="wf0">
        <feGaussianBlur stdDeviation="2" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <!-- Shadow -->
    <ellipse cx="28" cy="54" rx="16" ry="3.5" fill="var(--accent)" opacity="0.15"/>
    <!-- Armoured shoulders -->
    <ellipse cx="14" cy="31" rx="8"  ry="5.5" fill="var(--accent)" opacity="0.45"/>
    <ellipse cx="42" cy="31" rx="8"  ry="5.5" fill="var(--accent)" opacity="0.45"/>
    <ellipse cx="14" cy="30" rx="6"  ry="4"   fill="var(--accent2)" opacity="0.2"/>
    <ellipse cx="42" cy="30" rx="6"  ry="4"   fill="var(--accent2)" opacity="0.2"/>
    <!-- Chest plate -->
    <path d="M18 28 L20 51 Q28 55 36 51 L38 28 Q28 32.5 18 28Z"
          fill="url(#wg0)" opacity="0.65"/>
    <!-- Armour line detail -->
    <path d="M28 29 L28 50" stroke="var(--accent3)" stroke-width="0.6" opacity="0.4"/>
    <path d="M20 36 Q28 38 36 36" stroke="var(--accent3)" stroke-width="0.6" opacity="0.4"/>
    <!-- Head -->
    <ellipse cx="28" cy="17" rx="11" ry="12"
             fill="var(--accent)" opacity="0.6" filter="url(#wf0)"/>
    <!-- Helmet top ridge -->
    <path d="M19 13 Q28 5.5 37 13" stroke="var(--accent2)" stroke-width="2.2" fill="none"/>
    <!-- Eyes — angular warrior glare -->
    <path d="M21 16 L26.5 17.5 L21 19"   fill="var(--accent3)" opacity="0.95"/>
    <path d="M35 16 L29.5 17.5 L35 19"   fill="var(--accent3)" opacity="0.95"/>
    <!-- Battle scar -->
    <path d="M30 13.5 Q31.5 16 30.5 19"  stroke="#f04060" stroke-width="0.9" fill="none" opacity="0.75"/>
    <!-- Sword grip -->
    <rect x="26.5" y="40" width="3" height="14" rx="1.5"
          fill="var(--accent2)" opacity="0.55"/>
    <rect x="22"   y="42" width="12" height="2"  rx="1"
          fill="var(--accent3)" opacity="0.65"/>
    <!-- Aura ring -->
    <ellipse cx="28" cy="30" rx="21" ry="22"
             stroke="var(--accent)" stroke-width="0.5" fill="none" stroke-dasharray="3 4" opacity="0.25"/>
    <!-- Sparks -->
    <circle cx="9"  cy="20" r="1.4" fill="var(--accent2)" opacity="0.6"/>
    <circle cx="47" cy="26" r="1.0" fill="var(--accent3)" opacity="0.55"/>
  </svg>`,

  /* ── ELITE: Ethereal sorcerer, flowing hair, glowing runes ── */
  elite: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="eg0" cx="50%" cy="25%" r="65%">
        <stop offset="0%" stop-color="var(--accent2)" stop-opacity="1"/>
        <stop offset="100%" stop-color="var(--accent)"  stop-opacity="0.15"/>
      </radialGradient>
      <filter id="ef0">
        <feGaussianBlur stdDeviation="2.5" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="ef1"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>
    <!-- Ambient glow -->
    <circle cx="28" cy="26" r="24" fill="var(--accent)" opacity="0.05" filter="url(#ef1)"/>
    <!-- Shadow -->
    <ellipse cx="28" cy="54" rx="17" ry="4" fill="var(--accent)" opacity="0.2"/>
    <!-- Long flowing coat -->
    <path d="M9 34 Q7 50 13 54 Q28 59 43 54 Q49 50 47 34 Q37 40 28 37 Q19 40 9 34Z"
          fill="var(--accent)" opacity="0.14"/>
    <!-- Torso -->
    <path d="M17 26 L18.5 50 Q28 54.5 37.5 50 L39 26 Q28 30.5 17 26Z"
          fill="url(#eg0)" opacity="0.58"/>
    <!-- Floating hair left -->
    <path d="M17 15 Q10 24 13 37"
          stroke="var(--accent2)" stroke-width="2.2" fill="none" opacity="0.55"/>
    <!-- Floating hair right -->
    <path d="M39 15 Q46 24 43 37"
          stroke="var(--accent2)" stroke-width="2.2" fill="none" opacity="0.55"/>
    <!-- Head -->
    <ellipse cx="28" cy="15" rx="11" ry="12"
             fill="var(--accent)" opacity="0.52" filter="url(#ef0)"/>
    <!-- Glowing eyes -->
    <ellipse cx="23.5" cy="15" rx="2.8" ry="2.1" fill="white" opacity="0.15"/>
    <ellipse cx="32.5" cy="15" rx="2.8" ry="2.1" fill="white" opacity="0.15"/>
    <ellipse cx="23.5" cy="15" rx="1.8" ry="1.3" fill="var(--accent2)" opacity="1"/>
    <ellipse cx="32.5" cy="15" rx="1.8" ry="1.3" fill="var(--accent2)" opacity="1"/>
    <ellipse cx="23.5" cy="15" rx="0.7" ry="0.6" fill="white"/>
    <ellipse cx="32.5" cy="15" rx="0.7" ry="0.6" fill="white"/>
    <!-- Rune mark on forehead -->
    <path d="M26 21 L28 23.5 L30 21" stroke="var(--accent2)" stroke-width="0.9" fill="none" opacity="0.8"/>
    <!-- Shoulder crystals -->
    <polygon points="10,28 14,21 18,28" fill="var(--accent2)" opacity="0.6"/>
    <polygon points="46,28 42,21 38,28" fill="var(--accent2)" opacity="0.6"/>
    <!-- Particle orbit -->
    <circle cx="28" cy="20" r="23"
            stroke="var(--accent)" stroke-width="0.4"
            fill="none" stroke-dasharray="2.5 4.5" opacity="0.3"/>
    <circle cx="5"  cy="20" r="1.5" fill="var(--accent2)" opacity="0.7"/>
    <circle cx="51" cy="24" r="1.2" fill="var(--accent3)" opacity="0.6"/>
  </svg>`,

  /* ── MASTER: Flame-born berserker, spiky hair, burning eyes ── */
  master: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="mg0" cx="50%" cy="20%" r="70%">
        <stop offset="0%"   stop-color="#ffbb33" stop-opacity="1"/>
        <stop offset="50%"  stop-color="#e05800" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="#660000" stop-opacity="0.1"/>
      </radialGradient>
      <filter id="mf0">
        <feGaussianBlur stdDeviation="3" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="mf1"><feGaussianBlur stdDeviation="4"/></filter>
    </defs>
    <!-- Deep fire glow -->
    <ellipse cx="28" cy="30" rx="24" ry="22" fill="#e04000" opacity="0.07" filter="url(#mf1)"/>
    <!-- Shadow -->
    <ellipse cx="28" cy="54" rx="18" ry="4.5" fill="#e05000" opacity="0.25"/>
    <!-- Flame wisps left / right -->
    <path d="M9  33 Q5 20 11 13 Q7 25 14 30"  fill="#ff9030" opacity="0.28"/>
    <path d="M47 33 Q51 20 45 13 Q49 25 42 30" fill="#ff9030" opacity="0.28"/>
    <path d="M7  38 Q3 22 10 10 Q6 28 13 36"  fill="#ff6010" opacity="0.16"/>
    <path d="M49 38 Q53 22 46 10 Q50 28 43 36" fill="#ff6010" opacity="0.16"/>
    <!-- Cloak of fire -->
    <path d="M8 30 Q5 46 10 54 Q28 60 46 54 Q51 46 48 30 Q37 37 28 34 Q19 37 8 30Z"
          fill="#e05000" opacity="0.1"/>
    <!-- Body armour -->
    <path d="M17 25 L18 50 Q28 54.5 38 50 L39 25 Q28 29.5 17 25Z"
          fill="url(#mg0)" opacity="0.75"/>
    <!-- Chest rune -->
    <text x="28" y="39" font-size="9" fill="#ffcc20"
          text-anchor="middle" font-family="serif" opacity="0.85">卍</text>
    <!-- Head -->
    <ellipse cx="28" cy="15" rx="12" ry="13"
             fill="#e05800" opacity="0.58" filter="url(#mf0)"/>
    <!-- Wild spiky hair -->
    <path d="M17 13 L15 3  L22 10 L24 1.5 L28 9  L32 1.5 L34 10 L41 3  L39 13"
          fill="#ff9930" opacity="0.85"/>
    <path d="M18 14 L14 6  L20 11"  fill="#ffbb40" opacity="0.5"/>
    <path d="M38 14 L42 6  L36 11"  fill="#ffbb40" opacity="0.5"/>
    <!-- Burning eyes -->
    <ellipse cx="23" cy="15" rx="2.8" ry="2.2" fill="#ffcc00" opacity="0.95"/>
    <ellipse cx="33" cy="15" rx="2.8" ry="2.2" fill="#ffcc00" opacity="0.95"/>
    <ellipse cx="23" cy="15" rx="1.2" ry="1"   fill="#e03000"/>
    <ellipse cx="33" cy="15" rx="1.2" ry="1"   fill="#e03000"/>
    <!-- Battle scar -->
    <path d="M25 11 Q23 15 24 19" stroke="#c01020" stroke-width="1.1" fill="none" opacity="0.8"/>
    <!-- Fire orbit rings -->
    <ellipse cx="28" cy="28" rx="24" ry="19"
             stroke="#e05800" stroke-width="0.6" fill="none" stroke-dasharray="2 3" opacity="0.35"/>
    <ellipse cx="28" cy="28" rx="27" ry="21"
             stroke="#ff9030" stroke-width="0.3" fill="none" opacity="0.18"/>
  </svg>`,

  /* ── LEGEND: Transcendent divine being, halo, wings, all-seeing eyes ── */
  legend: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="lg0" cx="50%" cy="15%" r="85%">
        <stop offset="0%"   stop-color="#ffffff" stop-opacity="1"/>
        <stop offset="25%"  stop-color="#ffe84a" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#aa7700" stop-opacity="0.1"/>
      </radialGradient>
      <filter id="lf0">
        <feGaussianBlur stdDeviation="4" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="lf1"><feGaussianBlur stdDeviation="7"/></filter>
      <filter id="lf2">
        <feGaussianBlur stdDeviation="2" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <!-- Outer divine radiance -->
    <circle cx="28" cy="22" r="28" fill="#ffd700" opacity="0.07" filter="url(#lf1)"/>
    <!-- Shadow -->
    <ellipse cx="28" cy="54" rx="20" ry="5" fill="#ffd700" opacity="0.35"/>
    <!-- Wings of light — left -->
    <path d="M4 30 Q0 16 9  9  Q17 18 15 33"  fill="#ffe84a" opacity="0.22"/>
    <path d="M2 35 Q-3 17 7  7  Q13 22 12 36"  fill="#ffd700" opacity="0.13"/>
    <!-- Wings of light — right -->
    <path d="M52 30 Q56 16 47 9  Q39 18 41 33"  fill="#ffe84a" opacity="0.22"/>
    <path d="M54 35 Q59 17 49 7  Q43 22 44 36"  fill="#ffd700" opacity="0.13"/>
    <!-- Divine armour -->
    <path d="M15 25 L17 52 Q28 56.5 39 52 L41 25 Q28 29.5 15 25Z"
          fill="url(#lg0)" opacity="0.8"/>
    <!-- Armour light seam -->
    <path d="M28 26 L28 51" stroke="white" stroke-width="0.7" opacity="0.35"/>
    <!-- Transcendent head -->
    <ellipse cx="28" cy="13" rx="12" ry="13"
             fill="#ffd700" opacity="0.45" filter="url(#lf0)"/>
    <ellipse cx="28" cy="13" rx="9.5" ry="10.5"
             fill="white" opacity="0.25"/>
    <!-- Halo -->
    <ellipse cx="28" cy="3.5" rx="13" ry="3.2"
             stroke="#ffd700" stroke-width="1.8" fill="none" opacity="0.95"
             filter="url(#lf2)"/>
    <ellipse cx="28" cy="3.5" rx="13" ry="3.2"
             stroke="white" stroke-width="0.6" fill="none" opacity="0.5"/>
    <!-- Crown spikes -->
    <path d="M17 9 L19.5 2 L23.5 7.5 L28 1 L32.5 7.5 L36.5 2 L39 9"
          stroke="#ffd700" stroke-width="1.6" fill="none" opacity="0.95"
          filter="url(#lf2)"/>
    <!-- All-seeing eyes -->
    <ellipse cx="22.5" cy="13" rx="3.2" ry="2.6" fill="white" opacity="0.95"/>
    <ellipse cx="33.5" cy="13" rx="3.2" ry="2.6" fill="white" opacity="0.95"/>
    <ellipse cx="22.5" cy="13" rx="1.8" ry="1.5" fill="#ffd700" opacity="1"/>
    <ellipse cx="33.5" cy="13" rx="1.8" ry="1.5" fill="#ffd700" opacity="1"/>
    <circle  cx="22.5" cy="13" r="0.7"  fill="white"/>
    <circle  cx="33.5" cy="13" r="0.7"  fill="white"/>
    <!-- Gold rune chest -->
    <text x="28" y="39" font-size="10" fill="#ffd700"
          text-anchor="middle" font-family="serif" opacity="0.9">✦</text>
    <!-- Divine star particles -->
    <circle cx="7"  cy="20" r="1.8" fill="#ffd700" opacity="0.9"/>
    <circle cx="49" cy="24" r="1.8" fill="#ffd700" opacity="0.9"/>
    <circle cx="14" cy="44" r="1.1" fill="white"   opacity="0.7"/>
    <circle cx="42" cy="46" r="1.1" fill="white"   opacity="0.7"/>
    <circle cx="20" cy="7"  r="0.8" fill="#ffd700" opacity="0.6"/>
    <circle cx="36" cy="6"  r="0.8" fill="white"   opacity="0.5"/>
    <!-- Orbital divine rings -->
    <ellipse cx="28" cy="28" rx="26" ry="21"
             stroke="#ffd700" stroke-width="0.5"
             fill="none" stroke-dasharray="4 3" opacity="0.45"/>
    <ellipse cx="28" cy="28" rx="21" ry="17"
             stroke="white"  stroke-width="0.3"
             fill="none" opacity="0.2"/>
  </svg>`,
};

function getAvatarSvg(tier = 'novice') {
  return AVATAR_SVGS[tier] || AVATAR_SVGS.novice;
}
