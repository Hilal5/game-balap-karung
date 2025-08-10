const Game = {
  gameActive: false,
  player1Pos: 5,
  player2Pos: 5,
  player1LastKey: "a",
  player2LastKey: "k",
  score1: 0,
  score2: 0,
  round: 1,
  finishLine: 85,
  hopDistance: 4,
  audioContext: null,
  musicPlaying: false,
  powerUps: [],
  gameLoop: null,
  achievements: {
    firstWin: false,
    threeInRow: false,
    speedDemon: false,
    powerCollector: false,
  },
  leaderboard: [],
  stats: { totalHops: 0, powerUpsCollected: 0, gameStartTime: null },

  init() {
    this.updateScores();
    this.updatePositions();
    this.addMusicButton();
    this.addLeaderboardButton();
    this.setupEventListeners();
    this.checkDeviceType();
    this.loadLeaderboard();
    const title = document.querySelector("h1");
    if (title) title.style.animation = "slideIn 1s ease-out";
  },

  start() {
    if (this.gameActive) return;
    const startBtn = document.getElementById("startBtn");
    if (startBtn)
      startBtn.innerHTML =
        '<i class="fas fa-running mr-2"></i> LOMBA DI MULAI!';

    this.initAudio();
    this.gameActive = true;
    this.player1Pos = 5;
    this.player2Pos = 5;
    this.player1LastKey = "a";
    this.player2LastKey = "k";
    this.stats.gameStartTime = Date.now();
    this.stats.totalHops = 0;
    this.stats.powerUpsCollected = 0;
    this.updatePositions();
    Effects.createConfetti(10);
    this.showCountdown();
    this.startGameLoop();
  },

  reset() {
    const startBtn = document.getElementById("startBtn");
    if (startBtn)
      startBtn.innerHTML = '<i class="fas fa-play mr-2"></i> MULAI LOMBA!';
    this.stopGameLoop();
    this.powerUps.forEach((p) => p.element.remove());
    this.powerUps = [];
    this.gameActive = false;
    this.player1Pos = 5;
    this.player2Pos = 5;
    this.score1 = 0;
    this.score2 = 0;
    this.round = 1;
    this.updatePositions();
    this.updateScores();
    UI.hideWinnerModal();
  },

  showCountdown() {
    const track = document.querySelector(".race-track");
    const countdown = document.createElement("div");
    countdown.className =
      "absolute inset-0 flex items-center justify-center z-20";
    countdown.innerHTML =
      '<div class="text-6xl md:text-8xl font-bold text-white drop-shadow-lg">3</div>';
    track.appendChild(countdown);
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        countdown.innerHTML = `<div class="text-6xl md:text-8xl font-bold text-white drop-shadow-lg">${count}</div>`;
      } else {
        countdown.innerHTML =
          '<div class="text-6xl md:text-8xl font-bold text-green-400 drop-shadow-lg">GO!</div>';
        setTimeout(() => countdown.remove(), 500);
        clearInterval(interval);
      }
    }, 1000);
  },

  updatePositions() {
    document.getElementById("player1").style.left = `${this.player1Pos}%`;
    document.getElementById("player2").style.left = `${this.player2Pos}%`;
  },

  updateScores() {
    document.getElementById("score1").textContent = this.score1;
    document.getElementById("score2").textContent = this.score2;
    document.getElementById("round").textContent = this.round;
    const scoreEl =
      this.score1 > this.score2
        ? document.getElementById("score1")
        : document.getElementById("score2");
    if (scoreEl && scoreEl.parentElement) {
      scoreEl.parentElement.classList.add("pulsing");
      setTimeout(() => scoreEl.parentElement.classList.remove("pulsing"), 1000);
    }
  },

  checkWinner() {
    if (this.player1Pos >= this.finishLine) {
      this.showWinner("Player 1");
      this.score1++;
      this.updateScores();
      return true;
    } else if (this.player2Pos >= this.finishLine) {
      this.showWinner("Player 2");
      this.score2++;
      this.updateScores();
      return true;
    }
    return false;
  },

  showWinner(winner) {
    this.gameActive = false;
    const gameTime = Date.now() - this.stats.gameStartTime;
    UI.showWinnerModal(winner);
    Audio.playWinSound();
    Effects.createConfetti(30);
    Effects.createFireworks();
    this.checkAchievements(gameTime);
    this.updateLeaderboard();
    this.stopGameLoop();
  },

  nextRound() {
    this.round++;
    UI.hideWinnerModal();
    setTimeout(() => this.start(), 300);
  },

  movePlayer(player, key) {
    if (!this.gameActive) return false;
    if (player === 1) {
      if (
        (key === "a" && this.player1LastKey === "s") ||
        (key === "s" && this.player1LastKey === "a")
      ) {
        this.player1Pos += this.hopDistance;
        this.player1LastKey = key;
        this.stats.totalHops++;
        Effects.animateHop("player1");
        Audio.playHopSound();
        this.updatePositions();
        return this.checkWinner();
      }
    } else if (player === 2) {
      if (
        (key === "k" && this.player2LastKey === "l") ||
        (key === "l" && this.player2LastKey === "k")
      ) {
        this.player2Pos += this.hopDistance;
        this.player2LastKey = key;
        this.stats.totalHops++;
        Effects.animateHop("player2");
        Audio.playHopSound();
        this.updatePositions();
        return this.checkWinner();
      }
    }
    return false;
  },

  mobileControl(player, key) {
    this.movePlayer(player, key);
  },

  setupEventListeners() {
    document.addEventListener("keydown", (e) => {
      if (!this.gameActive) return;
      const key = e.key.toLowerCase();
      if (key === "a" || key === "s") this.movePlayer(1, key);
      else if (key === "k" || key === "l") this.movePlayer(2, key);
    });

    let lastTouchTime = 0;
    document.addEventListener("touchend", (e) => {
      const currentTime = Date.now();
      const tapLength = currentTime - lastTouchTime;
      if (tapLength < 500 && tapLength > 0) e.preventDefault();
      lastTouchTime = currentTime;
    });

    document.querySelectorAll(".touch-button").forEach((button) => {
      button.addEventListener("touchstart", () => {
        button.style.transform = "scale(0.95)";
      });
      button.addEventListener("touchend", () => {
        setTimeout(() => {
          button.style.transform = "scale(1)";
        }, 100);
      });
    });

    window.addEventListener("resize", () => this.checkDeviceType());
  },

  checkDeviceType() {
    const mobileOnly = document.querySelector(".mobile-only");
    const desktopOnly = document.querySelector(".desktop-only");
    if (window.innerWidth <= 768) {
      if (mobileOnly) mobileOnly.style.display = "block";
      if (desktopOnly) desktopOnly.style.display = "none";
    } else {
      if (mobileOnly) mobileOnly.style.display = "none";
      if (desktopOnly) desktopOnly.style.display = "block";
    }
  },

  initAudio() {
    if (!this.audioContext)
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
  },

  addMusicButton() {
    const musicBtn = document.createElement("button");
    musicBtn.className =
      "fixed bottom-4 right-4 bg-purple-500 hover:bg-purple-600 text-white rounded-full p-3 shadow-lg z-40 transform hover:scale-110 transition-all";
    musicBtn.innerHTML = '<i class="fas fa-music"></i>';
    musicBtn.onclick = () => this.toggleMusic();
    document.body.appendChild(musicBtn);
  },

  toggleMusic() {
    this.musicPlaying = !this.musicPlaying;
    const indicator = document.createElement("div");
    indicator.className =
      "fixed top-4 right-4 bg-white rounded-full p-2 shadow-lg z-50";
    indicator.innerHTML = this.musicPlaying
      ? '<i class="fas fa-volume-up text-green-500"></i>'
      : '<i class="fas fa-volume-mute text-red-500"></i>';
    document.body.appendChild(indicator);
    setTimeout(() => indicator.remove(), 2000);
    if (this.musicPlaying) Audio.startBackgroundMusic();
    else Audio.stopBackgroundMusic();
  },

  addLeaderboardButton() {
    const leaderBtn = document.createElement("button");
    leaderBtn.className =
      "fixed bottom-4 left-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full p-3 shadow-lg z-40 transform hover:scale-110 transition-all";
    leaderBtn.innerHTML = '<i class="fas fa-trophy"></i>';
    leaderBtn.onclick = () => UI.showLeaderboard();
    document.body.appendChild(leaderBtn);
  },

  startGameLoop() {
    this.gameLoop = setInterval(() => {
      if (this.gameActive) {
        PowerUp.checkCollisions();
        if (Math.random() < 0.02) PowerUp.create();
      }
    }, 100);
  },

  stopGameLoop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
  },

  checkAchievements(gameTime) {
    if (!this.achievements.firstWin && (this.score1 > 0 || this.score2 > 0)) {
      this.achievements.firstWin = true;
      UI.showAchievement("Pemenang Pertama!", "🎯");
    }
    if (
      !this.achievements.threeInRow &&
      (this.score1 >= 3 || this.score2 >= 3)
    ) {
      this.achievements.threeInRow = true;
      UI.showAchievement("Hat-trick!", "🔥");
    }
    if (!this.achievements.speedDemon && gameTime < 10000) {
      this.achievements.speedDemon = true;
      UI.showAchievement("Speed Demon!", "⚡");
    }
    if (
      !this.achievements.powerCollector &&
      this.stats.powerUpsCollected >= 5
    ) {
      this.achievements.powerCollector = true;
      UI.showAchievement("Power Collector!", "⭐");
    }
  },

  updateLeaderboard() {
    const winner =
      this.score1 > this.score2
        ? "Player 1"
        : this.score2 > this.score1
        ? "Player 2"
        : null;
    if (winner && this.round > 1) {
      this.leaderboard.push({
        winner,
        rounds: this.round,
        score: Math.max(this.score1, this.score2),
        date: new Date().toLocaleDateString("id-ID"),
        totalHops: this.stats.totalHops,
        powerUps: this.stats.powerUpsCollected,
      });
      this.leaderboard.sort((a, b) => b.score - a.score);
      this.leaderboard = this.leaderboard.slice(0, 5);
      this.saveLeaderboard();
    }
  },

  saveLeaderboard() {
    console.log("Leaderboard updated:", this.leaderboard);
  },
  loadLeaderboard() {
    console.log("Leaderboard loaded");
  },
};

