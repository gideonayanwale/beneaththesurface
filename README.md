# Beneath the Surface

> *"Descend. Survive. Witness the truth."*

A 2D underwater exploration + survival adventure. Built for **itch.io** using [Phaser 3](https://phaser.io/) + [Vite](https://vitejs.dev/) + TypeScript.

---

##Full Guide on How To PLsy
## 🎮 Controls

| Key | Action |
|-----|--------|
| W / ↑ | Thrust forward |
| S / ↓ | Reverse |
| A / ← | Rotate left |
| D / → | Rotate right |
| SPACE | Toggle buoyancy / antigravity |
| SHIFT | Emergency blow (strong upward burst — costs hull & O₂) |
| L | Toggle submarine lights (drains battery) |
| P | Sonar ping (reveals area — costs battery) |
| ESC | Pause / Settings |
| R (Game Over) | Retry current level |
| M (Game Over) | Return to Main Menu |

**Mobile**: Virtual joystick (left side) + Buoyancy / Emergency / Sonar buttons (right side).

---

## 📦 Project Structure

```
src/
├── main.ts               # Entry point + scene registration
├── config.ts             # Phaser game config (FIT scaling, arcade physics)
├── audio/
│   └── AudioManager.ts   # Web Audio API synth: engine hum, drones, SFX
├── data/
│   ├── DifficultyConfig.ts  # Easy/Normal/Hard multipliers
│   └── LevelConfig.ts       # 5 level configs (zone data, enemies, pickups)
├── objects/
│   ├── Submarine.ts      # Player: thrust, buoyancy, battery, lights, sonar
│   └── Enemy.ts          # 5 zone-specific AI types (fish → void entity)
└── scenes/
    ├── Preloader.ts       # Procedurally generates all textures
    ├── MainMenu.ts        # Animated menu + difficulty selector
    ├── GameScene.ts       # Core gameplay: physics, pickups, data logs, VFX
    ├── HUD.ts             # Overlay HUD: O₂, hull, battery, depth, score
    ├── GameOver.ts        # Death screen with score + zone name
    ├── Instructions.ts    # Controls + mechanic explanations
    ├── UpgradeStation.ts  # Between-level roguelite upgrade selection
    ├── VictoryScene.ts    # Post-Level-5 victory + story epilogue
    └── TouchControls.ts   # Mobile overlay: joystick + action buttons
```

---

## 🌊 Game Features

### Resources
- **O₂ (Oxygen)** — Primary survival timer. Drains faster with buoyancy active.
- **Hull Integrity** — Damaged by enemies, terrain, and pressure. Reaches 0 = implosion.
- **Battery / Power** — Drained by thrust, lights, and sonar pings.

### Mechanics
- **Buoyancy Toggle (SPACE)** — Signature mechanic. Gravity inverts when ON. Costs O₂ ×2.5.
- **Emergency Blow (SHIFT)** — Strong upward burst. Costs 18 hull + 15 O₂. 3-second cooldown.
- **Sonar Ping (P)** — Reveals area with expanding ring. Costs battery.
- **Lights (L)** — Improves visibility cone. Passively drains battery.

### Pickups
| Icon | Name | Restores |
|------|------|----------|
| 🟢 | O₂ Tank | +40 oxygen |
| 🔵 | Repair Kit | +25 hull |
| 🟡 | Power Cell | +30 battery |
| 📋 | Data Log | Story fragment + score |

### 5 Depth Zones
| Level | Name | Gravity | Special |
|-------|------|---------|---------|
| 1 | Sunlit Shallows | 200 | God rays, tutorial feel |
| 2 | Twilight Zone | 240 | Jellyfish (stun + drift) |
| 3 | Midnight Zone | 280 | Anglerfish (lure + burst) |
| 4 | Abyssal Plains | 320 | Isopods + pressure damage |
| 5 | The Hadal Void | 360 | Void entities + extreme pressure |

### Upgrades (Upgrade Station between levels)
- **O₂ Expansion** — +20% oxygen capacity
- **Hull Reinforcement** — +20 max hull
- **Power Cell** — +25% battery capacity
- **Sonar Boost** — Reduced ping cost

---

## 🚀 Running Locally

```bash
npm install
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build → dist/
```

---

## 🎵 Audio

All audio is synthesised with the **Web Audio API** — no external files required.  
Works offline. Includes:
- Zone ambient drones (5 unique per level, fade-in on transition)
- Engine hum (pitch-varies with thrust)
- Antigravity toggle sweep
- Sonar ping echo
- Creature ambient calls
- Pickup type sounds (O₂, repair, battery)
- Oxygen warning escalating beep
- Emergency blow burst
- Victory fanfare

---

## 📱 Mobile

Auto-detected via touch events. Touch overlay appears:
- Left half → dynamic joystick (rotation + thrust)
- Right side → Buoyancy toggle (large), Emergency blow + Sonar (smaller)

---

## 🎯 itch.io Deployment

Build output is in `dist/`. Upload as a zip with `index.html` included.  
Game is self-contained — no server required.


---

*Beneath the Surface v1.0 — March 2026*  
*Built for [Campfire Hackclub Ogbomoso 2026](https://hackclub.com/)*
