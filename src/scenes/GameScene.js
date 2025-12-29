import AIPlayer from '../ai/AIPlayer.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // Constante pentru tabla de joc (dimensiune optimă pentru telefon)
        this.BOARD_SIZE = 540;
        this.BOARD_OFFSET_X = 130;
        this.BOARD_OFFSET_Y = 240;
        this.PIECE_RADIUS = 20;
        
        // Starea jocului
        this.currentPlayer = 1; // 1 = jucător alb, 2 = jucător negru
        this.gamePhase = 'placing'; // placing, moving, flying
        this.selectedPiece = null;
        this.board = new Array(24).fill(0); // 0 = gol, 1 = alb, 2 = negru
        this.piecesRemaining = { 1: 9, 2: 9 }; // Piese de plasat
        this.piecesOnBoard = { 1: 0, 2: 0 }; // Piese pe tablă
        this.removingPiece = false; // Dacă jucătorul trebuie să elimine o piesă adversă
        
        // Modul de joc și AI
        this.gameMode = 'pvp'; // 'pvp' sau 'pvai'
        this.ai = null;
        this.aiThinking = false;
        
        // Zoom
        this.zoomLevel = 1;
        this.minZoom = 0.7;
        this.maxZoom = 1.8;
        
        // Pozițiile pe tablă (coordonate relative)
        this.positions = [];
        this.connections = [];
        this.mills = [];
        
        this.initializeBoard();
    }
    
    initializeBoard() {
        // Definim cele 24 de poziții pe tablă (3 pătrate concentrice)
        // Poziții: 0-7 (exterior), 8-15 (mijloc), 16-23 (interior)
        // Dimensiuni pentru tabla de 540px
        
        const outer = 0;
        const middle = 270;  // 540 / 2
        const inner = 540;   // dimensiunea totală
        
        // Pătrat exterior (0-7)
        this.positions.push(
            { x: outer, y: outer },      // 0
            { x: middle, y: outer },     // 1
            { x: inner, y: outer },      // 2
            { x: inner, y: middle },     // 3
            { x: inner, y: inner },      // 4
            { x: middle, y: inner },     // 5
            { x: outer, y: inner },      // 6
            { x: outer, y: middle }      // 7
        );
        
        // Pătrat mijlociu (8-15)
        const outerM = 90;    // 540 * 1/6
        const middleM = 270;  // 540 / 2
        const innerM = 450;   // 540 * 5/6
        
        this.positions.push(
            { x: outerM, y: outerM },      // 8
            { x: middleM, y: outerM },     // 9
            { x: innerM, y: outerM },      // 10
            { x: innerM, y: middleM },     // 11
            { x: innerM, y: innerM },      // 12
            { x: middleM, y: innerM },     // 13
            { x: outerM, y: innerM },      // 14
            { x: outerM, y: middleM }      // 15
        );
        
        // Pătrat interior (16-23)
        const outerI = 180;  // 540 * 1/3
        const middleI = 270; // 540 / 2
        const innerI = 360;  // 540 * 2/3
        
        this.positions.push(
            { x: outerI, y: outerI },      // 16
            { x: middleI, y: outerI },     // 17
            { x: innerI, y: outerI },      // 18
            { x: innerI, y: middleI },     // 19
            { x: innerI, y: innerI },      // 20
            { x: middleI, y: innerI },     // 21
            { x: outerI, y: innerI },      // 22
            { x: outerI, y: middleI }      // 23
        );
        
        // Conexiunile între poziții (vecini)
        this.connections = [
            // Exterior
            [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
            // Mijloc
            [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 8],
            // Interior
            [16, 17], [17, 18], [18, 19], [19, 20], [20, 21], [21, 22], [22, 23], [23, 16],
            // Conexiuni între pătrate
            [1, 9], [9, 17], [3, 11], [11, 19], [5, 13], [13, 21], [7, 15], [15, 23]
        ];
        
        // Definim toate morile posibile (3 piese pe linie)
        this.mills = [
            // Exterior
            [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
            // Mijloc
            [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
            // Interior
            [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
            // Verticale
            [1, 9, 17], [3, 11, 19], [5, 13, 21], [7, 15, 23]
        ];
    }
    
    init(data) {
        // Primim gameMode din MenuScene
        if (data && data.gameMode) {
            this.gameMode = data.gameMode;
        }
        
        // Inițializăm AI-ul dacă este modul PvAI
        if (this.gameMode === 'pvai') {
            this.ai = new AIPlayer(this, 2); // AI joacă cu negru (jucătorul 2)
        }
    }
    
    create() {
        // Adăugăm titlul
        const titleText = this.gameMode === 'pvai' ? 'NINE MEN\'S MORRIS - vs COMPUTER' : 'NINE MEN\'S MORRIS';
        this.add.text(400, 35, titleText, {
            fontSize: '36px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);
        
        // Info jucător curent
        this.playerText = this.add.text(400, 80, '', {
            fontSize: '22px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);
        
        // Info piese rămase
        this.piecesText = this.add.text(400, 110, '', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);
        
        // Buton înapoi la meniu - plasat jos în colțul stânga
        const backButton = this.add.text(40, 150, '← Menu', {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#34495e',
            padding: { x: 12, y: 6 }
        }).setInteractive().setScrollFactor(0);
        
        backButton.on('pointerover', () => {
            backButton.setBackgroundColor('#576574');
            this.game.canvas.style.cursor = 'pointer';
        });
        
        backButton.on('pointerout', () => {
            backButton.setBackgroundColor('#34495e');
            this.game.canvas.style.cursor = 'default';
        });
        
        backButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
        
        // Butoane de zoom - plasate lângă butonul de meniu, pe același rând
        const zoomInButton = this.add.text(160, 150, '+', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#27ae60',
            padding: { x: 10, y: 2 },
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive().setScrollFactor(0);
        
        const zoomOutButton = this.add.text(220, 150, '-', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#e74c3c',
            padding: { x: 12, y: 2 },
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive().setScrollFactor(0);
        
        const zoomResetButton = this.add.text(280, 150, '⟲', {
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#3498db',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setInteractive().setScrollFactor(0);
        
        zoomInButton.on('pointerover', () => {
            zoomInButton.setBackgroundColor('#2ecc71');
            this.game.canvas.style.cursor = 'pointer';
        });
        
        zoomInButton.on('pointerout', () => {
            zoomInButton.setBackgroundColor('#27ae60');
            this.game.canvas.style.cursor = 'default';
        });
        
        zoomInButton.on('pointerdown', () => {
            this.adjustZoom(0.2);
        });
        
        zoomOutButton.on('pointerover', () => {
            zoomOutButton.setBackgroundColor('#e67e22');
            this.game.canvas.style.cursor = 'pointer';
        });
        
        zoomOutButton.on('pointerout', () => {
            zoomOutButton.setBackgroundColor('#e74c3c');
            this.game.canvas.style.cursor = 'default';
        });
        
        zoomOutButton.on('pointerdown', () => {
            this.adjustZoom(-0.2);
        });
        
        zoomResetButton.on('pointerover', () => {
            zoomResetButton.setBackgroundColor('#5dade2');
            this.game.canvas.style.cursor = 'pointer';
        });
        
        zoomResetButton.on('pointerout', () => {
            zoomResetButton.setBackgroundColor('#3498db');
            this.game.canvas.style.cursor = 'default';
        });
        
        zoomResetButton.on('pointerdown', () => {
            this.resetZoom();
        });
        
        this.drawBoard();
        this.updateUI();
        
        // Adăugăm interactivitate
        this.input.on('pointerdown', this.handleClick, this);
        
        // Activăm drag pentru a mișca camera când e zoom
        this.cameras.main.setBounds(-400, -400, 1600, 1600);
        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown && this.zoomLevel > 1) {
                this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.zoomLevel;
                this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.zoomLevel;
            }
        });
        
        // Handler pentru schimbarea dimensiunii/orientării
        this.scale.on('resize', this.handleResize, this);
    }
    
    drawBoard() {
        // Background pentru tablă cu gradient (ajustat pentru tabla redusă cu 20%)
        const bgGraphics = this.add.graphics();
        bgGraphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
        bgGraphics.fillRoundedRect(
            this.BOARD_OFFSET_X - 30,
            this.BOARD_OFFSET_Y - 30,
            this.BOARD_SIZE + 60,
            this.BOARD_SIZE + 60,
            10
        );
        
        // Linii tablă cu glow effect
        const graphics = this.add.graphics();
        
        // Desenăm umbră pentru linii
        graphics.lineStyle(5, 0x000000, 0.3);
        this.connections.forEach(([pos1, pos2]) => {
            const p1 = this.positions[pos1];
            const p2 = this.positions[pos2];
            
            graphics.beginPath();
            graphics.moveTo(
                this.BOARD_OFFSET_X + p1.x + 2,
                this.BOARD_OFFSET_Y + p1.y + 2
            );
            graphics.lineTo(
                this.BOARD_OFFSET_X + p2.x + 2,
                this.BOARD_OFFSET_Y + p2.y + 2
            );
            graphics.strokePath();
        });
        
        // Linii principale cu efect metalic
        graphics.lineStyle(4, 0xb8c6db, 1);
        this.connections.forEach(([pos1, pos2]) => {
            const p1 = this.positions[pos1];
            const p2 = this.positions[pos2];
            
            graphics.beginPath();
            graphics.moveTo(
                this.BOARD_OFFSET_X + p1.x,
                this.BOARD_OFFSET_Y + p1.y
            );
            graphics.lineTo(
                this.BOARD_OFFSET_X + p2.x,
                this.BOARD_OFFSET_Y + p2.y
            );
            graphics.strokePath();
        });
        
        // Desenăm cercurile pentru pozițiile piesei
        this.positionCircles = [];
        this.positionGlows = [];
        
        this.positions.forEach((pos, index) => {
            // Glow outer ring
            const glow = this.add.circle(
                this.BOARD_OFFSET_X + pos.x,
                this.BOARD_OFFSET_Y + pos.y,
                this.PIECE_RADIUS + 5,
                0x4a90e2,
                0
            );
            glow.setData('position', index);
            this.positionGlows.push(glow);
            
            // Cercul principal
            const circle = this.add.circle(
                this.BOARD_OFFSET_X + pos.x,
                this.BOARD_OFFSET_Y + pos.y,
                this.PIECE_RADIUS,
                0x2d3436,
                1
            );
            circle.setStrokeStyle(3, 0x74b9ff, 0.6);
            circle.setInteractive();
            circle.setData('position', index);
            
            // Hover effects
            circle.on('pointerover', () => {
                if (this.board[index] === 0 && !this.aiThinking) {
                    glow.setAlpha(0.4);
                    this.tweens.add({
                        targets: glow,
                        scale: 1.2,
                        duration: 200,
                        ease: 'Power2'
                    });
                }
            });
            
            circle.on('pointerout', () => {
                glow.setAlpha(0);
                glow.setScale(1);
            });
            
            this.positionCircles.push(circle);
        });
        
        // Container pentru piese
        this.pieces = [];
    }
    
    handleClick(pointer) {
        // Verificăm dacă s-a dat click pe o poziție validă
        const clickedObjects = this.input.hitTestPointer(pointer);
        
        for (let obj of clickedObjects) {
            if (obj.getData('position') !== undefined) {
                const position = obj.getData('position');
                this.handlePositionClick(position);
                break;
            }
        }
    }
    
    handlePositionClick(position) {
        // Blochează input-ul dacă AI-ul gândește
        if (this.aiThinking) {
            return;
        }
        
        // În modul PvAI, doar jucătorul 1 poate face mutări manuale
        if (this.gameMode === 'pvai' && this.currentPlayer === 2) {
            return;
        }
        
        if (this.removingPiece) {
            // Elimină piesa adversă
            this.removeOpponentPiece(position);
            return;
        }
        
        if (this.gamePhase === 'placing') {
            // Plasează o piesă nouă
            this.placePiece(position);
        } else if (this.gamePhase === 'moving' || this.gamePhase === 'flying') {
            // Selectează sau mută piesa
            if (this.board[position] === this.currentPlayer) {
                this.selectPiece(position);
            } else if (this.selectedPiece !== null && this.board[position] === 0) {
                this.movePiece(position);
            }
        }
    }
    
    placePiece(position) {
        if (this.board[position] !== 0) {
            return; // Poziție ocupată
        }
        
        this.board[position] = this.currentPlayer;
        this.piecesRemaining[this.currentPlayer]--;
        this.piecesOnBoard[this.currentPlayer]++;
        
        this.createPieceGraphic(position);
        
        if (this.checkMill(position)) {
            this.removingPiece = true;
            this.updateUI();
            
            // Efect vizual pentru moară
            this.createMillEffect(position);
            
            // Dacă jucătorul formează moară, trebuie să elimine
            // În modul AI, dacă AI formează moară, îl lăsăm să elimine
            if (this.gameMode === 'pvai' && this.currentPlayer === 2) {
                this.time.delayedCall(500, () => {
                    this.aiRemovePiece();
                });
            }
        } else {
            this.switchPlayer();
        }
        
        // Verifică dacă s-a terminat faza de plasare
        if (this.piecesRemaining[1] === 0 && this.piecesRemaining[2] === 0) {
            this.gamePhase = 'moving';
            this.updateUI();
        }
    }
    
    selectPiece(position) {
        // Șterge glow-ul anterior dacă există
        if (this.selectionGlow) {
            this.selectionGlow.destroy();
            this.selectionGlow = null;
        }
        
        if (this.selectedPiece !== null && this.pieces[this.selectedPiece]) {
            this.pieces[this.selectedPiece].setScale(1);
        }
        
        this.selectedPiece = position;
        
        if (this.pieces[position]) {
            // Animație de selecție
            this.tweens.add({
                targets: this.pieces[position],
                scale: 1.15,
                duration: 200,
                ease: 'Power2'
            });
            
            // Efect de glow
            const pos = this.positions[position];
            const glow = this.add.circle(
                this.BOARD_OFFSET_X + pos.x,
                this.BOARD_OFFSET_Y + pos.y,
                this.PIECE_RADIUS + 8,
                0x00ffff,
                0.3
            );
            glow.setData('selectionGlow', true);
            
            this.tweens.add({
                targets: glow,
                alpha: 0.6,
                yoyo: true,
                repeat: -1,
                duration: 500
            });
            
            // Salvează glow-ul pentru a-l șterge mai târziu
            this.selectionGlow = glow;
        }
    }
    
    movePiece(position) {
        if (this.selectedPiece === null) return;
        
        // Verifică dacă mutarea este validă
        if (this.gamePhase === 'moving') {
            if (!this.isAdjacent(this.selectedPiece, position)) {
                return; // Nu sunt adiacente
            }
        }
        
        // Șterge glow-ul de selecție
        if (this.selectionGlow) {
            this.selectionGlow.destroy();
            this.selectionGlow = null;
        }
        
        // Mută piesa
        this.board[position] = this.board[this.selectedPiece];
        this.board[this.selectedPiece] = 0;
        
        this.pieces[position] = this.pieces[this.selectedPiece];
        this.pieces[this.selectedPiece] = null;
        
        const pos = this.positions[position];
        const targetX = this.BOARD_OFFSET_X + pos.x;
        const targetY = this.BOARD_OFFSET_Y + pos.y;
        
        // Animație de mutare
        this.tweens.add({
            targets: this.pieces[position],
            x: targetX,
            y: targetY,
            scale: 1,
            duration: 400,
            ease: 'Power2'
        });
        
        this.selectedPiece = null;
        
        if (this.checkMill(position)) {
            this.removingPiece = true;
            this.updateUI();
            
            // Efect vizual pentru moară
            this.createMillEffect(position);
            
            // Dacă AI formează moară după mutare
            if (this.gameMode === 'pvai' && this.currentPlayer === 2) {
                this.time.delayedCall(500, () => {
                    this.aiRemovePiece();
                });
            }
        } else {
            this.switchPlayer();
        }
        
        // Verifică dacă jucătorul poate zbura (mai puțin de 3 piese) - nu este necesar aici, se face în switchPlayer
    }
    
    removeOpponentPiece(position) {
        const opponent = this.currentPlayer === 1 ? 2 : 1;
        
        if (this.board[position] !== opponent) {
            return; // Nu e piesa adversă
        }
        
        // Verifică dacă piesa face parte dintr-o moară
        if (this.isInMill(position) && this.hasNonMillPieces(opponent)) {
            return; // Nu poate elimina piese din moară dacă există altele
        }
        
        this.board[position] = 0;
        this.piecesOnBoard[opponent]--;
        
        if (this.pieces[position]) {
            // Animație de eliminare cu particule
            this.createRemovalEffect(position);
            
            this.tweens.add({
                targets: this.pieces[position],
                scale: 0,
                alpha: 0,
                duration: 300,
                ease: 'Back.easeIn',
                onComplete: () => {
                    if (this.pieces[position]) {
                        this.pieces[position].destroy();
                        this.pieces[position] = null;
                    }
                }
            });
        }
        
        this.removingPiece = false;
        
        // Verifică condiția de victorie
        if (this.piecesOnBoard[opponent] < 3 && this.piecesRemaining[opponent] === 0) {
            this.showWinner(this.currentPlayer);
            return;
        }
        
        this.switchPlayer();
    }
    
    createPieceGraphic(position) {
        const pos = this.positions[position];
        const x = this.BOARD_OFFSET_X + pos.x;
        const y = this.BOARD_OFFSET_Y + pos.y;
        
        // Container pentru piesă
        const pieceContainer = this.add.container(x, y);
        
        if (this.currentPlayer === 1) {
            // Piesă albă cu gradient și efect 3D
            // Umbră
            const shadow = this.add.circle(2, 3, this.PIECE_RADIUS - 2, 0x000000, 0.3);
            pieceContainer.add(shadow);
            
            // Gradient circle (simulare 3D)
            const gradient = this.add.graphics();
            gradient.fillStyle(0xf0f0f0, 1);
            gradient.fillCircle(0, 0, this.PIECE_RADIUS - 2);
            
            // Highlight pentru efect 3D
            const highlight = this.add.circle(-4, -4, 6, 0xffffff, 0.7);
            
            // Contur
            const outline = this.add.circle(0, 0, this.PIECE_RADIUS - 2);
            outline.setStrokeStyle(3, 0xe0e0e0, 1);
            outline.setFillStyle(0xffffff, 0);
            
            pieceContainer.add([gradient, highlight, outline]);
        } else {
            // Piesă neagră cu gradient și efect 3D
            // Umbră
            const shadow = this.add.circle(2, 3, this.PIECE_RADIUS - 2, 0x000000, 0.5);
            pieceContainer.add(shadow);
            
            // Gradient circle
            const gradient = this.add.graphics();
            gradient.fillStyle(0x1a1a1a, 1);
            gradient.fillCircle(0, 0, this.PIECE_RADIUS - 2);
            
            // Highlight pentru efect 3D
            const highlight = this.add.circle(-4, -4, 5, 0x444444, 0.6);
            
            // Contur
            const outline = this.add.circle(0, 0, this.PIECE_RADIUS - 2);
            outline.setStrokeStyle(3, 0x000000, 1);
            outline.setFillStyle(0x000000, 0);
            
            pieceContainer.add([gradient, highlight, outline]);
        }
        
        // Animație de apariție
        pieceContainer.setScale(0);
        pieceContainer.setAlpha(0);
        
        this.tweens.add({
            targets: pieceContainer,
            scale: 1,
            alpha: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });
        
        this.pieces[position] = pieceContainer;
    }
    
    createRemovalEffect(position) {
        const pos = this.positions[position];
        const x = this.BOARD_OFFSET_X + pos.x;
        const y = this.BOARD_OFFSET_Y + pos.y;
        
        // Creează particule
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const distance = 30 + Math.random() * 20;
            
            const particle = this.add.circle(x, y, 3, 0xff6b6b, 1);
            
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                duration: 500 + Math.random() * 200,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    createMillEffect(position) {
        const pos = this.positions[position];
        const x = this.BOARD_OFFSET_X + pos.x;
        const y = this.BOARD_OFFSET_Y + pos.y;
        
        // Efect de strălucire pentru moară
        const glow = this.add.circle(x, y, this.PIECE_RADIUS + 10, 0xffd700, 0.6);
        
        this.tweens.add({
            targets: glow,
            scale: 2,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => glow.destroy()
        });
        
        // Particule aurii
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const particle = this.add.circle(x, y, 4, 0xffd700, 1);
            
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 40,
                y: y + Math.sin(angle) * 40,
                alpha: 0,
                scale: 0.5,
                duration: 600,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    checkMill(position) {
        const player = this.board[position];
        
        for (let mill of this.mills) {
            if (mill.includes(position)) {
                if (this.board[mill[0]] === player && 
                    this.board[mill[1]] === player && 
                    this.board[mill[2]] === player) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    isInMill(position) {
        return this.checkMill(position);
    }
    
    hasNonMillPieces(player) {
        for (let i = 0; i < 24; i++) {
            if (this.board[i] === player && !this.isInMill(i)) {
                return true;
            }
        }
        return false;
    }
    
    isAdjacent(pos1, pos2) {
        for (let [a, b] of this.connections) {
            if ((a === pos1 && b === pos2) || (a === pos2 && b === pos1)) {
                return true;
            }
        }
        return false;
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        
        // Verifică și actualizează faza de joc pentru jucătorul curent
        // Flying doar dacă are 3 piese ȘI a terminat de plasat toate piesele
        if (this.gamePhase !== 'placing' && 
            this.piecesOnBoard[this.currentPlayer] === 3 && 
            this.piecesRemaining[this.currentPlayer] === 0) {
            this.gamePhase = 'flying';
        }
        
        this.updateUI();
        
        // Verifică dacă jucătorul curent are mutări valide
        if (this.gamePhase !== 'placing' && !this.hasValidMoves()) {
            const winner = this.currentPlayer === 1 ? 2 : 1;
            this.showWinner(winner);
            return;
        }
        
        // Dacă este rândul AI-ului, fă mutarea
        if (this.gameMode === 'pvai' && this.currentPlayer === 2 && !this.removingPiece) {
            this.aiThinking = true;
            this.time.delayedCall(800, () => {
                this.makeAIMove();
            });
        }
    }
    
    makeAIMove() {
        if (!this.ai) return;
        
        // Verifică și actualizează faza de joc pentru AI
        // Flying doar dacă are 3 piese ȘI a terminat de plasat toate piesele
        if (this.piecesOnBoard[this.currentPlayer] === 3 && 
            this.piecesRemaining[this.currentPlayer] === 0 && 
            this.gamePhase !== 'flying') {
            this.gamePhase = 'flying';
        }
        
        const move = this.ai.makeMove();
        
        if (!move) {
            console.log('AI nu a găsit mutări valide');
            this.aiThinking = false;
            return;
        }
        
        if (this.gamePhase === 'placing') {
            // AI plasează o piesă
            this.placePiece(move.position);
        } else {
            // AI mută o piesă
            this.selectedPiece = move.from;
            this.movePiece(move.to);
        }
        
        this.aiThinking = false;
    }
    
    aiRemovePiece() {
        if (!this.ai) return;
        
        const position = this.ai.selectPieceToRemove();
        
        if (position !== -1) {
            this.removeOpponentPiece(position);
        }
    }
    
    hasValidMoves() {
        if (this.gamePhase === 'flying') {
            // În faza de zbor, poate muta oriunde
            for (let i = 0; i < 24; i++) {
                if (this.board[i] === 0) return true;
            }
        } else {
            // Verifică dacă există mutări adiacente
            for (let i = 0; i < 24; i++) {
                if (this.board[i] === this.currentPlayer) {
                    for (let [a, b] of this.connections) {
                        const neighbor = (a === i) ? b : (b === i) ? a : -1;
                        if (neighbor !== -1 && this.board[neighbor] === 0) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
    
    showWinner(player) {
        const winnerText = player === 1 ? 'WHITE' : 'BLACK';
        
        // Container principal cu colțuri rotunjite
        const containerGraphics = this.add.graphics();
        containerGraphics.fillStyle(0x1a1a2e, 0.95);
        containerGraphics.fillRoundedRect(250, 380, 300, 280, 20);
        
        // Border pentru container
        containerGraphics.lineStyle(3, 0x667eea, 1);
        containerGraphics.strokeRoundedRect(250, 380, 300, 280, 20);
        
        // Mesaj câștigător
        this.add.text(400, 440, `PLAYER ${winnerText}`, {
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        this.add.text(400, 480, 'WINS!', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: player === 1 ? '#ffffff' : '#ffd700'
        }).setOrigin(0.5);
        
        // Buton RESTART
        const restartBg = this.add.graphics();
        restartBg.fillStyle(0x667eea, 1);
        restartBg.fillRoundedRect(290, 520, 220, 50, 10);
        
        const restartButton = this.add.text(400, 545, 'RESTART', {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5).setInteractive();
        
        restartButton.on('pointerover', () => {
            restartBg.clear();
            restartBg.fillStyle(0x7c8ef5, 1);
            restartBg.fillRoundedRect(290, 520, 220, 50, 10);
            this.game.canvas.style.cursor = 'pointer';
        });
        
        restartButton.on('pointerout', () => {
            restartBg.clear();
            restartBg.fillStyle(0x667eea, 1);
            restartBg.fillRoundedRect(290, 520, 220, 50, 10);
            this.game.canvas.style.cursor = 'default';
        });
        
        restartButton.on('pointerdown', () => {
            if (this.gameMode === 'pvai') {
                this.scene.start('GameScene', { gameMode: 'pvai' });
            } else {
                this.scene.restart();
            }
        });
        
        // Buton MENIU
        const menuBg = this.add.graphics();
        menuBg.fillStyle(0x34495e, 1);
        menuBg.fillRoundedRect(290, 585, 220, 50, 10);
        
        const menuButton = this.add.text(400, 610, 'MENU', {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5).setInteractive();
        
        menuButton.on('pointerover', () => {
            menuBg.clear();
            menuBg.fillStyle(0x4a6278, 1);
            menuBg.fillRoundedRect(290, 585, 220, 50, 10);
            this.game.canvas.style.cursor = 'pointer';
        });
        
        menuButton.on('pointerout', () => {
            menuBg.clear();
            menuBg.fillStyle(0x34495e, 1);
            menuBg.fillRoundedRect(290, 585, 220, 50, 10);
            this.game.canvas.style.cursor = 'default';
        });
        
        menuButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
    
    updateUI() {
        let playerName = this.currentPlayer === 1 ? 'WHITE' : 'BLACK';
        if (this.gameMode === 'pvai' && this.currentPlayer === 2) {
            playerName = 'COMPUTER';
        }
        const playerColor = this.currentPlayer === 1 ? '#ffffff' : '#ffff00';
        
        if (this.aiThinking) {
            this.playerText.setText('Computer is thinking...');
            this.playerText.setColor('#ffff00');
        } else if (this.removingPiece) {
            this.playerText.setText(`Player ${playerName}: Remove opponent piece!`);
        } else {
            let phase = '';
            if (this.gamePhase === 'placing') phase = 'Place pieces';
            else if (this.gamePhase === 'moving') phase = 'Move pieces';
            else if (this.gamePhase === 'flying') phase = 'Flying';
            
            this.playerText.setText(`Player ${playerName} - ${phase}`);
        }
        
        this.playerText.setColor(playerColor);
        
        this.piecesText.setText(
            `White: ${this.piecesRemaining[1]} to place, ${this.piecesOnBoard[1]} on board | ` +
            `Black: ${this.piecesRemaining[2]} to place, ${this.piecesOnBoard[2]} on board`
        );
    }
    
    handleResize(gameSize) {
        // Reset zoom când se schimbă orientarea pentru a preveni deformarea
        this.resetZoom();
    }
    
    adjustZoom(delta) {
        this.zoomLevel = Phaser.Math.Clamp(this.zoomLevel + delta, this.minZoom, this.maxZoom);
        this.cameras.main.setZoom(this.zoomLevel);
    }
    
    resetZoom() {
        this.zoomLevel = 1;
        this.cameras.main.setZoom(1);
        this.cameras.main.centerOn(400, 450);
    }
}
