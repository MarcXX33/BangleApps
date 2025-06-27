const PHASES = ["Einatmen", "Halten", "Ausatmen"];
const PHASE_COLORS = ["#00f", "#0f0", "#f0f"];
const PHASE_STEPS = [4, 7, 8];
const MAX_CYCLES = 4;
let phase = 0;
let cycle = 1;
let step = 0;
let interval;
function draw() {
  g.reset().setBgColor(PHASE_COLORS[phase]).clear().setColor(g.theme.bg);
  g.setFont("Vector",35).setFontAlign(0,0).drawString(PHASES[phase], g.getWidth()/2, g.getHeight()/2 - 20);
  g.setFont("Vector",50).drawString(step, g.getWidth()/2, g.getHeight()/2 + 30);
  g.setFont("Vector",20).setFontAlign(0,1).drawString("Zyklus " + cycle + "/" + MAX_CYCLES, g.getWidth()/2, g.getHeight()-10);
}
function nextPhase() {
  phase = (phase + 1) % 3;
  step = 0;
  if (phase === 0) {
    cycle++;
    if (cycle > MAX_CYCLES) {
      if (interval) clearInterval(interval);
      g.reset().setFont("Vector",30).setFontAlign(0,0).drawString("Fertig!", g.getWidth()/2, g.getHeight()/2);
      setTimeout(load, 2000);
      return;
    }
  }
  if (phase === 0) Bangle.buzz(150,1);
  if (phase === 1) Bangle.buzz(150,0.5);
  if (phase === 2) Bangle.buzz(500,1);
  draw();
}
g.clear();
Bangle.setLCDTimeout(0);
Bangle.setUI({mode:"clockupdown", remove:()=>{
  if (interval) clearInterval(interval);
}});
nextPhase();
interval = setInterval(()=>{
  step++;
  draw();
  if (step >= PHASE_STEPS[phase]) nextPhase();
}, 1000);
