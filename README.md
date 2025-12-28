# Nine Men's Morris Game 🎮

A modern implementation of the classic Nine Men's Morris (Mill Game) built with Phaser 3 and JavaScript, featuring an AI opponent powered by the Minimax algorithm with alpha-beta pruning.

![Nine Men's Morris](https://img.shields.io/badge/Game-Nine%20Men's%20Morris-blue)
![Phaser](https://img.shields.io/badge/Phaser-3.70.0-orange)
![AI](https://img.shields.io/badge/AI-Minimax%20Algorithm-green)

## 🎯 Features

- **Two Game Modes:**
  - Player vs Player (local multiplayer)
  - Player vs Computer (AI opponent)

- **Intelligent AI:**
  - Minimax algorithm with alpha-beta pruning
  - Evaluates board positions using multiple heuristics
  - 3-level deep search tree
  - Strategic piece placement and movement

- **Enhanced Graphics:**
  - 3D-style pieces with gradients and shadows
  - Smooth animations for all game actions
  - Particle effects for mills and piece removal
  - Glow effects and hover interactions
  - Modern UI with rounded corners

- **Complete Game Logic:**
  - Three game phases: placing, moving, and flying
  - Mill detection and piece removal
  - Victory condition checking
  - Valid move validation

## 🎲 How to Play

### Game Rules

1. **Placing Phase:** Players alternate placing their 9 pieces on the board's 24 positions
2. **Mill Formation:** Form a "mill" by aligning 3 pieces in a row (horizontal or vertical)
3. **Remove Opponent Piece:** When you form a mill, you can remove one opponent piece
4. **Moving Phase:** After all pieces are placed, move pieces to adjacent empty positions
5. **Flying Phase:** When a player has only 3 pieces left, they can "fly" to any empty position
6. **Victory:** Win by reducing your opponent to fewer than 3 pieces or blocking all their moves

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/SimedruF/games.git
cd games
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## 🏗️ Tech Stack

- **Game Engine:** Phaser 3.70.0
- **Build Tool:** Vite 5.0
- **Language:** JavaScript (ES6+)
- **AI Algorithm:** Minimax with Alpha-Beta Pruning

## 🧠 AI Implementation

The AI uses a sophisticated decision-making system:

### Minimax Algorithm
- Explores the game tree up to 3 levels deep
- Alpha-beta pruning for optimization
- Evaluates positions using multiple criteria

### Evaluation Function
The AI evaluates board positions based on:
- **Piece Count** (±50 points) - Material advantage
- **Mills Formed** (±100 points) - Completed mills
- **Potential Mills** (±30 points) - Two pieces in a row
- **Mobility** (±10 points) - Available moves
- **Strategic Positions** (±15 points) - Key board positions

## 📁 Project Structure

```
games/
├── index.html              # Main HTML file
├── package.json            # Project dependencies
├── vite.config.js         # Vite configuration
└── src/
    ├── main.js            # Game initialization
    ├── ai/
    │   └── AIPlayer.js    # AI logic with Minimax
    └── scenes/
        ├── MenuScene.js   # Main menu
        └── GameScene.js   # Game board and logic
```

## 🎨 Visual Features

- **Piece Design:** 3D appearance with highlights and shadows
- **Animations:**
  - Bounce effect on piece placement
  - Smooth movement transitions
  - Scale animation on selection
  - Shrink effect on removal
- **Particle Effects:**
  - Golden particles for mill formation
  - Red particles for piece removal
- **Interactive Elements:**
  - Hover glow on empty positions
  - Selection glow with pulse animation
  - Button hover effects

## 🔧 Build Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 Game Phases

1. **Placing Phase:** Each player places 9 pieces on the board
2. **Moving Phase:** Move pieces to adjacent positions
3. **Flying Phase:** When down to 3 pieces, fly to any empty position

## 🏆 Victory Conditions

- Opponent has fewer than 3 pieces on the board
- Opponent has no valid moves available

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**SimedruF**
- GitHub: [@SimedruF](https://github.com/SimedruF)

## 🙏 Acknowledgments

- Classic Nine Men's Morris game rules
- Phaser 3 game framework
- Minimax algorithm for game AI

---

Enjoy playing Nine Men's Morris! 🎲✨
