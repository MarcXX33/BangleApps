let bpm = "--";
let showPrompt = false;
let inSession = false;
let triggerHandled = false;
let phase = 0;
let phaseCounter = 0;
let breathingInterval = null;
const AUTOSTART_BPM = 90;
const PHASES = ["EIN", "HALTEN", "AUS", "PAUSE"];
const COLORS = ["#00FFFF", "#FFFF00", "#00FF00", "#AA00FF"];

Bangle.setHRMPower(1);
Bangle.on('HRM', function(hrm) {
  bpm = hrm.bpm || "--";
});

WIDGETS["battery"] = require("widbat");
WIDGETS["hrm"] = require("widhrm");
WIDGETS["478"] = {
  area: "tr", width: 24,
  draw: function() {
    g.reset(); g.setColor("#AA00FF"); g.setFont("6x8", 2);
    g.drawString("478", this.x, this.y + 4);
  },
  touch: function() {
    E.showMessage("Starte 4-7-8...", "ORIGO");
    setTimeout(() => Bangle.showClock(), 3000);
  }
};
WIDGETS["medit"] = {
  area: "tl", width: 24,
  draw: function() {
    g.reset(); g.setColor("#00FFFF"); g.setFont("6x8", 2);
    g.drawString("🧘", this.x, this.y + 4);
  },
  touch: function() {
    Bangle.buzz(); E.showMessage("Meditation läuft...", "ORIGO");
    setTimeout(() => { Bangle.buzz(); Bangle.showClock(); }, 15 * 60000);
  }
};

function drawUI() {
  g.clear();
  Bangle.drawWidgets();
  if (showPrompt) {
    g.setFont("Vector", 22);
    g.setColor("#00FF00");
    g.drawString("Möchtest du", 30, 40);
    g.drawString("atmen?", 60, 70);
    g.setFont("Vector", 18);
    g.drawString("Puls: " + bpm + " bpm", 40, 130);
  } else if (inSession) {
    g.setColor(COLORS[phase]);
    g.setFont("Vector", 24);
    g.drawString(PHASES[phase], 50, 40);
    g.setFont("Vector", 30);
    g.drawString("" + (phaseCounter + 1), 90, 80);
    g.setFont("Vector", 18);
    g.drawString("Puls: " + bpm, 40, 130);
  } else {
    let d = new Date();
    let t = ("0" + d.getHours()).substr(-2) + ":" + ("0" + d.getMinutes()).substr(-2);
    g.setFont("Vector", 40);
    g.setColor("#ffffff");
    g.drawString(t, 30, 60);
    g.setFont("Vector", 20);
    g.drawString("Puls: " + bpm, 40, 130);
  }
  g.flip();
}

function stopSession() {
  clearInterval(breathingInterval);
  inSession = false;
  triggerHandled = false;
  phase = 0;
  phaseCounter = 0;
  showPrompt = false;
}

function startBreathing() {
  inSession = true;
  showPrompt = false;
  phase = 0;
  phaseCounter = 0;
  doPhase();
}

function doPhase() {
  drawUI();
  phaseCounter = 0;
  let count = 4;
  breathingInterval = setInterval(() => {
    if (phase === 2) {
      Bangle.buzz(100);
      setTimeout(() => Bangle.buzz(100), 300);
    } else {
      Bangle.buzz(200);
    }
    phaseCounter++;
    drawUI();
    if (phaseCounter >= count) {
      clearInterval(breathingInterval);
      phase = (phase + 1) % 4;
      if (phase === 0) stopSession();
      else doPhase();
    }
  }, 1000);
}

Bangle.on('touch', () => {
  if (showPrompt && !inSession) startBreathing();
});

setInterval(() => {
  if (!inSession && !showPrompt && !triggerHandled && bpm >= AUTOSTART_BPM) {
    showPrompt = true;
    triggerHandled = true;
    Bangle.buzz(200);
  }
  drawUI();
}, 1000);

Bangle.loadWidgets();
drawUI();
