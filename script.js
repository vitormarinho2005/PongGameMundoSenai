const canvas = document.getElementById('jogoCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const menuDiv = document.getElementById('menu');
const submenuDiv = document.getElementById('submenu');
const botoesDificuldade = document.querySelectorAll('.btn-dificuldade');
const btnReiniciar = document.getElementById('btnReiniciar');
const btnTema = document.getElementById('btnTema');
const placarDiv = document.getElementById('placar');
const rankingDiv = document.getElementById('ranking');
const listaRanking = document.getElementById('listaRanking');
const btn1Jogador = document.getElementById('btn1Jogador');
const btn2Jogadores = document.getElementById('btn2Jogadores');

let playerScore = 0;
let player2Score = 0;
let dificuldadeSelecionada = null;
let modoMultiplayer = false;
let emJogo = false;

class Raquete {
  constructor(x) {
    this.x = x;
    this.y = HEIGHT / 2 - 50;
    this.width = 10;
    this.height = 100;
    this.vel = 15;
  }
  desenhar() {
    ctx.fillStyle = "white";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
  mover(direcao) {
    if (direcao === "cima" && this.y > 0) {
      this.y -= this.vel;
    } else if (direcao === "baixo" && this.y + this.height < HEIGHT) {
      this.y += this.vel;
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
    this.velx = (Math.random() < 0.5 ? 1 : -1) * (5 + Math.random() * 3);
    this.vely = (Math.random() * 4) - 2;
  }
  desenhar() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);
    ctx.fill();
  }
  atualizar(player1, player2) {
    this.x += this.velx;
    this.y += this.vely;

    if (this.y - this.raio < 0 || this.y + this.raio > HEIGHT) {
      this.vely *= -1;
    }

    // Colisão com o player 1
    if (
      this.x - this.raio < player1.x + player1.width &&
      this.y > player1.y &&
      this.y < player1.y + player1.height
    ) {
      this.velx *= -1;
      this.x = player1.x + player1.width + this.raio;

      let diff = this.y - (player1.y + player1.height / 2);
      this.vely = diff * 0.25;
    }

    // Colisão com o player 2 (ou CPU)
    if (
      this.x + this.raio > player2.x &&
      this.y > player2.y &&
      this.y < player2.y + player2.height
    ) {
      this.velx *= -1;
      this.x = player2.x - this.raio;

      let diff = this.y - (player2.y + player2.height / 2);
      this.vely = diff * 0.25;
    }

    // Saiu pela esquerda (player 2 marca ponto)
    if (this.x + this.raio < 0) {
      player2Score++;
      resetarBola();
    }

    // Saiu pela direita (player 1 marca ponto)
    if (this.x - this.raio > WIDTH) {
      playerScore++;
      resetarBola();
    }
  }
}

let jogador1 = new Raquete(20);
let jogador2 = new Raquete(WIDTH - 30);
let bola = new Bola();

let teclas = {};
document.addEventListener("keydown", e => {
  teclas[e.key.toLowerCase()] = true;
});
document.addEventListener("keyup", e => {
  teclas[e.key.toLowerCase()] = false;
});

function resetarBola() {
  bola.resetar();
  // Pausa breve para reiniciar bola
  emJogo = false;
  setTimeout(() => (emJogo = true), 1000);
}

function desenhar() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Fundo
  ctx.fillStyle = document.body.classList.contains('light') ? "#eee" : "#000";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Desenhar raquetes e bola
  jogador1.desenhar();
  jogador2.desenhar();
  bola.desenhar();

  // Desenhar placar
  placarDiv.textContent = `${playerScore} : ${player2Score}`;
}

function atualizar() {
  // Jogador 1 W/S
  if (teclas["w"]) jogador1.mover("cima");
  if (teclas["s"]) jogador1.mover("baixo");

  if (modoMultiplayer) {
    // Jogador 2 ↑/↓
    if (teclas["arrowup"]) jogador2.mover("cima");
    if (teclas["arrowdown"]) jogador2.mover("baixo");
  } else {
    // IA para jogador 2
    moverIA(jogador2, bola, dificuldadeSelecionada);
  }

  if (emJogo) bola.atualizar(jogador1, jogador2);
}

