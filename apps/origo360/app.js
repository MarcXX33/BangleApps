let bpm = "---";
let bpmConfidence = 0;
let lastBpmTime = 0;

const w = g.getWidth();
const h = g.getHeight();
const half_w = w / 2;

function draw() {
  g.reset();
  const date = new Date();
  const timeStr = require("locale").time(date, 1);
  const dateStr = require("locale").date(date, 0).toUpperCase();

  g.setBgColor(g.theme.bg).clear();
  
  g.setFont("Vector", 70);
  g.setFontAlign(0, 0);
  g.setColor(g.theme.fg);
  g.drawString(timeStr, half_w, h/2 - 20);

  g.setFont("Vector", 22);
  g.drawString(dateStr, half_w, h/2 + 30);
  
  let bpmColor = '#888';
  if (bpmConfidence > 70 && (Date.now() - lastBpmTime) < 4000) {
     bpmColor = '#f00';
     if (bpm >= 110) {
       Bangle.buzz(400, 1);
       load("atem46.app.js");
     }
  }
  g.setColor(bpmColor).setFont("Vector:28").drawString(bpm, half_w, h - 28);
  
  if (drawTimeout) clearTimeout(drawTimeout);
  drawTimeout = setTimeout(()=> {
    drawTimeout = undefined;
    draw();
  }, 60000 - (Date.now() % 60000));
}

Bangle.on('HRM', function(hrm) {
  bpmConfidence = hrm.confidence;
  if (bpmConfidence > 60) {
    bpm = hrm.bpm;
    lastBpmTime = Date.now();
  }
});

// App-Launcher per Touch
Bangle.on("touch", function(button, xy) {
  Bangle.buzz(100);
  if (xy.x < w/2 && xy.y < h/2) load("atem478.app.js");
  if (xy.x >= w/2 && xy.y < h/2) load("atem444.app.js");
  if (xy.x < w/2 && xy.y >= h/2) load("atem46.app.js");
  if (xy.x >= w/2 && xy.y >= h/2) load("medit15.app.js");
});

g.clear();
Bangle.setHRMPower(1, "clock");
Bangle.loadWidgets();
Bangle.drawWidgets();
let drawTimeout;
draw();
Bangle.setUI("clock");
