# Zelda Block - Retro Adventure Game

A Legend of Zelda-inspired browser game built with Phaser 3. Explore a 9x9 world, fight enemies, collect items, and defeat the boss!

![Game Screenshot](https://img.shields.io/badge/status-playable-success)
![Built with Phaser](https://img.shields.io/badge/Phaser-3.80.1-blue)

## 🎮 Features

- **Expansive World**: Explore 81 unique rooms in a 9x9 grid world
- **Screen-by-Screen Navigation**: Classic 8-bit Zelda-style room transitions
- **Combat System**: Attack enemies with your sword using the spacebar
- **Enemy AI**: Fight regular enemies and a challenging boss battle
- **Health System**: 6 hearts of health with damage and invincibility mechanics
- **Inventory**: Collect keys, rupees, bombs, and the boss key
- **Interactive Obstacles**: Unlock doors with keys to progress
- **Item Drops**: Enemies drop health potions and rupees
- **Sound Effects**: Retro-style audio using Web Audio API
- **Beautiful Tilesets**: Custom outdoor tiles with grass variety for visual depth

## 🕹️ Controls

- **Arrow Keys**: Move player (up, down, left, right)
- **Spacebar**: Attack with sword
- **E Key**: Use key on doors (when near a door)

## 🚀 How to Run

### Local Development

1. Clone the repository:
```bash
git clone git@github.com:jakenbear/zelda-block.git
cd zelda-block
```

2. Start a local web server (required for loading assets):
```bash
python3 -m http.server 8000
```

3. Open your browser to:
```
http://localhost:8000/index.html
```

### Alternative Web Servers

**Node.js:**
```bash
npx serve
```

**PHP:**
```bash
php -S localhost:8000
```

## 📦 Project Structure

```
zelda-block/
├── index.html              # Main HTML file
├── game.js                 # Game logic and Phaser configuration
├── tile_ground.png         # Ground tileset (9x9 grid of 16x16 tiles)
├── player-sprite.png       # Player character sprite sheet
├── tileset_reference.html  # Developer tool for tile frame numbers
└── README.md              # This file
```

## 🎯 Game Objectives

1. **Explore the World**: Navigate through 81 rooms to find items and enemies
2. **Collect Keys**: Find regular keys to unlock doors blocking your path
3. **Defeat Enemies**: Clear rooms of enemies to find item drops
4. **Find the Boss Key**: Defeat enemies to discover the boss key in room (7,7)
5. **Boss Battle**: Use the boss key to enter room (8,8) and defeat the boss
6. **Victory**: Collect the boss key drop to win the game!

## 🗺️ World Layout

The game world is a 9x9 grid of rooms (coordinates 0,0 to 8,8):
- **Starting Room**: (0,0) - Top-left corner
- **Boss Room**: (8,8) - Bottom-right corner (requires boss key)
- **Boss Key Room**: (7,7) - Contains the boss key after clearing enemies
- **Special Rooms**: Various rooms contain keys, doors, and items

## 🎨 Game Elements

### Items
- **Keys** 🔑: Open regular doors
- **Boss Key** 🔴: Opens the boss room door
- **Rupees** 💎: Collectible currency (green gems)
- **Health Potions** 🧪: Restore 2 hearts
- **Bombs** 💣: Collectible items (future feature)

### Enemies
- **Regular Enemies**: Red squares with 2 HP, random movement
- **Boss**: Large enemy with 10 HP and chase AI

### Obstacles
- **Walls**: Brown rock tiles - impassable
- **Water**: Blue tiles - impassable
- **Doors**: Require keys to unlock and pass through

## 🛠️ Technical Details

- **Engine**: Phaser 3.80.1
- **Game Size**: 256x240 pixels (scaled 3x)
- **Tile Size**: 16x16 pixels
- **Grid**: 16x15 tiles per room
- **Physics**: Arcade physics system
- **Audio**: Web Audio API with procedural sound generation

## 🎵 Sound Effects

- **Sword Attack**: Square wave at 200Hz
- **Enemy Hit**: Sawtooth wave at 150Hz
- **Item Pickup**: Sine wave at 800Hz
- **Player Damage**: Triangle wave at 100Hz
- **Door Unlock**: Square wave at 400Hz

## 📝 Development Notes

### Tile Frame Numbers
The tileset uses a 9-tiles-per-row layout (144x144 px):
- **Grass Variety**: Frames 67, 68, 69, 76, 77, 78 (randomly selected)
- **Water**: Frame 13
- **Wall**: Frame 27

### Room Generation
- Predefined rooms for key locations (0,0), (8,8), etc.
- Template-based procedural generation for remaining rooms
- 5 different room types that rotate based on coordinates
- Dynamic edge blocking based on world boundaries

## 🚀 Deployment

Deploy as a static site to any of these platforms:

**GitHub Pages:**
```bash
# Enable GitHub Pages in repository settings
# Set source to main branch
```

**Netlify:**
```bash
# Drag and drop the folder to Netlify
# Or connect your GitHub repository
```

**Vercel:**
```bash
# Import your GitHub repository
# Deploy as static site
```

## 🤝 Contributing

This is a learning project, but suggestions and improvements are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📜 License

MIT License - Feel free to use this project for learning or building your own games!

## 🎮 Future Enhancements

Potential features to add:
- [ ] Bomb usage mechanics
- [ ] More enemy types
- [ ] Power-ups and equipment upgrades
- [ ] Save/load game state
- [ ] Background music
- [ ] More boss fights
- [ ] Dungeon system
- [ ] NPC dialogue
- [ ] Quest system

## 🙏 Acknowledgments

- Inspired by The Legend of Zelda (NES, 1986)
- Built with [Phaser 3](https://phaser.io/)
- Tileset: 16x16 Outdoors Tileset

---

**🤖 Generated with [Claude Code](https://claude.com/claude-code)**

**Co-Authored-By: Claude <noreply@anthropic.com>**

Enjoy your adventure! 🗡️✨