const Audio = {
  backgroundMusicInterval: null,
  playHopSound() {
    if (!Game.audioContext) return;
    const osc = Game.audioContext.createOscillator();
    const gain = Game.audioContext.createGain();
    osc.connect(gain);
    gain.connect(Game.audioContext.destination);
    osc.frequency.value = 300 + Math.random() * 100;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.1, Game.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      Game.audioContext.currentTime + 0.1
    );
    osc.start();
    osc.stop(Game.audioContext.currentTime + 0.1);
  },
  playWinSound() {
    if (!Game.audioContext) return;
    for (let i = 0; i < 3; i++)
      setTimeout(() => {
        const o = Game.audioContext.createOscillator();
        const g = Game.audioContext.createGain();
        o.connect(g);
        g.connect(Game.audioContext.destination);
        o.frequency.value = 400 + i * 200;
        o.type = "sine";
        g.gain.setValueAtTime(0.2, Game.audioContext.currentTime);
        g.gain.exponentialRampToValueAtTime(
          0.01,
          Game.audioContext.currentTime + 0.3
        );
        o.start();
        o.stop(Game.audioContext.currentTime + 0.3);
      }, i * 100);
  },
  playPowerUpSound() {
    if (!Game.audioContext) return;
    const o = Game.audioContext.createOscillator(),
      g = Game.audioContext.createGain();
    o.connect(g);
    g.connect(Game.audioContext.destination);
    o.frequency.setValueAtTime(523, Game.audioContext.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      1047,
      Game.audioContext.currentTime + 0.2
    );
    o.type = "square";
    g.gain.setValueAtTime(0.1, Game.audioContext.currentTime);
    g.gain.exponentialRampToValueAtTime(
      0.01,
      Game.audioContext.currentTime + 0.2
    );
    o.start();
    o.stop(Game.audioContext.currentTime + 0.2);
  },
  startBackgroundMusic() {
    if (!Game.audioContext || this.backgroundMusicInterval) return;
    const playNote = (freq) => {
      const o = Game.audioContext.createOscillator(),
        g = Game.audioContext.createGain();
      o.connect(g);
      g.connect(Game.audioContext.destination);
      o.frequency.value = freq;
      o.type = "triangle";
      g.gain.setValueAtTime(0.05, Game.audioContext.currentTime);
      g.gain.exponentialRampToValueAtTime(
        0.01,
        Game.audioContext.currentTime + 0.5
      );
      o.start();
      o.stop(Game.audioContext.currentTime + 0.5);
    };
    const notes = [261.63, 293.66, 329.63, 349.23, 392, 349.23, 329.63, 293.66];
    let i = 0;
    this.backgroundMusicInterval = setInterval(() => {
      playNote(notes[i]);
      i = (i + 1) % notes.length;
    }, 250);
  },
  stopBackgroundMusic() {
    if (this.backgroundMusicInterval) {
      clearInterval(this.backgroundMusicInterval);
      this.backgroundMusicInterval = null;
    }
  },
};

