
g.clear();
E.showMessage("Warte auf Puls...", "ORIGO");

let phase = 0;
let running = false;

function breatheCycle() {
  const phases = ["Einatmen", "Halten", "Ausatmen", "Pause"];
  const vibrations = [true, false, true, false];
  const colors = ["#00f", "#0f0", "#f00", "#999"];
  const vibStrength = [1.0, 0, 0.5, 0];

  g.clear();
  g.setColor(colors[phase]);
  g.setFont("6x8", 3);
  g.drawString(phases[phase], 60, 70);
  Bangle.buzz(vibStrength[phase] ? 100 : 0);
  phase = (phase + 1) % 4;

  if (running) setTimeout(breatheCycle, 4000);
}

Bangle.setHRMPower(1);
Bangle.on('HRM', function(hrm) {
  if (!running && hrm.confidence > 80 && hrm.bpm > 90) {
    running = true;
    E.showPrompt("Möchtest du atmen?").then(function(v) {
      if (v) {
        phase = 0;
        breatheCycle();
      } else {
        running = false;
        g.clear();
        E.showMessage("Abgebrochen", "ORIGO");
      }
    });
  }
});
