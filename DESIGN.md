# Career City – Retro RPG Town Design Brief

**Overview**: Gamified job-search platform as immersive Zelda/Pokemon-style RPG town with pixel-art neon aesthetic. Game world wraps serious job tools (resume, cover letter, interview prep) in engaging interactive experience.

**Tone & Differentiation**: Dry, self-aware humor ("Another resume? You're brave."). Nostalgic for Millennials (22–50yo job seekers). Playful but credible—output is real and ATS-compliant.

**Color Palette**:
| Token | OKLCH | Hex | Purpose |
|-------|-------|-----|---------|
| Neon Green | 0.75 1 145 | #39FF14 | Primary, active states, XP bar |
| Neon Magenta | 0.65 1 310 | #FF00FF | Secondary, Resume Tailor building |
| Neon Cyan | 0.75 1 195 | #00FFFF | Tertiary, Cover Letter building |
| Neon Amber | 0.75 1 75 | #FFBF00 | Accent, Interview Coach |
| Black | 0 0 0 | #000000 | Background, grid lines |

**Typography**: Press Start 2P (display + body). Increased font size on mobile for readability.

**Structural Zones**:
| Zone | Treatment |
|------|-----------|
| Game Canvas | Black background, pixel-grid rendering, scanlines overlay |
| HUD (bottom) | XP bar + Career Level in neon green, pixel borders |
| Minimap (top-right) | Semi-transparent overlay, clickable location markers for fast-travel |
| NPC Dialogue | Pixel-bordered text bubble, dry humor tone |
| Mobile UI | WASD equivalents as touch buttons (arrows), 44px min touch targets |

**Shape Language**: 0px radius (pixel-perfect), 4px solid borders (retro pixel borders), 2px scanline effect.

**Component Patterns**: Pixel-bordered buttons, neon glow on active states, instant state changes (no easing for 8-bit feel). NPC avatars with color-coded rings (green=Analyzer, magenta=Tailor, cyan=Letter, amber=Coach).

**Motion**: Instant transitions for retro feel, character walk animation (4-frame cycle), dialogue fade-in/out.

**Gameplay**: Walk WASD/arrows, click NPC to open workflow, minimap click for fast-travel. XP awarded per completed task. Career Level increments every 500 XP.

**Responsive**: Mobile-first. Game canvas scales to device. Touch buttons replace keyboard on portrait. Desktop minimap always visible; mobile minimap slide-out.

**Constraints**: No gradients, no shadows (except neon glow), crisp edges, all colors from palette.
