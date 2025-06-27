const SETTINGS_FILE = "origo360.settings.json";

// Standardeinstellungen
let settings = require('Storage').readJSON(SETTINGS_FILE, 1) || {
  showDate: true
};

function draw() {
  g.reset();
  const date = new Date();
  const timeStr = require("locale").time(date, 1);
  const dateStr = require("locale").date(date, 0).toUpperCase();
  
  const w = g.getWidth();
  const h = g.getHeight();
  const mid_w = w/2;

  g.setBgColor(g.theme.bg).clear();
  
  g.setFont("Vector", 70);
  g.setFontAlign(0, 0);
  g.setColor(g.theme.fg);
  g.drawString(timeStr, mid_w, h/2 - 15);

  if (settings.showDate) {
    g.setFont("Vector", 22);
    g.setFontAlign(0, 0);
    g.drawString(dateStr, mid_w, h/2 + 35);
  }
  
  if (global.drawTimeout) clearTimeout(global.drawTimeout);
  global.drawTimeout = setTimeout(() => {
    drawTimeout = undefined;
    draw();
  }, 60000 - (Date.now() % 60000));
}

g.clear();
Bangle.loadWidgets();
Bangle.drawWidgets();
draw();
Bangle.setUI("clock");
