// ORIGO BalanceAid – Zentriert + Logging + Doppeltap + Download (Bangle.js 2)

let running = false;
let phaseIndex = 0;
let hrm = "--";
let hrmStart = null;
let hrmEnd = null;
let logs = [];

// Atemphasen
const phases = [
  { label: "Einatmen", duration: 4, color: "#0000FF", action: "pulse" },
  { label: "Halten", duration: 7, color: "#00FF00", action: "none" },
  { label: "Ausatmen", duration: 8, color: "#800080", action: "custom" },
  { label: "Pause", duration: 5, color: "#000000", action: "none" },
];

function showPhase(label, color, time, total) {
  g.clear();
  g.setColor(color);
  g.fillRect(0, 0, g.getWidth(), g.getHeight());

  const cx = g.getWidth() / 2;

  g.setColor("#FFFFFF");
  g.setFontAlign(0, -1); // horizontal zentriert, oben ausgerichtet

  g.setFont("Vector", 28);
  g.drawString(label, cx, 20);

  g.setFont("Vector", 48);
  g.drawString(time + " / " + total, cx, 60);

  g.setFont("Vector", 24);
  g.drawString("♥ " + hrm, cx, 130);
}

function startAction(type, duration) {
  if (type === "pulse") {
    let i = 0;
    let int = setInterval(() => {
      if (i++ >= duration) return clearInterval(int);
      Bangle.buzz(150);
    }, 1000);
  } else if (type === "custom") {
    [0, 2, 7].forEach(t => setTimeout(() => Bangle.buzz(150), t * 1000));
  }
}

function logSession() {
  const now = new Date();
  const entry = {
    date: now.toISOString().split("T")[0],
    time: now.toTimeString().split(" ")[0].slice(0, 5),
    bpmStart: hrmStart || "--",
    bpmEnd: hrmEnd || "--"
  };
  logs.push(entry);
  console.log("LOG", entry);
  require("Storage").write("balanceaid-log.json", JSON.stringify(logs));
}

function nextPhase() {
  if (!running) return;
  const p = phases[phaseIndex];
  let t = 1;
  showPhase(p.label, p.color, t, p.duration);
  startAction(p.action, p.duration);

  let secInt = setInterval(() => {
    if (!running || t >= p.duration) {
      clearInterval(secInt);
      phaseIndex = (phaseIndex + 1) % phases.length;
      if (phaseIndex === 0) {
        hrmEnd = hrm;
        logSession();
      }
      setTimeout(nextPhase, 100);
      return;
    }
    showPhase(p.label, p.color, ++t, p.duration);
  }, 1000);
}

function toggleApp() {
  running = !running;
  if (running) {
    phaseIndex = 0;
    hrmStart = null;
    hrmEnd = null;
    Bangle.setHRMPower(1);
    Bangle.on("HRM", d => {
      hrm = Math.round(d.bpm);
      if (hrmStart === null) hrmStart = hrm;
    });
    nextPhase();
  } else {
    Bangle.setHRMPower(0);
    Bangle.removeAllListeners("HRM");
    g.clear();
    g.setColor("#FFFFFF");
    g.setFontAlign(0, 0);
    g.setFont("Vector", 24);
    g.drawString("BalanceAid beendet", g.getWidth()/2, g.getHeight()/2);
  }
}

Bangle.loadWidgets();
Bangle.drawWidgets();
Bangle.setLCDTimeout(0);
g.clear();
g.setFontAlign(0, 0);
g.setFont("Vector", 24);
g.drawString("BalanceAid\nDoppeltap", g.getWidth()/2, g.getHeight()/2);

// Verbesserte Tap-Erkennung
let tapCount = 0;
let tapTimer;
Bangle.on("tap", () => {
  tapCount++;
  if (tapCount === 1) {
    tapTimer = setTimeout(() => { tapCount = 0; }, 500);
  } else if (tapCount === 2) {
    clearTimeout(tapTimer);
    tapCount = 0;
    toggleApp();
  }
});
