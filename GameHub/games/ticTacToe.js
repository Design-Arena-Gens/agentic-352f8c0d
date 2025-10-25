const WIN_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

export function createTicTacToe(root, { mode = 'easy-ai', soundManager, onComplete }) {
  const state = {
    board: Array(9).fill(null),
    current: 'X',
    locked: false
  };

  const wrapper = document.createElement('div');
  wrapper.className = 'flex flex-col gap-4 w-full';
  const status = document.createElement('div');
  status.className = 'text-center text-lg font-semibold';
  const boardEl = document.createElement('div');
  boardEl.className = 'grid grid-cols-3 gap-3 max-w-sm mx-auto';

  for (let i = 0; i < 9; i += 1) {
    const cell = document.createElement('button');
    cell.className = 'aspect-square rounded-2xl border border-slate-700 bg-slate-900/70 text-4xl font-bold flex items-center justify-center transition-transform hover:scale-105';
    cell.setAttribute('aria-label', `Cell ${i + 1}`);
    cell.addEventListener('click', () => handleMove(i));
    boardEl.appendChild(cell);
  }

  wrapper.appendChild(status);
  wrapper.appendChild(boardEl);
  root.appendChild(wrapper);
  updateStatus();

  function handleMove(index) {
    if (state.locked || state.board[index]) return;
    state.board[index] = state.current;
    soundManager.play('action');
    render();

    const winner = checkWinner(state.board);
    if (winner || isBoardFull()) {
      finishGame(winner);
      return;
    }

    state.current = state.current === 'X' ? 'O' : 'X';
    updateStatus();

    if (isAiTurn()) {
      state.locked = true;
      setTimeout(() => {
        aiMove();
        state.locked = false;
      }, 400);
    }
  }

  function isAiTurn() {
    return mode !== 'local-multiplayer' && state.current === 'O';
  }

  function aiMove() {
    const index = selectAiMove();
    if (index === null) return;
    state.board[index] = 'O';
    soundManager.play('action');
    render();

    const winner = checkWinner(state.board);
    if (winner || isBoardFull()) {
      finishGame(winner);
      return;
    }

    state.current = 'X';
    updateStatus();
  }

  function selectAiMove() {
    const available = state.board.map((val, idx) => (val ? null : idx)).filter((val) => val !== null);
    if (mode === 'easy-ai') {
      return available[Math.floor(Math.random() * available.length)];
    }

    if (mode === 'normal-ai') {
      for (const combo of WIN_COMBOS) {
        const [a, b, c] = combo;
        const values = [state.board[a], state.board[b], state.board[c]];
        if (values.filter((v) => v === 'O').length === 2 && values.includes(null)) {
          return combo[values.indexOf(null)];
        }
      }
      for (const combo of WIN_COMBOS) {
        const [a, b, c] = combo;
        const values = [state.board[a], state.board[b], state.board[c]];
        if (values.filter((v) => v === 'X').length === 2 && values.includes(null)) {
          return combo[values.indexOf(null)];
        }
      }
      return available[Math.floor(Math.random() * available.length)];
    }

    return minimaxMove(state.board);
  }

  function minimaxMove(board) {
    let bestScore = -Infinity;
    let move = null;
    board.forEach((val, idx) => {
      if (!val) {
        board[idx] = 'O';
        const score = minimax(board, 0, false);
        board[idx] = null;
        if (score > bestScore) {
          bestScore = score;
          move = idx;
        }
      }
    });
    return move;
  }

  function minimax(board, depth, isMaximizing) {
    const winner = checkWinner(board);
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (board.every((cell) => cell)) return 0;

    if (isMaximizing) {
      let best = -Infinity;
      board.forEach((cell, idx) => {
        if (!cell) {
          board[idx] = 'O';
          best = Math.max(best, minimax(board, depth + 1, false));
          board[idx] = null;
        }
      });
      return best;
    }

    let best = Infinity;
    board.forEach((cell, idx) => {
      if (!cell) {
        board[idx] = 'X';
        best = Math.min(best, minimax(board, depth + 1, true));
        board[idx] = null;
      }
    });
    return best;
  }

  function render() {
    Array.from(boardEl.children).forEach((cell, index) => {
      cell.textContent = state.board[index] || '';
      cell.classList.remove('bg-emerald-600/40');
    });
    const winner = checkWinner(state.board);
    if (winner) {
      highlightWinner(winner.combo);
    }
  }

  function highlightWinner(combo) {
    combo.forEach((idx) => {
      boardEl.children[idx].classList.add('bg-emerald-600/40');
    });
    soundManager.play('update');
  }

  function updateStatus() {
    status.textContent = `Turn: ${state.current}`;
  }

  function checkWinner(board) {
    for (const combo of WIN_COMBOS) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { player: board[a], combo };
      }
    }
    return null;
  }

  function isBoardFull() {
    return state.board.every(Boolean);
  }

  function finishGame(winner) {
    state.locked = true;
    let message;
    let score = 25;
    if (winner) {
      if (winner.player === 'X') {
        message = 'You conquered the board!';
        score = mode === 'local-multiplayer' ? 80 : 120;
      } else {
        message = 'The AI outsmarted you this time.';
        score = 10;
      }
    } else {
      message = 'It\'s a draw! Equally matched minds.';
      score = 60;
    }
    onComplete({ score, message });
  }

  function destroy() {
    root.innerHTML = '';
  }

  return { destroy };
}
