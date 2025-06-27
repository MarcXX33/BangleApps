const SETTINGS_FILE = "origo360.settings.json";
let settings = Object.assign({'theme':'System','showdate':true,'clkinfoborder':true}, require("Storage").readJSON(SETTINGS_FILE,1)||{});

let background = require("clockbg");
let theme;
let drawTimeout;

const h = g.getHeight();
const w = g.getWidth();
const h2 = Math.round(3*h/5) - 10;
const h3 = Math.round(7*h/8);

function draw() {
  let locale = require("locale");
  let date = new Date();
  let time = locale.time(date, 1);

  g.reset();
  g.setBgColor(theme.bg).clearRect(0, h2, w, h3);
  if (settings.showdate) {
    g.setColor(theme.fg).fillRect(w / 2 - 30, h3 + 5, w / 2 + 30, h);
    g.setFont("6x8",2).setFontAlign(0, -1);
    g.setColor(theme.bg).drawString(date.getDate() + "." + (date.getMonth() + 1), w / 2, h3 + 5);
  }
  g.setFont("6x8",4).setFontAlign(0, -1);
  g.setColor(theme.fg);
  g.drawString(time, w/2, h2 + 8);

  if (drawTimeout) clearTimeout(drawTimeout);
  drawTimeout = setTimeout(function() {
    drawTimeout = undefined;
    draw();
  }, 60000 - (Date.now() % 60000));
}

function loadThemeColors() {
  theme = {fg: g.theme.fg, bg: g.theme.bg};
  if (settings.theme === "Dark") {
    theme.fg = g.toColor(1,1,1);
    theme.bg = g.toColor(0,0,0);
  } else if (settings.theme === "Light") {
    theme.fg = g.toColor(0,0,0);
    theme.bg = g.toColor(1,1,1);
  }
}

loadThemeColors();

Bangle.setUI({
  mode: "clock",
  remove: function() {
    if (drawTimeout) clearTimeout(drawTimeout);
    drawTimeout = undefined;
    // Die Zeile require("widget_utils").show() wurde entfernt
  },
  redraw: draw
});

Bangle.loadWidgets();
// Die Zeile require("widget_utils").swipeOn() wurde entfernt
background.fillRect(Bangle.appRect);
g.setColor(theme.fg).fillRect(0, h2 - 6, w, h3 + 6);
draw();
