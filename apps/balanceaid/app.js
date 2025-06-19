let running = false;
let phaseIndex = 0;
let hrm = "--";

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
  g.setColor("#FFFFFF");
  g.setFont("Vector", 30);
  g.drawString(label, 10, 30);
  g.setFont("Vector", 50);
  g.drawString(time + " / " + total, 20, 80);
  g.setFont("6x8", 2);
  g.drawString("♥ " + hrm, 5, 5);
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
    Bangle.setHRMPower(1);
    Bangle.on("HRM", d => hrm = Math.round(d.bpm));
    nextPhase();
  } else {
    Bangle.setHRMPower(0);
    Bangle.removeAllListeners("HRM");
    g.clear();
    g.setColor("#FFFFFF");
    g.setFont("Vector", 24);
    g.drawString("BalanceAid beendet", 20, 80);
  }
}

Bangle.loadWidgets();
Bangle.drawWidgets();
Bangle.setLCDTimeout(0);
g.clear();
E.showMessage("BalanceAid\nDoppeltippen zum Start");
// Doppeltippen (Tap-Geste) zum Start/Stop
Bangle.on("tap", () => {
  let now = Date.now();
  if (!global._lastTap) global._lastTap = 0;
  if (now - global._lastTap < 500) {
    toggleApp();
    global._lastTap = 0;
  } else {
    global._lastTap = now;
  }
});
