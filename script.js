const SUPABASE_URL = "https://dzetwpgeykglhnnswtdv.supabase.co";
const SUPABASE_KEY = "sb_publishable_OChUJ4VPF1siv-uniYCCnQ_c-rLZyvy";
const TABLE_NAME = "Participants";
const EMAIL_FUNCTION_URL = "https://dzetwpgeykglhnnswtdv.supabase.co/functions/v1/send-graphine-email";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

const prizes = [
  { label: "Merci d’avoir joué 🙂", weight: 4 },
  { label: "Bon -10% sur votre achat", weight: 3 },
  { label: "Participation au tirage au sort 🎟️", weight: 3 },
  { label: "Goodie offert", weight: 2 },
  { label: "Boisson offerte 🥤", weight: 2 },
  { label: "Cadeau surprise 🎁", weight: 2 },
  { label: "Lot mystère 🎁", weight: 1 }
];

const colors = [
  "#113e53",
  "#e85c6d",
  "#2a2a2f",
  "#efe2d0",
  "#2f3140",
  "#cf4d5d",
  "#113e53"
];

const confettiColors = [
  "#e85c6d",
  "#113e53",
  "#efe2d0",
  "#ffffff",
  "#ffd166",
  "#8ecae6",
  "#c77dff"
];

const textColor = "#f3f3f5";
const darkText = "#111111";
const accent = "#e85c6d";

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const btn = document.getElementById("spin");
const resultEl = document.getElementById("result");

const emailInput = document.getElementById("emailInput");
const emailBtn = document.getElementById("emailBtn");
const emailMessage = document.getElementById("emailMessage");
const rgpdCheck = document.getElementById("rgpdCheck");

const spinSound = document.getElementById("spinSound");
const winSound = document.getElementById("winSound");

let currentEmail = "";
let rotation = 0;
let isSpinning = false;
let confettiLayer = null;
let emailValidated = false;

btn.disabled = true;

function setEmailMessage(message, type = "") {
  emailMessage.textContent = message;
  emailMessage.classList.remove("success", "error");

  if (type) {
    emailMessage.classList.add(type);
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function hasAlreadyParticipated(email) {
  const { data, error } = await supabaseClient
    .from(TABLE_NAME)
    .select("email")
    .eq("email", email)
    .limit(1);

  if (error) {
    throw error;
  }

  return !!(data && data.length > 0);
}

async function sendGraphineEmail(email) {
  try {
    const response = await fetch(EMAIL_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Erreur fonction email :", result);
      return false;
    }

    console.log("Email automatique envoyé :", result);
    return true;
  } catch (error) {
    console.error("Erreur réseau envoi email :", error);
    return false;
  }
}

async function validateEmail() {
  const email = emailInput.value.trim().toLowerCase();

  if (!email) {
    setEmailMessage("Merci de saisir votre email.", "error");
    return;
  }

  if (!isValidEmail(email)) {
    setEmailMessage("Adresse email invalide.", "error");
    return;
  }

  if (!rgpdCheck.checked) {
    setEmailMessage("Merci d’accepter les conditions pour participer.", "error");
    return;
  }

  emailBtn.disabled = true;
  btn.disabled = true;
  setEmailMessage("Vérification en cours...");

  try {
    const alreadyPlayed = await hasAlreadyParticipated(email);

    if (alreadyPlayed) {
      setEmailMessage("Vous avez déjà participé avec cet email.", "error");
      emailBtn.disabled = false;
      btn.disabled = true;
      return;
    }

    currentEmail = email;
    emailValidated = true;

    setEmailMessage("Email validé. Vous pouvez tourner la roue.", "success");

    emailInput.disabled = true;
    rgpdCheck.disabled = true;
    emailBtn.disabled = true;
    btn.disabled = false;
  } catch (error) {
    console.error("Erreur vérification Supabase :", error);
    setEmailMessage("Erreur lors de la vérification de l’email.", "error");
    emailBtn.disabled = false;
    btn.disabled = true;
  }
}

function weightedPickIndex(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let r = Math.random() * total;

  for (let i = 0; i < items.length; i++) {
    r -= items[i].weight;
    if (r <= 0) return i;
  }

  return items.length - 1;
}

function normalizeAngle(angle) {
  const twoPi = Math.PI * 2;
  return ((angle % twoPi) + twoPi) % twoPi;
}

function getPrizeIndexAtPointer() {
  const slice = (Math.PI * 2) / prizes.length;
  const pointerAngle = -Math.PI / 2;
  const adjusted = normalizeAngle(pointerAngle - rotation);
  return Math.floor(adjusted / slice) % prizes.length;
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

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
  ctx.fillStyle = "#0d0f15";
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 30;
  ctx.fill();
  ctx.restore();

  for (let i = 0; i < prizes.length; i++) {
    const start = rotation + i * slice;
    const end = start + slice;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, end);
    ctx.closePath();

    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "400 18px system-ui, -apple-system, Segoe UI, Roboto, Arial";

  for (let i = 0; i < prizes.length; i++) {
    const ang = rotation + i * slice + slice / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.translate(radius * 0.66, 0);

    const currentColor = colors[i % colors.length];
    ctx.fillStyle = currentColor === "#efe2d0" ? darkText : textColor;

    wrapText(prizes[i].label, 0, 0, 150, 18);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, 65, 0, Math.PI * 2);
  ctx.fillStyle = "#0b0d13";
  ctx.fill();

  ctx.lineWidth = 6;
  ctx.strokeStyle = accent;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 50, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function safePlay(audioEl) {
  if (!audioEl) return;

  audioEl.currentTime = 0;
  const playPromise = audioEl.play();

  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // son bloqué par le navigateur, on ignore
    });
  }
}