let iaTimer = 0;
function moverIA(raquete, bola, dificuldade) {
  iaTimer += 1;

  // IA com atraso e imprecisão conforme dificuldade
  let delay;
  let maxVel;

  switch (dificuldade) {
    case "fácil":
      delay = 8;
      maxVel = 5;
      break;
    case "médio":
      delay = 5;
      maxVel = 8;
      break;
    case "difícil":
      delay = 2;
      maxVel = 12;
      break;
    case "insano":
      delay = 0;
      maxVel = 16;
      break;
    default:
      delay = 5;
      maxVel = 8;
  }

  if (iaTimer % delay !== 0) return;

  // Mover raquete IA para tentar seguir a bola
  let centroRaquete = raquete.y + raquete.height / 2;
  let diff = bola.y - centroRaquete;

  if (Math.abs(diff) > 10) {
    raquete.y += Math.sign(diff) * Math.min(maxVel, Math.abs(diff));
  }

  // Limites da raquete
  if (raquete.y < 0) raquete.y = 0;
  if (raquete.y + raquete.height > HEIGHT) raquete.y = HEIGHT - raquete.height;
}

// Botões menu modo jogador
btn1Jogador.addEventListener("click", () => {
  modoMultiplayer = false;
  menuDiv.style.display = "none";
  submenuDiv.style.display = "flex";
});
btn2Jogadores.addEventListener("click", () => {
  modoMultiplayer = true;
  menuDiv.style.display = "none";
  submenuDiv.style.display = "none";
  iniciarJogo();
});

// Botões dificuldade
botoesDificuldade.forEach((botao) => {
  botao.addEventListener("click", () => {
    dificuldadeSelecionada = botao.dataset.dificuldade;
    submenuDiv.style.display = "none";
    iniciarJogo();
  });
});

btnReiniciar.addEventListener("click", () => {
  reiniciarJogo();
});

btnTema.addEventListener("click", () => {
  document.body.classList.toggle("light");
  if (document.body.classList.contains("light")) {
    btnTema.textContent = "Tema Escuro";
  } else {
    btnTema.textContent = "Tema Claro";
  }
});

function iniciarJogo() {
  playerScore = 0;
  player2Score = 0;
  emJogo = true;
  btnReiniciar.style.display = "block";
  rankingDiv.style.display = "none";
  resetarBola();
}

function reiniciarJogo() {
  playerScore = 0;
  player2Score = 0;
  emJogo = false;
  resetarBola();
  emJogo = true;
  rankingDiv.style.display = "none";
}

const PONTOS_MAX = 10;

function checarVencedor() {
  if (playerScore >= PONTOS_MAX || player2Score >= PONTOS_MAX) {
    emJogo = false;
    btnReiniciar.style.display = "none";
    rankingDiv.style.display = "block";
    mostrarRanking();

    setTimeout(() => {
      alert(
        playerScore > player2Score
          ? "Jogador 1 venceu!"
          : player2Score > playerScore
          ? modoMultiplayer
            ? "Jogador 2 venceu!"
            : "IA venceu!"
          : "Empate!"
      );
      menuDiv.style.display = "flex";
      rankingDiv.style.display = "none";
    }, 100);
  }
}

function salvarRanking(pontos) {
  const ranking = obterRanking();
  ranking.push(pontos);
  ranking.sort((a, b) => b - a);
  localStorage.setItem("rankingPong", JSON.stringify(ranking));
}

function obterRanking() {
  const raw = localStorage.getItem("rankingPong");
  if (!raw) return [];
  try {
    const ranking = JSON.parse(raw);
    return Array.isArray(ranking) ? ranking : [];
  } catch {
    return [];
  }
}

function mostrarRanking() {
  // Salvar resultado no localStorage se jogador 1 venceu
  if (playerScore > player2Score) {
    salvarRanking(playerScore);
  }

  const ranking = obterRanking();
  listaRanking.innerHTML = "";

  if (ranking.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Nenhum resultado no ranking.";
    listaRanking.appendChild(li);
    return;
  }

  ranking.forEach((item, index) => {
    let li = document.createElement("li");
    li.textContent = `${index + 1}º - Pontos: ${item}`;
    listaRanking.appendChild(li);
  });
}

function loop() {
  if (emJogo) {
    atualizar();
    desenhar();
    checarVencedor();
  }
  requestAnimationFrame(loop);
}

menuDiv.style.display = "flex";
submenuDiv.style.display = "none";
btnReiniciar.style.display = "none";
rankingDiv.style.display = "none";
btnTema.textContent = "Tema Claro";

loop();
