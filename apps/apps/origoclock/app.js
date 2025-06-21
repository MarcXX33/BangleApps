g.clear();
g.setFont("6x8",2);
g.setFontAlign(0,0);
g.drawString("ORIGO Clock", g.getWidth()/2, g.getHeight()/2);
setTimeout(() => {
  Bangle.showLauncher();
}, 2000);