const Effects = {
  animateHop(playerId) {
    const player = document.getElementById(playerId);
    player.classList.add("hopping");
    const dust = document.createElement("div");
    dust.style.position = "absolute";
    dust.style.width = "32px";
    dust.style.height = "8px";
    dust.style.borderRadius = "9999px";
    dust.style.backgroundColor = "#a16207";
    dust.style.opacity = "0.5";
    dust.style.bottom = "-5px";
    dust.style.left = "50%";
    dust.style.transform = "translateX(-50%)";
    dust.style.animation = "fadeOut 0.5s forwards";
    player.appendChild(dust);
    setTimeout(() => {
      player.classList.remove("hopping");
      dust.remove();
    }, 400);
  },
  createConfetti(count) {
    const colors = [
      "#ff0000",
      "#ffffff",
      "#ffff00",
      "#00ff00",
      "#0000ff",
      "#ff00ff",
    ];
    for (let i = 0; i < count; i++)
      setTimeout(() => {
        const c = document.createElement("div");
        c.className = "confetti-piece";
        c.style.left = Math.random() * 100 + "%";
        c.style.backgroundColor =
          colors[Math.floor(Math.random() * colors.length)];
        c.style.transform = `rotate(${Math.random() * 360}deg)`;
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 3000);
      }, i * 50);
  },
  createFireworks() {
    const track = document.querySelector(".race-track");
    for (let i = 0; i < 5; i++)
      setTimeout(() => {
        const x = Math.random() * track.offsetWidth;
        const y = Math.random() * track.offsetHeight;
        this.createParticleExplosion(x, y, "#FFD700");
      }, i * 200);
  },
  createParticleExplosion(x, y, color) {
    const particleCount = 20;
    const container = document.querySelector(".race-track");
    const ts = Date.now();
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.style.position = "absolute";
      particle.style.width = "8px";
      particle.style.height = "8px";
      particle.style.borderRadius = "9999px";
      particle.style.backgroundColor = color;
      particle.style.left = x + "px";
      particle.style.top = y + "px";
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 50 + Math.random() * 50;
      const duration = 0.5 + Math.random() * 0.5;
      particle.style.animation = `particle-${ts}-${i} ${duration}s ease-out forwards`;
      const style = document.createElement("style");
      style.textContent = `@keyframes particle-${ts}-${i}{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(${
        Math.cos(angle) * velocity
      }px, ${Math.sin(angle) * velocity}px) scale(0);opacity:0}}`;
      document.head.appendChild(style);
      container.appendChild(particle);
      setTimeout(() => {
        particle.remove();
        style.remove();
      }, duration * 1000);
    }
  },
  showBoostEffect(playerId) {
    const player = document.getElementById(playerId);
    player.style.filter = "drop-shadow(0 0 20px gold)";
    for (let i = 0; i < 3; i++) {
      const line = document.createElement("div");
      line.style.position = "absolute";
      line.style.height = "4px";
      line.style.width = "20px";
      line.style.backgroundColor = "#fde047";
      line.style.left = "-25px";
      line.style.top = 10 + i * 10 + "px";
      line.style.animation = "speedLine .3s ease-out";
      player.appendChild(line);
      setTimeout(() => line.remove(), 300);
    }
    setTimeout(() => {
      player.style.filter = "drop-shadow(0 5px 10px rgba(0,0,0,.3))";
    }, 1000);
  },
};