function ensureConfettiLayer() {
  if (confettiLayer) return confettiLayer;

  confettiLayer = document.createElement("div");
  confettiLayer.id = "confetti-layer";
  confettiLayer.style.position = "fixed";
  confettiLayer.style.inset = "0";
  confettiLayer.style.pointerEvents = "none";
  confettiLayer.style.overflow = "hidden";
  confettiLayer.style.zIndex = "9999";
  document.body.appendChild(confettiLayer);

  return confettiLayer;
}

function fireConfetti() {
  const layer = ensureConfettiLayer();
  layer.innerHTML = "";

  const total = 140;

  for (let i = 0; i < total; i++) {
    const piece = document.createElement("span");

    const size = 6 + Math.random() * 10;
    const left = Math.random() * 100;
    const delay = Math.random() * 0.35;
    const duration = 2.4 + Math.random() * 1.8;
    const drift = (Math.random() - 0.5) * 220;
    const rotateStart = Math.random() * 360;
    const rotateEnd = rotateStart + 360 + Math.random() * 720;
    const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    const shape = Math.random() > 0.7 ? "50%" : "2px";

    piece.style.position = "absolute";
    piece.style.top = "-20px";
    piece.style.left = `${left}vw`;
    piece.style.width = `${size}px`;
    piece.style.height = `${size * 0.6}px`;
    piece.style.background = color;
    piece.style.borderRadius = shape;
    piece.style.opacity = "0.95";
    piece.style.transform = `translate3d(0,0,0) rotate(${rotateStart}deg)`;
    piece.style.boxShadow = "0 0 6px rgba(255,255,255,0.18)";
    piece.style.animation = `confetti-fall ${duration}s ease-in forwards ${delay}s`;

    piece.style.setProperty("--drift", `${drift}px`);
    piece.style.setProperty("--rotate-end", `${rotateEnd}deg`);

    layer.appendChild(piece);
  }

  setTimeout(() => {
    if (layer) layer.innerHTML = "";
  }, 4500);
}

function injectConfettiStyles() {
  if (document.getElementById("confetti-style")) return;

  const style = document.createElement("style");
  style.id = "confetti-style";
  style.textContent = `
    @keyframes confetti-fall {
      0% {
        transform: translate3d(0, -20px, 0) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translate3d(var(--drift), 110vh, 0) rotate(var(--rotate-end));
        opacity: 0.9;
      }
    }
  `;
  document.head.appendChild(style);
}

async function saveParticipation(prizeLabel) {
  const { error } = await supabaseClient
    .from(TABLE_NAME)
    .insert([
      {
        email: currentEmail,
        prize: prizeLabel
      }
    ]);

  return error;
}

async function spin() {
  if (isSpinning) return;

  if (!emailValidated || !currentEmail) {
    setEmailMessage("Merci de valider votre email avant de jouer.", "error");
    btn.disabled = true;
    return;
  }

  isSpinning = true;
  btn.disabled = true;
  resultEl.textContent = "";
  setEmailMessage("");

  safePlay(spinSound);

  const slice = (Math.PI * 2) / prizes.length;
  const chosenIndex = weightedPickIndex(prizes);
  const segmentCenter = chosenIndex * slice + slice / 2;
  const targetRotation = -Math.PI / 2 - segmentCenter;
  const extraTurns = (Math.PI * 2) * (5 + Math.random() * 1.5);

  const start = rotation;
  const end = targetRotation + extraTurns;

  const duration = 3200;
  const startTime = performance.now();
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  async function animate(now) {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = easeOutCubic(progress);

    rotation = start + (end - start) * eased;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
      return;
    }

    rotation = normalizeAngle(rotation);
    drawWheel();

    const landedIndex = getPrizeIndexAtPointer();
    const landedPrize = prizes[landedIndex];

    setTimeout(() => {
      rotation += 0.06;
      drawWheel();
    }, 60);

    setTimeout(() => {
      rotation -= 0.09;
      drawWheel();
    }, 120);

    setTimeout(() => {
      rotation += 0.04;
      drawWheel();
    }, 180);

    safePlay(winSound);
    fireConfetti();

    const insertError = await saveParticipation(landedPrize.label);

    if (insertError) {
      console.error("Erreur insertion Supabase :", insertError);
      resultEl.textContent = "Erreur lors de l’enregistrement de la participation.";
      isSpinning = false;
      btn.disabled = true;
      return;
    }

    await sendGraphineEmail(currentEmail);

    resultEl.textContent = "Suspense...";

setTimeout(() => {
  resultEl.innerHTML = `
  🎉 Résultat : ${landedPrize.label}

  <br><br>

  💡 Cette roue est une démonstration.

  <br>

  Vous souhaitez une roue personnalisée pour votre commerce,
  votre stand ou votre événement ?

  <br><br>

  <a href="https://graph-ine.fr" target="_blank" style="
  background:#e85c6d;
  color:white;
  padding:10px 16px;
  border-radius:8px;
  text-decoration:none;
  font-weight:bold;
  display:inline-block;
  margin-top:8px;
  ">
  Découvrir Graphine
  </a>
  `;
}, 800);

    isSpinning = false;
    btn.disabled = true;
  }

  requestAnimationFrame(animate);
}

injectConfettiStyles();
drawWheel();

emailBtn.addEventListener("click", validateEmail);
btn.addEventListener("click", spin);

console.log("Supabase connecté :", supabaseClient);

