const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const StartBtn = document.getElementById("StartBtn");
const PauseBtn = document.getElementById("PauseBtn");
const RestartBtn = document.getElementById("RestartBtn");
const ScoreEl = document.getElementById("score");
const LivesEl = document.getElementById("lives");
const ThemeBtn = document.getElementById("ThemeBtn");

// --- Variables ---
let animationId = null;
let running = false;
let lastTime = 0;
let spawnTimer = 0;
let spawnInterval = 1000;
let items = [];
let score = 0;
let lives = 3;
let difficultyIncreaseScore = 10;

const paddle = {
    width: 120,
    height: 16,
    x: (canvas.width - 120) / 2,
    y: canvas.height - 30,
    speed: 420,
    vx: 0
};

const keys = { left: false, right: false };

// --- Funciones auxiliares ---
function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function spawnItem() {
    const radius = rand(10, 18);
    const speed = rand(120, 230) + Math.min(score * 3, 300);
    const color = `hsl(${Math.floor(rand(0, 360))} 80% 50%)`;
    items.push({
        x: rand(radius, canvas.width - radius),
        y: -radius,
        r: radius,
        speed,
        color
    });
}

function resetGame() {
    items = [];
    score = 0;
    lives = 3;
    spawnInterval = 1000;
    updateHUD();
    running = false;
    cancelAnimationFrame(animationId);
    animationId = null;
}

function updateHUD() {
    ScoreEl.textContent = `Puntuación: ${score}`;
    LivesEl.textContent = `Vidas: ${lives}`;
}

function circleRectCollision(circle, rect) {
    const nearestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const nearestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    const dx = circle.x - nearestX;
    const dy = circle.y - nearestY;
    return (dx * dx + dy * dy) <= (circle.r * circle.r);
}

function update(delta) {
    const dt = delta / 1000;
    paddle.vx = keys.left ? -paddle.speed : keys.right ? paddle.speed : 0;
    paddle.x += paddle.vx * dt;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x));

    for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.speed * dt;

        if (circleRectCollision(it, paddle)) {
            score++;
            items.splice(i, 1);
            updateHUD();

            if (score % difficultyIncreaseScore === 0) {
                spawnInterval = Math.max(300, spawnInterval - 100);
            }
            continue;
        }

        if (it.y - it.r > canvas.height) {
            items.splice(i, 1);
            lives--;
            updateHUD();
            if (lives <= 0) {
                endGame();
                return;
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, 'rgba(255,255,255,0.65)');
    g.addColorStop(1, 'rgba(200,230,255,0.3)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Paddle
    ctx.fillStyle = '#0d47a1';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Items
    items.forEach(it => {
        ctx.beginPath();
        ctx.fillStyle = it.color;
        ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.arc(it.x - it.r * 0.35, it.y - it.r * 0.35, it.r * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    });

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.font = '14px Roboto, sans-serif';
    ctx.fillText(`Puntos: ${score}`, 10, 22);
    ctx.fillText(`Vidas: ${lives}`, canvas.width - 80, 22);

    if (!running && lives > 0 && score === 0) {
        ctx.fillStyle = 'rgba(13,71,161,0.9)';
        ctx.font = '20px Roboto, sans-serif';
        ctx.fillText('Pulsa INICIAR para jugar', canvas.width / 2 - 110, canvas.height / 2);
    }

    if (!running && lives <= 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '28px Roboto, sans-serif';
        ctx.fillText('GAME OVER', canvas.width / 2 - 80, canvas.height / 2 - 10);
        ctx.font = '16px Roboto, sans-serif';
        ctx.fillText(`Puntuación final: ${score}`, canvas.width / 2 - 85, canvas.height / 2 + 20);
        ctx.fillText('Pulsa REINICIAR para jugar otra vez', canvas.width / 2 - 135, canvas.height / 2 + 50);
    }
}

function endGame() {
    running = false;
    cancelAnimationFrame(animationId);
    animationId = null;
    draw();
}

function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    spawnTimer += delta;
    if (spawnTimer > spawnInterval) {
        spawnItem();
        spawnTimer = 0;
    }

    update(delta);
    draw();

    if (running) animationId = requestAnimationFrame(loop);
}

// --- Controles ---
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    paddle.x = mx - paddle.width / 2;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x));
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const tx = touch.clientX - rect.left;
    paddle.x = tx - paddle.width / 2;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x));
}, { passive: false });

// --- Botones UI ---
StartBtn.addEventListener('click', () => {
    if (!running) {
        running = true;
        lastTime = 0;
        spawnTimer = 0;
        animationId = requestAnimationFrame(loop);
    }
});

PauseBtn.addEventListener('click', () => {
    if (running) {
        running = false;
        cancelAnimationFrame(animationId);
        animationId = null;
        PauseBtn.textContent = 'Continuar';
    } else {
        if (lives > 0) {
            running = true;
            lastTime = 0;
            animationId = requestAnimationFrame(loop);
            PauseBtn.textContent = 'Pausar';
        }
    }
});

RestartBtn.addEventListener('click', () => {
    resetGame();
    draw();
});

ThemeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");

    const dark = document.body.classList.contains("dark-theme");
    ThemeBtn.textContent = dark ? "Tema Claro" : "Tema Oscuro";
});


updateHUD();
draw();
