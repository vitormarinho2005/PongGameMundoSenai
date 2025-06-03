const canvas = document.getElementById("jogoCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const PONTUACAO_MAXIMA = 7;

// Elementos do DOM
const menu = document.getElementById("menu");
const fimJogo = document.getElementById("fimJogo");
const mensagemFim = document.getElementById("mensagemFim");
const btnIniciar = document.getElementById("btnIniciar");
const btnReiniciar = document.getElementById("btnReiniciar");
const btnVoltarMenu = document.getElementById("btnVoltarMenu");
const placarDiv = document.getElementById("placar");
const chkIA = document.getElementById("chkIA");
const chkTema = document.getElementById("chkTema");
const controls = document.getElementById("controls");

let jogador1Score = 0;
let jogador2Score = 0;

let jogoAtivo = false;
let usarIA = false;

let keys = {};

// Classes
class Raquete {
  constructor(x) {
    this.x = x;
    this.y = HEIGHT / 2 - 50;
    this.width = 10;
    this.height = 100;
    this.vel = 10;
  }
  desenhar() {
    ctx.fillStyle = "white";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
  mover(direcao) {
    if (direcao === "cima" && this.y > 0) {
      this.y -= this.vel;
      if (this.y < 0) this.y = 0;
    } else if (direcao === "baixo" && this.y + this.height < HEIGHT) {
      this.y += this.vel;
      if (this.y + this.height > HEIGHT) this.y = HEIGHT - this.height;
    }
  }
}

class Bola {
  constructor() {
    this.raio = 10;
    this.resetar();
  }
  resetar() {
    this.x = WIDTH / 2;
    this.y = HEIGHT / 2;
    this.velx = (Math.random() < 0.5 ? 1 : -1) * 9;   // velocidade X inicial maior
    this.vely = (Math.random() * 20 - 10) || 3;        // velocidade Y inicial maior
  }
  desenhar() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);
    ctx.fill();
  }
  atualizar(p1, p2) {
    this.x += this.velx;
    this.y += this.vely;

    if (this.y - this.raio < 0 || this.y + this.raio > HEIGHT) {
      this.vely *= -1;
      if (this.y - this.raio < 0) this.y = this.raio;
      if (this.y + this.raio > HEIGHT) this.y = HEIGHT - this.raio;
    }

    // Colisão com raquete jogador 1
    if (
      this.x - this.raio < p1.x + p1.width &&
      this.x - this.raio > p1.x &&
      this.y > p1.y &&
      this.y < p1.y + p1.height
    ) {
      this.velx *= -1.3;  // acelera mais rápido no rebote
      this.x = p1.x + p1.width + this.raio;
      this.vely = (Math.random() * 6 - 3) || 2;
    }

    // Colisão com raquete jogador 2
    if (
      this.x + this.raio > p2.x &&
      this.x + this.raio < p2.x + p2.width &&
      this.y > p2.y &&
      this.y < p2.y + p2.height
    ) {
      this.velx *= -1.3;  // acelera mais rápido no rebote
      this.x = p2.x - this.raio;
      this.vely = (Math.random() * 6 - 3) || 2;
    }

    // Pontos
    if (this.x < 0) {
      jogador2Score++;
      atualizarPlacar();
      this.resetar();
    }
    if (this.x > WIDTH) {
      jogador1Score++;
      atualizarPlacar();
      this.resetar();
    }
  }
}

// Objetos
const jogador1 = new Raquete(20);
const jogador2 = new Raquete(WIDTH - 30);
const bola = new Bola();

// Eventos teclado
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Funções do jogo
function atualizar() {
  if (!jogoAtivo) return;

  // Jogador 1 W/S
  if (keys["w"] || keys["W"]) jogador1.mover("cima");
  if (keys["s"] || keys["S"]) jogador1.mover("baixo");

  if (usarIA) {
    moverIA();
  } else {
    // Jogador 2 ↑/↓
    if (keys["ArrowUp"]) jogador2.mover("cima");
    if (keys["ArrowDown"]) jogador2.mover("baixo");
  }

  bola.atualizar(jogador1, jogador2);

  // Verifica vitória
  if (jogador1Score >= PONTUACAO_MAXIMA) {
    mostrarFim("Jogador 1 venceu!");
  } else if (jogador2Score >= PONTUACAO_MAXIMA) {
    mostrarFim(usarIA ? "IA venceu!" : "Jogador 2 venceu!");
  }
}

function desenhar() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  jogador1.desenhar();
  jogador2.desenhar();
  bola.desenhar();
}

function loop() {
  atualizar();
  desenhar();
  if (jogoAtivo) requestAnimationFrame(loop);
}

function atualizarPlacar() {
  placarDiv.textContent = `Jogador 1: ${jogador1Score}  —  ${usarIA ? "IA" : "Jogador 2"}: ${jogador2Score}`;
}

function mostrarFim(mensagem) {
  jogoAtivo = false;
  mensagemFim.textContent = mensagem;
  fimJogo.style.display = "flex";
  canvas.style.display = "none";
  controls.style.display = "none";
}

function reiniciarJogo() {
  jogador1Score = 0;
  jogador2Score = 0;
  jogador1.y = HEIGHT / 2 - jogador1.height / 2;
  jogador2.y = HEIGHT / 2 - jogador2.height / 2;
  bola.resetar();
  atualizarPlacar();
  jogoAtivo = true;
  fimJogo.style.display = "none";
  canvas.style.display = "block";
  controls.style.display = "flex";
  loop();
}

// IA difícil (segue bola com velocidade aumentada)
function moverIA() {
  const velocidadeIA = 7;
  const alvoY = bola.y - jogador2.height / 2;

  if (jogador2.y + jogador2.height / 2 < alvoY) {
    jogador2.y += velocidadeIA;
    if (jogador2.y + jogador2.height > HEIGHT) jogador2.y = HEIGHT - jogador2.height;
  } else if (jogador2.y + jogador2.height / 2 > alvoY) {
    jogador2.y -= velocidadeIA;
    if (jogador2.y < 0) jogador2.y = 0;
  }
}

// Eventos botões
btnIniciar.onclick = () => {
  usarIA = chkIA.checked;
  menu.style.display = "none";
  fimJogo.style.display = "none";
  reiniciarJogo();
};

btnReiniciar.onclick = () => {
  reiniciarJogo();
};

btnVoltarMenu.onclick = () => {
  fimJogo.style.display = "none";
  menu.style.display = "flex";
  canvas.style.display = "none";
  controls.style.display = "none";
  jogoAtivo = false;
};

// Tema claro/escuro
chkTema.addEventListener("change", () => {
  if (chkTema.checked) {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
});
