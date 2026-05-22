# Design System: Cassette Futurism

## 1. Definição do Estilo

- **Nome:** Cassette Futurism
- **Tipo:** Retro-Futuristic, Analog-Digital, Nostalgic
- **Keywords:** cassette futurism, retro-futuristic, analog, CRT, scanlines, VHS, tape deck, lo-fi, 80s tech, command line
- **Era:** 1970s-1980s Retrofuture
- **Light/Dark:** Full Dark Mode Only

## 2. Paleta de Cores

- **Primárias:** CRT Green #33FF00, Warm Beige #D2B48C, Charcoal #333333, Phosphor Amber #FFB000
- **Secundárias:** Tape Red #CC0000, Static Grey #999999, Deep Navy #1B2838, Off-White #E8E0D0

### Sem Mentions

- **No "SettleUp"** — use "Splittr" exclusively
- **No "Claude"** — use "AI" or describe specific capabilities
- **No generic AI copy** — avoid "elevate", "seamless", "unleash"

## 3. Efeitos Visuais

- CRT scanline overlay
- VHS tracking distortion
- Phosphor glow effects
- Chunky pixel borders
- Tape reel animations
- Analog meter gauges
- Command-line text effects
- LED dot matrix displays

## 4. CSS Technical Foundation

```css
/* Base Dark Theme */
background: #1B2838;
color: #33FF00;
font-family: 'VT323', 'JetBrains Mono', monospace;

/* CRT Scanline Effect */
background-image: repeating-linear-gradient(
  0deg,
  transparent,
  transparent 2px,
  rgba(0, 0, 0, 0.15) 2px,
  rgba(0, 0, 0, 0.15) 4px
);

/* Phosphor Glow */
box-shadow: 0 0 15px rgba(51, 255, 0, 0.3);
text-shadow: 0 0 5px #33FF00;

/* Filter Enhancement */
filter: brightness(1.1) contrast(1.2);

/* Border Styling */
border: 3px solid #FFB000;
border-radius: 2px; /* Sharp, pixelated corners */
```

## 5. Design System Variables

```css
:root {
  --crt-green-cassette: #33FF00;
  --phosphor-amber-cassette: #FFB000;
  --charcoal-cassette: #333333;
  --deep-navy-cassette: #1B2838;
  --tape-red-cassette: #CC0000;
  --static-grey-cassette: #999999;
  --off-white-cassette: #E8E0D0;
  --scanline-gap: 4px;
  --font-cassette: 'VT323', 'JetBrains Mono', monospace;
  --glow-green: 0 0 15px rgba(51, 255, 0, 0.3);
  --glow-amber: 0 0 15px rgba(255, 176, 0, 0.3);
}
```

## 6. Component Styling Rules

### Buttons

```css
/* Primary CRT Button */
background: #33FF00;
color: #1B2838;
border: 3px solid #FFB000;
border-radius: 0;
font-family: 'VT323', monospace;
font-weight: 700;
padding: 12px 24px;
box-shadow: 0 0 15px rgba(51, 255, 0, 0.3);
text-shadow: 0 0 5px #33FF00;
transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);

/* Hover: Phosphor glow intensifies */
&:hover {
  box-shadow: 0 0 25px rgba(51, 255, 0, 0.5), inset 0 0 10px rgba(51, 255, 0, 0.2);
  transform: scale(1.05);
  filter: brightness(1.2);
}

/* Active: Tactile press */
&:active {
  transform: scale(0.98);
  box-shadow: 0 0 10px rgba(51, 255, 0, 0.3), inset 0 0 15px rgba(51, 255, 0, 0.3);
}
```

### Text & Typography

```css
/* VT323 for all UI text */
font-family: 'VT323', 'JetBrains Mono', monospace;

/* Command-line style text */
color: #33FF00;
text-shadow: 0 0 5px #33FF00;

/* Secondary/muted text */
color: #D2B48C;
opacity: 0.8;

/* Error/warning */
color: #CC0000;
text-shadow: 0 0 5px #CC0000;
```

### Cards & Containers

```css
background: #1B2838;
border: 2px solid #FFB000;
border-radius: 2px;
box-shadow: 0 0 15px rgba(51, 255, 0, 0.2),
            inset 0 0 30px rgba(255, 176, 0, 0.05);
padding: 20px;

/* Scanline overlay */
&::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.15) 2px,
    rgba(0, 0, 0, 0.15) 4px
  );
}
```

## 7. Layout Principles

- **Grid:** CSS Grid primary
- **Max-width:** 1280px centered
- **Side padding:** 1.5rem (24px)
- **Base spacing unit:** 0.5rem (8px)
- **Section vertical gaps:** clamp(4rem, 8vw, 8rem)
- **Card spacing:** clamp(1.5rem, 3vw, 2rem)
- **Mobile collapse:** All multi-column layouts below 768px

## 8. Motion & Animation

```css
/* CRT Flicker Effect */
@keyframes crt-flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.97; }
}

/* Scanline Animation */
@keyframes scanline-animate {
  0% { transform: translateY(0); }
  100% { transform: translateY(10px); }
}

/* Glow Pulse */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 15px rgba(51, 255, 0, 0.3); }
  50% { box-shadow: 0 0 25px rgba(51, 255, 0, 0.5); }
}

/* Tape Reel Spin */
@keyframes tape-reel-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

## 9. Typography Scale

- **Display/Hero:** 3.5rem — VT323 700, tight tracking
- **H1:** 2.5rem — VT323 700
- **H2:** 1.75rem — VT323 600
- **H3:** 1.25rem — VT323 600
- **Body:** 1rem — VT323 400, line-height 1.6
- **Label:** 0.875rem — VT323 500, letter-spacing 0.05em
- **Small:** 0.75rem — VT323 400

## 10. Responsive Breakpoints

- **Mobile:** 320px–639px
- **Tablet:** 640px–1023px
- **Desktop:** 1024px+

## 11. Anti-Patterns (Banned)

- ❌ No emojis in UI — use icon system only
- ❌ No pure black (#000000) — use #1B2838 (deep navy)
- ❌ No rounded corners (except subtle 2px for accessibility)
- ❌ No 3-column equal-width layouts — use asymmetric grid
- ❌ No bright neon glows on text (max 0.3 opacity on shadow)
- ❌ No generic AI copy: "Elevate", "Seamless", "Unleash"
- ❌ No "SettleUp" or "Claude" references

## 12. Brand Voice

**Splittr** — Direct, technical, retro-inspired. No corporate speak.

- ✓ "Split bills, settle debts"
- ✓ "Scan receipts, auto-extract costs"
- ✓ "Web3 payments, instant settlement"
- ❌ "Elevate your expense experience"
- ❌ "Seamlessly integrated AI"

## 13. Checklist de Implementação

- ☑ CRT scanline overlay applied globally
- ☑ VHS tracking distortion on card hovers
- ☑ Phosphor glow on interactive elements
- ☑ Chunky pixel borders (2px–3px, sharp corners)
- ☑ Tape reel animation on loading states
- ☑ Command-line text effects on code/numbers
- ☑ LED dot matrix style on metrics
- ☑ No SettleUp or Claude mentions
- ☑ All fonts: VT323 or JetBrains Mono

---

**Last Updated:** May 22, 2026  
**Version:** 1.0.0  
**Status:** Active
