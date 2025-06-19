// ORIGO BalanceAid – Minimal mit HRM, ohne Logging, ohne Pause

let phaseIndex = 0;
let running = true;
let hrm = "--";
let hrmStart = null;

// Nur 3 Phasen für Stabilitätstest
const phases = [
  { label: "Einatmen", duration: 4, color: "#0000FF", action: "pulse" },
  { label: "Halten", duration: 7, color: "#00FF00", action: "none" },
  { label: "Ausatmen", duration: 8, color: "#800080", action: "custom" }
];

function showPhase(label, color, time, total) {
  g.clear();
  g.setColor(color);
  g.fillRect(0, 0, g.getWidth(), g.getHeight());
  const cx = g.getWidth() / 2;

  g.setColor("#FFFFFF");
  g.setFontAlign(0, -1);
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
    [0, 2].forEach(t => setTimeout(() => Bangle.buzz(150), t * 1000));
  }
}

function nextPhase() {
  if (!running) return;

  const p = phases[phaseIndex];
  let t = 0;
  showPhase(p.label, p.color, t + 1, p.duration);
  startAction(p.action, p.duration);

  let interval = setInterval(() => {
    if (!running) {
      clearInterval(interval);
      return;
    }
    t++;
    if (t >= p.duration) {
      clearInterval(interval);
      phaseIndex = (phaseIndex + 1) % phases.length;
      setTimeout(nextPhase, 250);
    } else {
      showPhase(p.label, p.color, t + 1, p.duration);
    }
  }, 1000);
}

// HRM aktivieren
Bangle.setHRMPower(1);
Bangle.on("HRM", d => {
  hrm = Math.round(d.bpm);
  if (hrmStart === null) hrmStart = hrm;
});

// App-Start
Bangle.loadWidgets();
Bangle.drawWidgets();
Bangle.setLCDTimeout(0);
nextPhase();
