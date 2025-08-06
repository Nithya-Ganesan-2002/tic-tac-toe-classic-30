import React, { useState, useEffect } from "react";
import "./App.css";

/*
  PRIMARY:   #3498db
  SECONDARY: #2ecc71
  ACCENT:    #e74c3c
  LIGHT THEME: modern, minimalistic
*/

// --- Minimal Tic Tac Toe ----------------------------------------------------

// Square UI Component
function Square({ value, onClick, isWin }) {
  return (
    <button
      className={`ttt-square${isWin ? " win" : ""}`}
      onClick={onClick}
      aria-label={value ? `${value} square` : "empty square"}
    >
      {value}
    </button>
  );
}

// Board UI Component
function Board({ squares, onSquareClick, winLine }) {
  return (
    <div className="ttt-board">
      {squares.map((row, i) => (
        <div className="ttt-board-row" key={i}>
          {row.map((value, j) => (
            <Square
              key={3 * i + j}
              value={value}
              onClick={() => onSquareClick(i, j)}
              isWin={
                winLine &&
                winLine.some(([wi, wj]) => wi === i && wj === j)
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  // --- Game State ---
  const gameModes = [
    { value: "pvp", label: "Player vs Player" },
    { value: "ai", label: "Player vs Computer" }
  ];
  const [mode, setMode] = useState("pvp");
  const [squares, setSquares] = useState([
    ["", "", ""],
    ["", "", ""],
    ["", "", ""]
  ]);
  const [xIsNext, setXIsNext] = useState(true);
  const [winnerInfo, setWinnerInfo] = useState({ winner: null, line: null, isDraw: false });
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [lastStart, setLastStart] = useState("O"); // alternate who starts
  const [aiThinking, setAiThinking] = useState(false);

  // --- Color palette for theme ---
  useEffect(() => {
    document.documentElement.style.setProperty("--ttt-primary", "#3498db");
    document.documentElement.style.setProperty("--ttt-secondary", "#2ecc71");
    document.documentElement.style.setProperty("--ttt-accent", "#e74c3c");
    document.documentElement.style.setProperty("--ttt-board-bg", "#fff");
    document.documentElement.style.setProperty("--ttt-border", "#e9ecef");
    document.documentElement.style.setProperty("--ttt-score", "#555");
    document.documentElement.style.setProperty("--ttt-light", "#f8fafc");
  }, []);

  // --- Reset board for a new match ---
  function handleNewGame(newMode) {
    setSquares([
      ["", "", ""],
      ["", "", ""],
      ["", "", ""]
    ]);
    setWinnerInfo({ winner: null, line: null, isDraw: false });
    setXIsNext(lastStart === "X");
    setLastStart(lastStart === "X" ? "O" : "X");
    if (typeof newMode === "string") setMode(newMode);
    setAiThinking(false);
  }

  // --- Public reset scores and board ---
  // PUBLIC_INTERFACE
  function handleResetAll() {
    setScores({ X: 0, O: 0 });
    setLastStart("O");
    handleNewGame(mode);
  }

  // --- Check winner utility ---
  function calculateWinner(sqs) {
    const lines = [
      // horizontals
      [[0,0],[0,1],[0,2]], [[1,0],[1,1],[1,2]], [[2,0],[2,1],[2,2]],
      // verticals
      [[0,0],[1,0],[2,0]], [[0,1],[1,1],[2,1]], [[0,2],[1,2],[2,2]],
      // diagonals
      [[0,0],[1,1],[2,2]], [[0,2],[1,1],[2,0]],
    ];
    for (let line of lines) {
      const [a, b, c] = line;
      if (sqs[a[0]][a[1]] &&
        sqs[a[0]][a[1]] === sqs[b[0]][b[1]] &&
        sqs[a[0]][a[1]] === sqs[c[0]][c[1]]) {
        return { winner: sqs[a[0]][a[1]], line };
      }
    }
    // Draw check:
    if (sqs.flat().every(cell => cell !== "")) {
      return { winner: null, line: null, isDraw: true };
    }
    return { winner: null, line: null, isDraw: false };
  }

  // --- AI Utility: find best move (random or first empty) ---
  function aiMove(sqs, aiMark) {
    // Try to win, then block opponent, then pick random
    const empty = [];
    for (let i = 0; i < 3; ++i)
      for (let j = 0; j < 3; ++j)
        if (sqs[i][j] === "") empty.push([i, j]);

    function tryWinOrBlock(mark) {
      for (let [i, j] of empty) {
        const clone = sqs.map(r => r.slice());
        clone[i][j] = mark;
        if (calculateWinner(clone).winner === mark) return [i, j];
      }
      return null;
    }
    let move = tryWinOrBlock(aiMark) || tryWinOrBlock(aiMark === "O" ? "X" : "O");
    if (!move && empty.length) {
      // Pick center, then corners, then sides
      if (sqs[1][1] === "") return [1, 1];
      const corners = empty.filter(([i, j]) => (i === 0 || i === 2) && (j === 0 || j === 2));
      if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
      move = empty[Math.floor(Math.random() * empty.length)];
    }
    return move || null;
  }

  // --- Handle square click ---
  // PUBLIC_INTERFACE
  function handleSquareClick(i, j) {
    if (winnerInfo.winner || winnerInfo.isDraw || squares[i][j] !== "" || (aiThinking && mode === "ai")) return;
    const mark = xIsNext ? "X" : "O";
    const nextSquares = squares.map(r => r.slice());
    nextSquares[i][j] = mark;
    setSquares(nextSquares);
    const winRes = calculateWinner(nextSquares);
    if (winRes.winner) {
      setWinnerInfo(winRes);
      setScores(scores => ({ ...scores, [winRes.winner]: scores[winRes.winner] + 1 }));
    } else if (winRes.isDraw) {
      setWinnerInfo(winRes);
    } else {
      setXIsNext(!xIsNext);
    }
  }

  // --- AI Turn automation ---
  useEffect(() => {
    if (
      mode === "ai" &&
      !winnerInfo.winner &&
      !winnerInfo.isDraw &&
      !xIsNext // O is AI
    ) {
      setAiThinking(true);
      const aiMark = "O";
      // Short delay for more natural UX
      const id = setTimeout(() => {
        const [i, j] = aiMove(squares, aiMark) || [];
        if (typeof i === "number") {
          handleSquareClick(i, j);
        }
        setAiThinking(false);
      }, 380);
      return () => clearTimeout(id);
    }
  }, [mode, winnerInfo, xIsNext, squares]);

  // --- Minimal header and controls ---
  const statusMessage = winnerInfo.winner
    ? `Winner: ${winnerInfo.winner}`
    : winnerInfo.isDraw
      ? "Draw!"
      : mode === "ai" && !xIsNext
        ? "Computer's turn (O)..."
        : `Next: ${xIsNext ? "X" : "O"}`;

  // --- Render ---
  return (
    <div className="ttt-outer">
      <div className="ttt-container">
        <h1 className="ttt-title" data-testid="game-title">
          Tic Tac Toe
        </h1>
        {/* Mode selection and score display */}
        <div className="ttt-controls-row">
          <GameModeSelector value={mode} onChange={m => { handleNewGame(m); }} />
          <ScoreDisplay scores={scores} />
        </div>
        <div className="ttt-status" style={{ color: winnerInfo.winner ? "var(--ttt-accent)" : "var(--ttt-primary)" }}>
          {statusMessage}
        </div>
        <Board
          squares={squares}
          onSquareClick={handleSquareClick}
          winLine={winnerInfo.line}
        />
        <div className="ttt-bottom-row">
          <button
            className="ttt-btn"
            onClick={() => handleNewGame(mode)}
            aria-label="Restart match"
          >
            New Game
          </button>
          <button
            className="ttt-btn ttt-btn-reset"
            onClick={handleResetAll}
            aria-label="Reset scores and board"
          >
            Reset All
          </button>
        </div>
        <div className="ttt-footer">
          <span>
            {mode === "ai"
              ? <span>Player (<b>X</b>) vs Computer (<b>O</b>)</span>
              : "Player X vs Player O"}
          </span>
          <span style={{ fontSize: 12, opacity: 0.4, marginLeft: 8 }}>
            &copy; {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </div>
  );
}

// --- GameModeSelector ---
// PUBLIC_INTERFACE
function GameModeSelector({ value, onChange }) {
  return (
    <div className="ttt-mode">
      {/* Game mode select */}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="ttt-select"
        aria-label="Game mode"
      >
        <option value="pvp">Player vs Player</option>
        <option value="ai">Player vs Computer</option>
      </select>
    </div>
  );
}

// --- ScoreDisplay ---
// PUBLIC_INTERFACE
function ScoreDisplay({ scores }) {
  return (
    <div className="ttt-scorebar">
      <span className="ttt-score-x">X: {scores.X}</span>
      <span className="ttt-score-o">O: {scores.O}</span>
    </div>
  );
}

export default App;