const UI = {
  showWinnerModal(winner) {
    const modal = document.getElementById("winnerModal");
    const content = document.getElementById("winnerContent");
    const text = document.getElementById("winnerText");
    text.textContent = `${winner} MENANG!`;
    modal.style.display = "flex";
    setTimeout(() => {
      content.style.transform = "scale(1)";
    }, 100);
  },
  hideWinnerModal() {
    const modal = document.getElementById("winnerModal");
    const content = document.getElementById("winnerContent");
    content.style.transform = "scale(0)";
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
  },
  showAchievement(text, emoji) {
    const el = document.createElement("div");
    el.className =
      "fixed top-20 left-1/2 -translate-x-1/2 bg-yellow-400 text-black font-bold py-3 px-6 rounded-full shadow-lg z-50";
    el.style.animation = "slideIn .5s ease-out";
    el.innerHTML = `${emoji} ${text} ${emoji}`;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.animation = "slideOut .5s ease-out";
      setTimeout(() => el.remove(), 500);
    }, 3000);
  },
  showLeaderboard() {
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50";
    const content = document.createElement("div");
    content.className = "bg-white rounded-3xl p-8 max-w-md w-full mx-4";
    let html = "";
    if (Game.leaderboard.length > 0) {
      html = Game.leaderboard
        .map(
          (e, i) =>
            `<div class="flex justify-between items-center p-3 bg-gray-100 rounded-lg mb-2"><div class="flex items-center gap-2"><span class="text-2xl">${
              i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅"
            }</span><div><span class="font-bold">${
              e.winner
            }</span><div class="text-xs text-gray-500">${
              e.date
            }</div></div></div><div class="text-right"><div class="font-bold">Skor: ${
              e.score
            }</div><div class="text-xs text-gray-500">${
              e.rounds
            } ronde</div></div></div>`
        )
        .join("");
    } else {
      html =
        '<p class="text-center text-gray-500 py-8">Belum ada skor. Mulai bermain!</p>';
    }
    content.innerHTML = `<h2 class="text-2xl font-bold text-center mb-6 text-red-600"><i class=\"fas fa-trophy mr-2\"></i>Papan Skor Terbaik</h2><div class="max-h-96 overflow-y-auto">${html}</div><button onclick="this.closest('.fixed').remove()" class="mt-6 w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg hover:from-red-600 hover:to-red-700 transition font-bold">Tutup</button>`;
    modal.appendChild(content);
    document.body.appendChild(modal);
  },
};

