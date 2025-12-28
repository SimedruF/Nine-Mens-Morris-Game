export default class AIPlayer {
    constructor(scene, playerNumber) {
        this.scene = scene;
        this.playerNumber = playerNumber; // 2 pentru AI
        this.opponent = playerNumber === 1 ? 2 : 1;
        this.maxDepth = 5; // Profunzimea arborelui de decizie (mai mare = mai inteligent)
    }
    
    // Funcția principală care decide mutarea AI-ului
    makeMove() {
        const gamePhase = this.scene.gamePhase;
        
        if (gamePhase === 'placing') {
            return this.findBestPlacement();
        } else {
            return this.findBestMove();
        }
    }
    
    // Alege ce piesă adversă să elimine
    selectPieceToRemove() {
        const board = [...this.scene.board];
        let bestPosition = -1;
        let bestScore = -Infinity;
        
        for (let i = 0; i < 24; i++) {
            if (board[i] === this.opponent) {
                // Nu elimina piese din moară dacă există altele
                if (this.scene.isInMill(i) && this.scene.hasNonMillPieces(this.opponent)) {
                    continue;
                }
                
                // Evaluează importanța poziției
                const score = this.evaluatePositionImportance(i, board);
                if (score > bestScore) {
                    bestScore = score;
                    bestPosition = i;
                }
            }
        }
        
        return bestPosition;
    }
    
    // Găsește cea mai bună plasare în faza de placing (versiune agresivă)
    findBestPlacement() {
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (let i = 0; i < 24; i++) {
            if (this.scene.board[i] === 0) {
                // Simulează plasarea
                const tempBoard = [...this.scene.board];
                tempBoard[i] = this.playerNumber;
                
                // Verifică dacă formează moară
                const formsMill = this.checkMillOnBoard(tempBoard, i, this.playerNumber);
                
                // Evaluează poziția
                let score = this.evaluateBoard(tempBoard);
                
                // BONUS MARE pentru formarea unei mori (prioritate maximă!)
                if (formsMill) {
                    score += 400; // Crescut de la 100 la 300
                }
                
                // Verifică dacă creează oportunitate de moară dublă
                const createsDoubleMill = this.createsDoubleMillOpportunity(i);
                if (createsDoubleMill) {
                    score += 150; // Nou: prioritizează configurații de moară dublă
                }
                
                // Bonus pentru poziții strategice (colțuri și mijloace)
                if ([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23].includes(i)) {
                    score += 15;
                }
                
                // Verifică dacă blochează o moară potențială a adversarului
                const blocksOpponentMill = this.blocksOpponentMillPotential(i);
                if (blocksOpponentMill) {
                    score += 80; // Crescut de la 50 la 80
                }
                
                // Verifică dacă completează o linie cu 2 piese proprii
                const completesLine = this.completesPotentialMill(i);
                if (completesLine) {
                    score += 60; // Nou: prioritizează construirea morilor
                }
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { position: i };
                }
            }
        }
        
        return bestMove;
    }
    
    // Găsește cea mai bună mutare în faza de moving/flying
    findBestMove() {
        let bestMove = null;
        let bestScore = -Infinity;
        
        // Aplică algoritmul Minimax cu alpha-beta pruning
        const result = this.minimax(
            [...this.scene.board],
            this.maxDepth,
            -Infinity,
            Infinity,
            true
        );
        
        return result.move;
    }
    
    // Algoritm Minimax cu alpha-beta pruning
    minimax(board, depth, alpha, beta, maximizingPlayer) {
        // Condiție de terminare
        if (depth === 0) {
            return {
                score: this.evaluateBoard(board),
                move: null
            };
        }
        
        const moves = this.getAllPossibleMoves(board, maximizingPlayer ? this.playerNumber : this.opponent);
        
        if (moves.length === 0) {
            // Nu există mutări valide
            return {
                score: maximizingPlayer ? -10000 : 10000,
                move: null
            };
        }
        
        if (maximizingPlayer) {
            let maxScore = -Infinity;
            let bestMove = null;
            
            for (let move of moves) {
                const newBoard = this.applyMove(board, move);
                
                // Bonus imediat pentru mutări care formează mori
                let moveBonus = 0;
                if (this.checkMillOnBoard(newBoard, move.to, this.playerNumber)) {
                    moveBonus = 200; // Bonus mare pentru formarea unei mori
                }
                
                const result = this.minimax(newBoard, depth - 1, alpha, beta, false);
                const finalScore = result.score + moveBonus;
                
                if (finalScore > maxScore) {
                    maxScore = finalScore;
                    bestMove = move;
                }
                
                alpha = Math.max(alpha, finalScore);
                if (beta <= alpha) {
                    break; // Beta cut-off (alpha-beta pruning)
                }
            }
            
            return { score: maxScore, move: bestMove };
        } else {
            let minScore = Infinity;
            let bestMove = null;
            
            for (let move of moves) {
                const newBoard = this.applyMove(board, move);
                
                // Penalitate pentru adversar dacă formează moară
                let movePenalty = 0;
                if (this.checkMillOnBoard(newBoard, move.to, this.opponent)) {
                    movePenalty = 200;
                }
                
                const result = this.minimax(newBoard, depth - 1, alpha, beta, true);
                const finalScore = result.score - movePenalty;
                
                if (finalScore < minScore) {
                    minScore = finalScore;
                    bestMove = move;
                }
                
                beta = Math.min(beta, finalScore);
                if (beta <= alpha) {
                    break; // Alpha cut-off
                }
            }
            
            return { score: minScore, move: bestMove };
        }
    }
    
    // Obține toate mutările posibile pentru un jucător
    getAllPossibleMoves(board, player) {
        const moves = [];
        const piecesOnBoard = board.filter(p => p === player).length;
        const isFlying = piecesOnBoard === 3;
        
        for (let from = 0; from < 24; from++) {
            if (board[from] === player) {
                // Determină unde poate muta piesa
                const possibleDestinations = isFlying 
                    ? this.getAllEmptyPositions(board)
                    : this.getAdjacentEmptyPositions(board, from);
                
                for (let to of possibleDestinations) {
                    moves.push({ from, to });
                }
            }
        }
        
        return moves;
    }
    
    // Obține toate pozițiile goale
    getAllEmptyPositions(board) {
        const positions = [];
        for (let i = 0; i < 24; i++) {
            if (board[i] === 0) {
                positions.push(i);
            }
        }
        return positions;
    }
    
    // Obține pozițiile goale adiacente
    getAdjacentEmptyPositions(board, position) {
        const adjacent = [];
        
        for (let [a, b] of this.scene.connections) {
            if (a === position && board[b] === 0) {
                adjacent.push(b);
            } else if (b === position && board[a] === 0) {
                adjacent.push(a);
            }
        }
        
        return adjacent;
    }
    
    // Aplică o mutare pe tablă
    applyMove(board, move) {
        const newBoard = [...board];
        newBoard[move.to] = newBoard[move.from];
        newBoard[move.from] = 0;
        return newBoard;
    }
    
    // Evaluează starea tablei (funcție de evaluare euristică îmbunătățită)
    evaluateBoard(board) {
        let score = 0;
        
        // 1. Numărul de piese (mai important când adversarul are puține piese)
        const aiPieces = board.filter(p => p === this.playerNumber).length;
        const opponentPieces = board.filter(p => p === this.opponent).length;
        const pieceWeight = opponentPieces <= 4 ? 100 : 50;
        score += (aiPieces - opponentPieces) * pieceWeight;
        
        // 2. Numărul de mori formate (PRIORITATE MAXIMĂ)
        const aiMills = this.countMills(board, this.playerNumber);
        const opponentMills = this.countMills(board, this.opponent);
        score += (aiMills - opponentMills) * 150; // Crescut de la 100 la 150
        
        // 3. Mori potențiale (2 din 3 piese pe linie) - AGRESIV
        const aiPotentialMills = this.countPotentialMills(board, this.playerNumber);
        const opponentPotentialMills = this.countPotentialMills(board, this.opponent);
        score += (aiPotentialMills - opponentPotentialMills) * 50; // Crescut de la 35 la 50
        
        // 4. Mori duble potențiale (o piesă poate completa 2 mori) - FOARTE VALOROS
        const aiDoubleMills = this.countDoubleMillPotential(board, this.playerNumber);
        const opponentDoubleMills = this.countDoubleMillPotential(board, this.opponent);
        score += (aiDoubleMills - opponentDoubleMills) * 100; // Crescut de la 60 la 100
        
        // 5. Mobilitate (numărul de mutări posibile)
        const aiMobility = this.getAllPossibleMoves(board, this.playerNumber).length;
        const opponentMobility = this.getAllPossibleMoves(board, this.opponent).length;
        score += (aiMobility - opponentMobility) * 12;
        
        // 6. Blocarea mobilității adversarului
        if (opponentMobility === 0 && opponentPieces > 3) {
            score += 500; // Adversarul nu poate muta = victorie iminentă
        }
        
        // 7. Poziții strategice ocupate (colțuri și mijloace)
        const strategicPositions = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23];
        let aiStrategic = 0;
        let opponentStrategic = 0;
        
        for (let pos of strategicPositions) {
            if (board[pos] === this.playerNumber) aiStrategic++;
            if (board[pos] === this.opponent) opponentStrategic++;
        }
        
        score += (aiStrategic - opponentStrategic) * 18;
        
        // 8. Configurații de piese (piese pe același pătrat)
        const aiConfigurations = this.evaluateConfigurations(board, this.playerNumber);
        const opponentConfigurations = this.evaluateConfigurations(board, this.opponent);
        score += (aiConfigurations - opponentConfigurations) * 8;
        
        // 9. Bonus pentru closing (când adversarul are 3 piese)
        if (opponentPieces === 3 && aiPieces > 3) {
            score += 200; // Avantaj major
        }
        
        return score;
    }
    
    // Numără morile formate de un jucător
    countMills(board, player) {
        let count = 0;
        
        for (let mill of this.scene.mills) {
            if (board[mill[0]] === player && 
                board[mill[1]] === player && 
                board[mill[2]] === player) {
                count++;
            }
        }
        
        return count;
    }
    
    // Numără morile potențiale (2 din 3 piese)
    countPotentialMills(board, player) {
        let count = 0;
        
        for (let mill of this.scene.mills) {
            const pieces = [board[mill[0]], board[mill[1]], board[mill[2]]];
            const playerPieces = pieces.filter(p => p === player).length;
            const emptySpots = pieces.filter(p => p === 0).length;
            
            if (playerPieces === 2 && emptySpots === 1) {
                count++;
            }
        }
        
        return count;
    }
    
    // Verifică dacă o poziție formează moară pe o tablă dată
    checkMillOnBoard(board, position, player) {
        for (let mill of this.scene.mills) {
            if (mill.includes(position)) {
                if (board[mill[0]] === player && 
                    board[mill[1]] === player && 
                    board[mill[2]] === player) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Verifică dacă o plasare blochează o moară potențială a adversarului
    blocksOpponentMillPotential(position) {
        for (let mill of this.scene.mills) {
            if (mill.includes(position)) {
                const pieces = [
                    this.scene.board[mill[0]], 
                    this.scene.board[mill[1]], 
                    this.scene.board[mill[2]]
                ];
                const opponentPieces = pieces.filter(p => p === this.opponent).length;
                const emptySpots = pieces.filter(p => p === 0).length;
                
                // Adversarul are 2 piese și un spațiu gol
                if (opponentPieces === 2 && emptySpots === 1) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Verifică dacă o poziție creează oportunitate de moară dublă
    createsDoubleMillOpportunity(position) {
        let potentialMills = 0;
        
        for (let mill of this.scene.mills) {
            if (mill.includes(position)) {
                const pieces = [
                    this.scene.board[mill[0]],
                    this.scene.board[mill[1]],
                    this.scene.board[mill[2]]
                ];
                
                const myPieces = pieces.filter(p => p === this.playerNumber).length;
                const emptySpots = pieces.filter(p => p === 0).length;
                
                // Dacă am deja o piesă și sunt 2 spații goale
                if (myPieces === 1 && emptySpots === 2) {
                    potentialMills++;
                }
            }
        }
        
        // Dacă poziția participă în 2+ linii potențiale
        return potentialMills >= 2;
    }
    
    // Verifică dacă poziția completează o linie cu 2 piese proprii
    completesPotentialMill(position) {
        for (let mill of this.scene.mills) {
            if (mill.includes(position)) {
                const pieces = [
                    this.scene.board[mill[0]],
                    this.scene.board[mill[1]],
                    this.scene.board[mill[2]]
                ];
                
                const myPieces = pieces.filter(p => p === this.playerNumber).length;
                const emptySpots = pieces.filter(p => p === 0).length;
                
                // Am 2 piese și un spațiu gol (linia mea va avea 3 piese)
                if (myPieces === 2 && emptySpots === 1) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Evaluează importanța unei poziții pentru eliminare
    evaluatePositionImportance(position, board) {
        let score = 0;
        
        // Preferă să elimine piese care pot forma mori
        for (let mill of this.scene.mills) {
            if (mill.includes(position)) {
                const pieces = [board[mill[0]], board[mill[1]], board[mill[2]]];
                const opponentPieces = pieces.filter(p => p === this.opponent).length;
                
                if (opponentPieces >= 2) {
                    score += 50;
                }
            }
        }
        
        // Preferă poziții strategice
        if ([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23].includes(position)) {
            score += 20;
        }
        
        return score;
    }
    
    // Numără potențialul de mori duble (o mișcare poate completa 2 mori)
    countDoubleMillPotential(board, player) {
        let count = 0;
        
        for (let i = 0; i < 24; i++) {
            if (board[i] === 0) {
                let millsCompletable = 0;
                
                for (let mill of this.scene.mills) {
                    if (mill.includes(i)) {
                        const pieces = [board[mill[0]], board[mill[1]], board[mill[2]]];
                        const playerPieces = pieces.filter(p => p === player).length;
                        const emptySpots = pieces.filter(p => p === 0).length;
                        
                        if (playerPieces === 2 && emptySpots === 1) {
                            millsCompletable++;
                        }
                    }
                }
                
                if (millsCompletable >= 2) {
                    count++;
                }
            }
        }
        
        return count;
    }
    
    // Evaluează configurația pieselor (piese pe același pătrat)
    evaluateConfigurations(board, player) {
        let score = 0;
        
        // Definește pătratele
        const squares = [
            [0, 1, 2, 3, 4, 5, 6, 7],     // Exterior
            [8, 9, 10, 11, 12, 13, 14, 15], // Mijloc
            [16, 17, 18, 19, 20, 21, 22, 23] // Interior
        ];
        
        for (let square of squares) {
            const piecesInSquare = square.filter(pos => board[pos] === player).length;
            // Bonus pentru a avea multiple piese pe același pătrat
            if (piecesInSquare >= 3) {
                score += piecesInSquare * 2;
            }
        }
        
        return score;
    }
}
