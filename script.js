// script.js

// Configurações gerais
const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Variáveis globais do jogo
let gameState = "menu"; // "menu", "playing", "gameover"
let difficulty = "medium"; // "easy", "medium", "hard"
let theme = "light"; // "light" ou "dark"

let player1Score = 0;
let player2Score = 0;
const maxScore = 10;

let paddle1, paddle2, ball;

let keys = {};

// Ranking localStorage
const RANKING_KEY = "pongRanking";
let rawRanking = JSON.parse(localStorage.getItem(RANKING_KEY)) || [];
let ranking = rawRanking.filter(item =>
  item &&
  typeof item.name === "string" &&
  typeof item.score === "number" &&
  typeof item.date === "string"
);

// Elementos DOM do menu
const menuEl = document.getElementById("menu");
const gameEl = document.getElementById("game");
const gameOverEl = document.getElementById("game-over");
const rankingEl = document.getElementById("ranking");

const btnPlay = document.getElementById("btn-play");
const btnRestart = document.getElementById("btn-restart");
const btnToggleTheme = document.getElementById("btn-toggle-theme");

const difficultySelect = document.getElementById("difficulty-select");

const scoreEl = document.getElementById("score");
const winnerMessageEl = document.getElementById("winner-message");

const rankingListEl = document.getElementById("ranking-list");

// Classes para objetos do jogo
class Paddle {
  constructor(x, y, width, height, upKey, downKey, isPlayer = true) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = 6;
    this.upKey = upKey;
    this.downKey = downKey;
    this.isPlayer = isPlayer;
  }

  move() {
    if (this.isPlayer) {
      if (keys[this.upKey] && this.y > 0) {
        this.y -= this.speed;
      }
      if (keys[this.downKey] && this.y + this.height < HEIGHT) {
        this.y += this.speed;
      }
    } else {
      this.aiMove();
    }
  }

  aiMove() {
    let difficultyFactor = 0.04;
    if (difficulty === "easy") difficultyFactor = 0.02;
    else if (difficulty === "medium") difficultyFactor = 0.04;
    else if (difficulty === "hard") difficultyFactor = 0.08;

    if (this.y + this.height / 2 < ball.y) {
      this.y += this.speed * difficultyFactor * 10;
    } else if (this.y + this.height / 2 > ball.y) {
      this.y -= this.speed * difficultyFactor * 10;
    }

    if (this.y < 0) this.y = 0;
    if (this.y + this.height > HEIGHT) this.y = HEIGHT - this.height;
  }

  draw() {
    ctx.fillStyle = theme === "light" ? "#000" : "#FFF";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Ball {
  constructor() {
    this.radius = 10;
    this.reset();
  }

  reset() {
    this.x = WIDTH / 2;
    this.y = HEIGHT / 2;
    this.speedX = (Math.random() > 0.5 ? 1 : -1) * 5;
    this.speedY = (Math.random() * 4 - 2);
    this.speedMultiplier = 1;
  }

  update() {
    this.x += this.speedX * this.speedMultiplier;
    this.y += this.speedY * this.speedMultiplier;

    if (this.y - this.radius < 0 || this.y + this.radius > HEIGHT) {
      this.speedY = -this.speedY;
    }

    if (this.collides(paddle1) || this.collides(paddle2)) {
      this.speedX = -this.speedX;
      this.speedMultiplier += 0.1;
    }

    if (this.x - this.radius < 0) {
      player2Score++;
      this.reset();
    } else if (this.x + this.radius > WIDTH) {
      player1Score++;
      this.reset();
    }
  }

  collides(paddle) {
    return (
      this.x - this.radius < paddle.x + paddle.width &&
      this.x + this.radius > paddle.x &&
      this.y + this.radius > paddle.y &&
      this.y - this.radius < paddle.y + paddle.height
    );
  }

  draw() {
    ctx.fillStyle = theme === "light" ? "#000" : "#FFF";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Inicializa o jogo
function initGame() {
  player1Score = 0;
  player2Score = 0;

  paddle1 = new Paddle(20, HEIGHT / 2 - 50, 10, 100, "w", "s", true);
  paddle2 = new Paddle(WIDTH - 30, HEIGHT / 2 - 50, 10, 100, "ArrowUp", "ArrowDown", false);
  ball = new Ball();

  updateScoreDisplay();
}

// Atualiza a exibição do placar
function updateScoreDisplay() {
  scoreEl.textContent = `Jogador 1: ${player1Score} - Jogador 2: ${player2Score}`;
}

// Atualiza a lista de ranking no menu
function updateRanking() {
  ranking.sort((a, b) => b.score - a.score);

  rankingListEl.innerHTML = "";

  if (ranking.length === 0) {
    rankingListEl.innerHTML = "<li>Nenhum jogo registrado ainda.</li>";
    return;
  }

  ranking.forEach(entry => {
    if (
      entry &&
      typeof entry.name === "string" &&
      typeof entry.score === "number" &&
      typeof entry.date === "string"
    ) {
      const li = document.createElement("li");
      li.textContent = `${entry.date} - ${entry.name}: ${entry.score} pontos`;
      rankingListEl.appendChild(li);
    }
  });
}

// Salva no ranking localStorage
function saveRanking(name, score) {
  const now = new Date();
  const entry = {
    name: name || "Jogador",
    score: typeof score === "number" ? score : 0,
    date: now.toLocaleDateString() + " " + now.toLocaleTimeString(),
  };

  ranking.push(entry);
  localStorage.setItem(RANKING_KEY, JSON.stringify(ranking));
}

// Game loop principal
function gameLoop() {
  if (gameState !== "playing") return;

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  paddle1.move();
  paddle2.move();
  ball.update();

  paddle1.draw();
  paddle2.draw();
  ball.draw();

  updateScoreDisplay();

  if (player1Score >= maxScore || player2Score >= maxScore) {
    gameState = "gameover";
    winnerMessageEl.textContent =
      player1Score > player2Score
        ? "Jogador 1 venceu!"
        : "Jogador 2 venceu!";
    gameEl.style.display = "none";
    gameOverEl.style.display = "block";

    let playerName = prompt("Digite seu nome para o ranking:", "Jogador");
    if (playerName !== null && playerName.trim() !== "") {
      saveRanking(playerName.trim(), Math.max(player1Score, player2Score));
      updateRanking();
    } else {
      saveRanking("Jogador", Math.max(player1Score, player2Score));
      updateRanking();
    }
  } else {
    requestAnimationFrame(gameLoop);
  }
}

// Eventos teclado
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Botão jogar no menu
btnPlay.addEventListener("click", () => {
  difficulty = difficultySelect.value;
  gameState = "playing";
  menuEl.style.display = "none";
  gameOverEl.style.display = "none";
  gameEl.style.display = "block";

  initGame();
  requestAnimationFrame(gameLoop);
});

// Botão reiniciar após gameover
btnRestart.addEventListener("click", () => {
  gameState = "menu";
  gameOverEl.style.display = "none";
  gameEl.style.display = "none";
  menuEl.style.display = "block";
});

// Alternar tema claro/escuro
btnToggleTheme.addEventListener("click", () => {
  if (theme === "light") {
    theme = "dark";
    document.body.classList.add("dark-theme");
  } else {
    theme = "light";
    document.body.classList.remove("dark-theme");
  }
  if (gameState === "playing") {
    paddle1.draw();
    paddle2.draw();
    ball.draw();
  }
});

// Inicializa ranking ao carregar
updateRanking();
