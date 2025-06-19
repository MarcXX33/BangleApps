// ORIGO BalanceAid – robuster Endlos-Zyklus ohne Hänger

let running = true;
let phaseIndex = 0;
let hrm = "--";
let hrmStart = null;
let hrmEnd = null;
let logs = [];

// Atemphasen: Einatmen, Halten, Ausatmen, Pause (jeweils mit Dauer und Farbe)
const phases = [
  { label: "Einatmen", duration: 4, color: "#0000FF", action: "pulse" },
  { label: "Halten", duration: 7, color: "#00FF00", action: "none" },
  { label: "Ausatmen", duration: 8, color: "#800080", action: "custom" },
  { label: "Pause", duration: 3, color: "#000000", action: "none" }
];

// Anzeige der aktuellen Phase
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

// Vibrationen je nach Phase
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

// Logging der HRM-Daten
function logSession() {
  const now = new Date();
  const entry = {
    date: now.toISOString().split("T")[0],
    time: now.toTimeString().split(" ")[0].slice(0, 5),
    bpmStart: hrmStart || "--",
    bpmEnd: hrmEnd || "--"
  };
  logs.push(entry);
  require("Storage").write("balanceaid-log.json", JSON.stringify(logs));
}

// Zykluslogik – robust und ohne Hänger
function runPhase() {
  if (!running) return;

  const phase = phases[phaseIndex];
  let t = 0;
  showPhase(phase.label, phase.color, t + 1, phase.duration);
  startAction(phase.action, phase.duration);

  let interval = setInterval(() => {
    if (!running) {
      clearInterval(interval);
      return;
    }

    t++;
    if (t >= phase.duration) {
      clearInterval(interval);

      if (phase.label === "Ausatmen") {
        hrmEnd = hrm;
        logSession();
        hrmStart = null;
        hrmEnd = null;
      }

      // Nächste Phase vorbereiten
      phaseIndex = (phaseIndex + 1) % phases.length;

      // WICHTIG: nächste Phase sofort starten
      setTimeout(runPhase, 250);
    } else {
      showPhase(phase.label, phase.color, t + 1, phase.duration);
    }
  }, 1000);
}

// App initial starten
Bangle.loadWidgets();
Bangle.drawWidgets();
Bangle.setLCDTimeout(0);
Bangle.setHRMPower(1);
Bangle.on("HRM", d => {
  hrm = Math.round(d.bpm);
  if (hrmStart === null) hrmStart = hrm;
});

// Start des ersten Zyklus
runPhase();