const PowerUp = {
  create() {
    if (!Game.gameActive || Math.random() > 0.3) return;
    const el = document.createElement("div");
    el.className = "power-up";
    el.style.left = 20 + Math.random() * 60 + "%";
    el.style.top = 40 + Math.random() * 20 + "%";
    el.innerHTML = "⭐";
    document.querySelector(".race-track").appendChild(el);
    const obj = { element: el, collected: false };
    Game.powerUps.push(obj);
    setTimeout(() => {
      if (!obj.collected) {
        obj.element.remove();
        Game.powerUps = Game.powerUps.filter((p) => p !== obj);
      }
    }, 5000);
  },
  checkCollisions() {
    Game.powerUps.forEach((p) => {
      if (p.collected) return;
      const pupRect = p.element.getBoundingClientRect();
      const p1Rect = document.getElementById("player1").getBoundingClientRect();
      const p2Rect = document.getElementById("player2").getBoundingClientRect();
      if (this.isColliding(pupRect, p1Rect)) this.collect(p, 1);
      else if (this.isColliding(pupRect, p2Rect)) this.collect(p, 2);
    });
  },
  isColliding(a, b) {
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
  },
  collect(obj, player) {
    obj.collected = true;
    obj.element.style.animation = "sparkle .5s ease-out";
    Game.stats.powerUpsCollected++;
    Audio.playPowerUpSound();
    const boost = 8;
    if (player === 1) {
      Game.player1Pos = Math.min(Game.player1Pos + boost, 100);
      Effects.showBoostEffect("player1");
    } else {
      Game.player2Pos = Math.min(Game.player2Pos + boost, 100);
      Effects.showBoostEffect("player2");
    }
    Game.updatePositions();
    Game.checkWinner();
    setTimeout(() => {
      obj.element.remove();
      Game.powerUps = Game.powerUps.filter((p) => p !== obj);
    }, 500);
  },
};

window.addEventListener("load", () => Game.init());
window.Game = Game;
window.Audio = Audio;
window.Effects = Effects;
window.UI = UI;
window.PowerUp = PowerUp;
