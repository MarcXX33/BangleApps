(function(){
  global.clockbg = {
    fillRect : function(r) {
      g.setColor(0, 0, 0);
      g.setColor(g.theme.fg);
      g.fillRect(r.x, r.y, r.x + r.w - 1, r.y + r.h - 1);
    }
  };
  // Modul exportieren
  exports.fillRect = global.clockbg.fillRect;
})();
