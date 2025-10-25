export function createSnakeGame(root, { speed = 'classic', soundManager, onComplete }) {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 360;
  canvas.className = 'rounded-2xl border border-slate-800 bg-slate-950/80';
  root.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const cellSize = 20;
  const gridWidth = canvas.width / cellSize;
  const gridHeight = canvas.height / cellSize;

  const speedMap = {
    relaxed: 180,
    classic: 120,
    turbo: 80
  };

  let snake = [
    { x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2) }
  ];
  let direction = { x: 1, y: 0 };
  let nextDirection = { ...direction };
  let food = spawnFood();
  let score = 0;
  let loopId = null;
  let running = true;

  window.addEventListener('keydown', handleKey);
  loop();

  function loop() {
    if (!running) return;
    loopId = setTimeout(() => {
      step();
      draw();
      loop();
    }, speedMap[speed] || speedMap.classic);
  }

  function step() {
    direction = nextDirection;
    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y
    };

    if (isCollision(head)) {
      running = false;
      soundManager.play('update');
      cleanup();
      onComplete({ score, message: 'Snake crashed! Try again for a higher score.' });
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 15;
      soundManager.play('notify');
      food = spawnFood();
    } else {
      snake.pop();
    }
  }

  function draw() {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#22d3ee';
    snake.forEach((segment, index) => {
      const brightness = 1 - index * 0.05;
      ctx.fillStyle = `rgba(16, 185, 129, ${brightness})`;
      ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize - 2, cellSize - 2);
    });

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(food.x * cellSize + cellSize / 2, food.y * cellSize + cellSize / 2, cellSize / 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#a5f3fc';
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillText(`Score: ${score}`, 16, 24);
  }

  function spawnFood() {
    let position;
    do {
      position = {
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight)
      };
    } while (snake.some((segment) => segment.x === position.x && segment.y === position.y));
    return position;
  }

  function isCollision({ x, y }) {
    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) return true;
    return snake.some((segment) => segment.x === x && segment.y === y);
  }

  function handleKey(event) {
    const { key } = event;
    if (['ArrowUp', 'w', 'W'].includes(key) && direction.y !== 1) {
      nextDirection = { x: 0, y: -1 };
    } else if (['ArrowDown', 's', 'S'].includes(key) && direction.y !== -1) {
      nextDirection = { x: 0, y: 1 };
    } else if (['ArrowLeft', 'a', 'A'].includes(key) && direction.x !== 1) {
      nextDirection = { x: -1, y: 0 };
    } else if (['ArrowRight', 'd', 'D'].includes(key) && direction.x !== -1) {
      nextDirection = { x: 1, y: 0 };
    }
  }

  function cleanup() {
    window.removeEventListener('keydown', handleKey);
    clearTimeout(loopId);
  }

  function destroy() {
    running = false;
    cleanup();
    root.innerHTML = '';
  }

  return { destroy };
}
