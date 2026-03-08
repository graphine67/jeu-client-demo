const prizes = [
  { label: "-10%", weight: 3 },
  { label: "Friandise offerte", weight: 2 },
  { label: "Merci 🙂", weight: 4 },
  { label: "-5%", weight: 3 },
  { label: "Surprise", weight: 1 },
  { label: "Retente", weight: 2 },
];

// Palette plus Graphine / festive
const colors = [
  "#113e53", // bleu pétrole
  "#e85c6d", // corail
  "#2a2a2f", // anthracite
  "#efe2d0", // beige
  "#2f3140", // gris bleuté
  "#cf4d5d"  // corail foncé
];

const textColor = "#f3f3f5";
const darkText = "#111111";
const accent = "#e85c6d";

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const btn = document.getElementById("spin");
const resultEl = document.getElementById("result");

const spinSound = document.getElementById("spinSound");
const winSound = document.getElementById("winSound");

let rotation = 0;
let isSpinning = false;

function weightedPick(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let r = Math.random() * total;

  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }

  return items[items.length - 1];
}

function wrapText(text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  const lines = [];

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    if (ctx.measureText(testLine).width > maxWidth && i > 0) {
      lines.push(line.trim());
      line = words[i] + " ";
    } else {
      line = testLine;
    }
  }

  lines.push(line.trim());

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, index) => {
    ctx.fillText(l, x, startY + index * lineHeight);
  });
}

function drawWheel() {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(cx, cy) - 10;
  const slice = (Math.PI * 2) / prizes.length;

  ctx.clearRect(0, 0, w, h);

  // Ombre douce extérieure
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
  ctx.fillStyle = "#0d0f15";
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 30;
  ctx.fill();
  ctx.restore();

  // Segments
  for (let i = 0; i < prizes.length; i++) {
    const start = rotation + i * slice;
    const end = start + slice;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, end);
    ctx.closePath();

    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    // trait séparateur léger
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Cercle extérieur subtil
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 6;
  ctx.stroke();

  // Textes
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "800 18px system-ui, -apple-system, Segoe UI, Roboto, Arial";

  for (let i = 0; i < prizes.length; i++) {
    const ang = rotation + i * slice + slice / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.translate(radius * 0.66, 0);

    // Texte sombre sur fond beige, clair ailleurs
    const currentColor = colors[i % colors.length];
    ctx.fillStyle = currentColor === "#efe2d0" ? darkText : textColor;

    wrapText(prizes[i].label, 0, 0, 150, 18);
    ctx.restore();
  }

  // Cercle central décoratif derrière le logo HTML
  ctx.beginPath();
  ctx.arc(cx, cy, 65, 0, Math.PI * 2);
  ctx.fillStyle = "#0b0d13";
  ctx.fill();

  ctx.lineWidth = 6;
  ctx.strokeStyle = accent;
  ctx.stroke();

  // Petit anneau interne
  ctx.beginPath();
  ctx.arc(cx, cy, 50, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function fireConfetti() {
  if (typeof confetti !== "function") return;

  const duration = 1200;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 8,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.6 }
    });

    confetti({
      particleCount: 8,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.6 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

function safePlay(audioEl) {
  if (!audioEl) return;

  audioEl.currentTime = 0;
  const playPromise = audioEl.play();

  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // certains navigateurs bloquent parfois le son, ce n’est pas grave
    });
  }
}

function spin() {
  if (isSpinning) return;

  isSpinning = true;
  btn.disabled = true;
  resultEl.textContent = "";

  safePlay(spinSound);

  const chosen = weightedPick(prizes);
  const slice = (Math.PI * 2) / prizes.length;
  const idx = prizes.findIndex(
    (p) => p.label === chosen.label && p.weight === chosen.weight
  );

  // Milieu du segment choisi
  const targetMid = idx * slice + slice / 2;

  // La flèche est en haut, donc on vise -PI/2
  const targetRotation = -Math.PI / 2 - targetMid;

  // Tours supplémentaires pour le spectacle
  const extraTurns = (Math.PI * 2) * (5 + Math.random() * 1.5);

  const start = rotation;
  const end = targetRotation + extraTurns;

  const duration = 3200;
  const startTime = performance.now();

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function animate(now) {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = easeOutCubic(progress);

    rotation = start + (end - start) * eased;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      rotation = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      drawWheel();

      safePlay(winSound);
      fireConfetti();

      resultEl.textContent = `🎉 Résultat : ${chosen.label}`;

      isSpinning = false;
      btn.disabled = false;
    }
  }

  requestAnimationFrame(animate);
}

btn.addEventListener("click", spin);
drawWheel();

