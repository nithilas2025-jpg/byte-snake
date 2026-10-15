const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const bestEl = document.getElementById('best');
const msgEl = document.getElementById('msg');
const startBtn = document.getElementById('startBtn');

const N = 18;
const CELL = 20;
canvas.width = canvas.height = N * CELL;

const COLORS = {
  grid: '#1a1d2a',
  snake: '#3de1ff',
  head: '#ffffff',
  food: '#ff5d8f'
};

let snake, dir, nextDir, food, score, level;
let running = false;
let timer = null;

let best = 0;
try { best = Number(localStorage.getItem('bytesnake-best')) || 0; } catch (e) {}
bestEl.textContent = best;

function rand(n) { return Math.floor(Math.random() * n); }

function placeFood() {
  do {
    food = { x: rand(N), y: rand(N) };
  } while (snake.some(s => s.x === food.x && s.y === food.y));
}

function reset() {
  snake = [{ x: 9, y: 9 }, { x: 8, y: 9 }, { x: 7, y: 9 }];
  dir = { x: 1, y: 0 };
  nextDir = dir;
  score = 0;
  level = 1;
  placeFood();
  updateStats();
}

function updateStats() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
}

function speed() {
  return Math.max(60, 150 - (level - 1) * 12);
}

function setDir(x, y) {
  if (x === -dir.x && y === -dir.y) return;
  nextDir = { x, y };
}

function tick() {
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  const hitWall = head.x < 0 || head.y < 0 || head.x >= N || head.y >= N;
  const hitSelf = snake.some(s => s.x === head.x && s.y === head.y);
  if (hitWall || hitSelf) {
    gameOver();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    level = 1 + Math.floor(score / 50);
    placeFood();
    updateStats();
  } else {
    snake.pop();
  }

  draw();
  timer = setTimeout(tick, speed());
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let i = 1; i < N; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL, 0);
    ctx.lineTo(i * CELL, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * CELL);
    ctx.lineTo(canvas.width, i * CELL);
    ctx.stroke();
  }

  ctx.fillStyle = COLORS.food;
  ctx.beginPath();
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
  ctx.fill();

  snake.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? COLORS.head : COLORS.snake;
    ctx.globalAlpha = i === 0 ? 1 : Math.max(0.35, 1 - i * 0.03);
    ctx.beginPath();
    ctx.roundRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2, 6);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function startGame() {
  clearTimeout(timer);
  reset();
  running = true;
  startBtn.disabled = true;
  msgEl.textContent = 'Go go go! 🐍';
  draw();
  timer = setTimeout(tick, speed());
}

function gameOver() {
  running = false;
  clearTimeout(timer);
  startBtn.disabled = false;
  startBtn.textContent = 'Play Again';

  if (score > best) {
    best = score;
    bestEl.textContent = best;
    try { localStorage.setItem('bytesnake-best', best); } catch (e) {}
    msgEl.textContent = `🔥 New best: ${score}!`;
  } else {
    msgEl.textContent = `Game over! Score: ${score}`;
  }
}

document.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  const map = {
    arrowup: [0, -1], w: [0, -1],
    arrowdown: [0, 1], s: [0, 1],
    arrowleft: [-1, 0], a: [-1, 0],
    arrowright: [1, 0], d: [1, 0]
  };
  if (map[k]) {
    e.preventDefault();
    if (running) setDir(...map[k]);
  }
});

document.querySelectorAll('.pad button').forEach(btn => {
  btn.addEventListener('pointerdown', () => {
    if (!running) return;
    const d = btn.dataset.dir;
    if (d === 'up') setDir(0, -1);
    if (d === 'down') setDir(0, 1);
    if (d === 'left') setDir(-1, 0);
    if (d === 'right') setDir(1, 0);
  });
});

let touchStart = null;
canvas.addEventListener('touchstart', (e) => {
  const t = e.touches[0];
  touchStart = { x: t.clientX, y: t.clientY };
});
canvas.addEventListener('touchend', (e) => {
  if (!touchStart || !running) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
  else setDir(0, dy > 0 ? 1 : -1);
  touchStart = null;
});

startBtn.addEventListener('click', startGame);

reset();
draw();