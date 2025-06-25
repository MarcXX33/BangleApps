(function() {
  // Globale Zustandsvariablen
  let exerciseInProgress = null;
  let currentBpm = 0;
  let hrmConfidence = 0;
  let highBpmPromptShown = false;
  let clockInfoMenuA, clockInfoMenuB; // Menüs global definieren

  function restoreClockUi() {
    exerciseInProgress = null;
    Bangle.setUI();
    g.clear();
    Bangle.loadWidgets();
    // Die Zeile mit widget_utils.swipeOn() wurde hier entfernt.
    buildPebbleUi();
    draw();
    Bangle.setLCDTimeout(10);
  }

  const Breathing_46 = {
    isRunning: false, phase: 0, cycle: 1, step: 0, countdownInterval: undefined, MAX_CYCLES: 3, PHASES: ["Einatmen", "Ausatmen"], PHASE_COLORS: ["#0033FF", "#800080"], PHASE_DURATIONS: [4000, 6000],
    drawPhaseScreen: function() {
      let bg = this.PHASE_COLORS[this.phase] || "#000000";
      g.setBgColor(bg).clear(); g.setColor(0,0,0);
      g.setFont("Vector", 34).setFontAlign(0,0).drawString(this.PHASES[this.phase], g.getWidth()/2, g.getHeight()/2 - 30);
      g.setFont("Vector", 28).drawString(this.step + (this.phase === 0 ? "/4" : "/6"), g.getWidth()/2, g.getHeight()/2 + 10);
      g.setFont("Vector", 22).drawString(currentBpm + " BPM", g.getWidth()/2, g.getHeight() - 25);
    },
    startPhaseCycle: function() {
      this.step = 0; this.drawPhaseScreen();
      let steps = (this.phase === 0) ? 4 : 6;
      let stepTime = this.PHASE_DURATIONS[this.phase] / steps;
      if (this.countdownInterval) clearInterval(this.countdownInterval);
      this.countdownInterval = setInterval(() => {
        this.step++; this.drawPhaseScreen();
        if (this.phase === 0) Bangle.buzz(80); else if (this.phase === 1) Bangle.buzz(100).then(() => setTimeout(() => Bangle.buzz(100), 200));
        if (this.step >= steps) {
          clearInterval(this.countdownInterval); this.phase = (this.phase + 1) % 2;
          if (this.phase === 0) { this.cycle++; if (this.cycle > this.MAX_CYCLES) { this.checkBPMAndDecide(); return; } }
          this.startPhaseCycle();
        }
      }, stepTime);
    },
    checkBPMAndDecide: function() { if (currentBpm >= 100) { this.cycle = 1; this.startPhaseCycle(); } else { this.stop(); } },
    start: function() {
      if (this.isRunning) return; this.isRunning = true; exerciseInProgress = this;
      this.phase = 0; this.cycle = 1; this.step = 0;
      Bangle.setLCDTimeout(0); Bangle.setLCDPower(1); Bangle.setUI();
      this.startPhaseCycle();
    },
    stop: function() {
      this.isRunning = false; if (this.countdownInterval) clearInterval(this.countdownInterval); this.countdownInterval = undefined;
      g.setBgColor(0,0,0).clear(); g.setColor(1,1,1).setFont("Vector", 24).setFontAlign(0,0).drawString("Übung beendet", g.getWidth()/2, g.getHeight()/2);
      setTimeout(restoreClockUi, 2000);
    },
    updateBpm: function() { if (this.isRunning) { this.drawPhaseScreen(); } }
  };

  const Breathing_444 = {
    isRunning: false, phase: 0, cycle: 1, step: 0, countdownInterval: undefined, holdVibrationInterval: undefined, MAX_CYCLES: 3, PHASES: ["Einatmen", "Halten", "Ausatmen", "Ruhe"], PHASE_COLORS: ["#0033FF", "#008000", "#800080", "#000000"], PHASE_DURATION: 4000,
    drawPhaseScreen: function() {
      let bg = this.PHASE_COLORS[this.phase] || "#000000";
      g.setBgColor(bg).clear(); g.setColor(bg === "#000000" ? 1 : 0);
      g.setFont("Vector", 34).setFontAlign(0,0).drawString(this.PHASES[this.phase], g.getWidth()/2, g.getHeight()/2 - 30);
      if (this.PHASES[this.phase] !== "Ruhe") g.setFont("Vector", 28).drawString(this.step + "/4", g.getWidth()/2, g.getHeight()/2 + 10);
      g.setFont("Vector", 22).drawString(currentBpm + " BPM", g.getWidth()/2, g.getHeight() - 25);
    },
    vibratePhaseStart: function() {
      this.stopHoldVibration();
      if (this.PHASES[this.phase] === "Halten") this.holdVibrationInterval = setInterval(() => { Bangle.buzz(100).then(() => setTimeout(() => Bangle.buzz(100), 200)); }, 1000);
      else if (this.PHASES[this.phase] === "Einatmen" || this.PHASES[this.phase] === "Ausatmen") Bangle.buzz(100);
    },
    stopHoldVibration: function() { if (this.holdVibrationInterval) clearInterval(this.holdVibrationInterval); this.holdVibrationInterval = undefined; },
    startPhaseCycle: function() {
      this.vibratePhaseStart(); this.step = 0; this.drawPhaseScreen();
      let stepTime = this.PHASE_DURATION / 4;
      if (this.countdownInterval) clearInterval(this.countdownInterval);
      this.countdownInterval = setInterval(() => {
        this.step++; this.drawPhaseScreen();
        if (this.step >= 4) {
          clearInterval(this.countdownInterval); this.stopHoldVibration(); this.phase = (this.phase + 1) % 4;
          if (this.phase === 0) { this.cycle++; if (this.cycle > this.MAX_CYCLES) { this.stop(); return; } }
          this.startPhaseCycle();
        }
      }, stepTime);
    },
    start: function() {
      if (this.isRunning) return; this.isRunning = true; exerciseInProgress = this;
      this.phase = 0; this.cycle = 1; this.step = 0;
      Bangle.setLCDTimeout(0); Bangle.setLCDPower(1); Bangle.setUI();
      this.startPhaseCycle();
    },
    stop: function() {
      this.isRunning = false; if (this.countdownInterval) clearInterval(this.countdownInterval); this.countdownInterval = undefined; this.stopHoldVibration();
      g.setBgColor(0,0,0).clear(); g.setColor(1,1,1).setFont("Vector", 24).setFontAlign(0,0).drawString("Übung beendet", g.getWidth()/2, g.getHeight()/2);
      setTimeout(restoreClockUi, 2000);
    },
    updateBpm: function() { if (this.isRunning) { this.drawPhaseScreen(); } }
  };

  const Breathing_478 = {
    isRunning: false, phase: 0, cycle: 1, step: 0, countdownInterval: undefined, MAX_CYCLES: 4, PHASES: ["Einatmen", "Halten", "Ausatmen"], PHASE_COLORS: ["#0033FF", "#008000", "#800080"], PHASE_STEPS: [4, 7, 8],
    drawPhaseScreen: function() {
      let bg = this.PHASE_COLORS[this.phase];
      g.setBgColor(bg).clear(); g.setColor(0,0,0);
      g.setFont("Vector", 24).setFontAlign(0,0).drawString("Zyklus " + this.cycle + "/" + this.MAX_CYCLES, g.getWidth()/2, 20);
      g.setFont("Vector", 34).drawString(this.PHASES[this.phase], g.getWidth()/2, g.getHeight()/2 - 30);
      g.setFont("Vector", 28).drawString(this.step + "/" + this.PHASE_STEPS[this.phase], g.getWidth()/2, g.getHeight()/2 + 10);
      g.setFont("Vector", 22).drawString(currentBpm + " BPM", g.getWidth()/2, g.getHeight() - 25);
    },
    vibrateForPhaseStep: function() {
      if (this.phase === 0) Bangle.buzz(100).then(() => setTimeout(() => Bangle.buzz(100), 200));
      else if (this.phase === 1 && this.step === 1) Bangle.buzz(150);
      else if (this.phase === 2) {
        if (this.step === 1) { Bangle.buzz(100); setTimeout(() => Bangle.buzz(100), 200); setTimeout(() => Bangle.buzz(100), 400); }
        if (this.step === this.PHASE_STEPS[2]) setTimeout(() => Bangle.buzz(150), 600);
      }
    },
    startPhase: function() {
      this.step = 0; this.drawPhaseScreen(); this.vibrateForPhaseStep();
      if (this.countdownInterval) clearInterval(this.countdownInterval);
      this.countdownInterval = setInterval(() => {
        this.step++; this.drawPhaseScreen(); this.vibrateForPhaseStep();
        if (this.step >= this.PHASE_STEPS[this.phase]) { clearInterval(this.countdownInterval); this.nextPhase(); }
      }, 1000);
    },
    nextPhase: function() {
      this.phase = (this.phase + 1) % 3;
      if (this.phase === 0) { this.cycle++; if (this.cycle > this.MAX_CYCLES) { this.stop(); return; } }
      this.startPhase();
    },
    start: function() {
      if (this.isRunning) return; this.isRunning = true; exerciseInProgress = this;
      this.phase = 0; this.cycle = 1;
      Bangle.setLCDTimeout(0); Bangle.setLCDPower(1); Bangle.setUI();
      this.startPhase();
    },
    stop: function() {
      this.isRunning = false; if (this.countdownInterval) clearInterval(this.countdownInterval); this.countdownInterval = undefined;
      g.setBgColor(0,0,0).clear(); g.setColor(1,1,1).setFont("Vector", 24).setFontAlign(0,0).drawString("Übung beendet", g.getWidth()/2, g.getHeight()/2);
      setTimeout(restoreClockUi, 2000);
    },
    updateBpm: function() { if (this.isRunning) { this.drawPhaseScreen(); } }
  };

  var buildPebbleUi, draw; // Forward declare
  
  (function() {
    const SETTINGS_FILE = "sension.settings.json";
    let settings = {}, theme, drawTimeout;
    const h = g.getHeight(), w = g.getWidth(), h2 = Math.round(3*h/5) - 10, h3 = Math.round(7*h/8);
    
    Graphics.prototype.setFontLECO1976Regular42=function(s){return g.setFontCustom(atob("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/AAAAAAAAH/AAAAAAAAH/AAAAAAAAH/AAAAAAAAH/AAAAAAAAH/AAAAAAAAH/AAAAAAAAH/AAAAAAAAD/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAA/AAAAAAAAH/AAAAAAAA//AAAAAAAP//AAAAAAB///AAAAAAP///AAAAAB////AAAAAf////AAAAD////4AAAAf////AAAAH////4AAAA////+AAAAA////wAAAAA///+AAAAAA///gAAAAAA//8AAAAAAA//gAAAAAAA/4AAAAAAAA/AAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA/4AAAH/AAA/4AAAH/AAA/4AAAH/AAA/4AAAH/AAA/4AAAH/AAA/4AAAH/AAA/4AAAH/AAA/4AAAH/AAA/4AAAH/AAA/4AAAH/AAA/4AAAH/AAA/4AAAH/AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/4AAAH/AAA/4AAAH/AAA/4AAAH/AAA/4AAAH/AAA/4AAAH/AAA/4AAAH/AAA/4AAAH/AAA/4AAAH/AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAAAAAAAH/AAAAAAAAH/AAAAAAAAH/AAAAAAAAH/AAAAAAAAH/AAAAAAAAH/AAAAAAAAH/AAAAAAAAH/AAAAAAAAD/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//h////AAA//h////AAA//h////AAA//h////AAA//h////AAA//h////AAA//h////AAA//h////AAA//h////AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA////wH/AAA////wH/AAA////wH/AAA////wH/AAA////wH/AAA////wH/AAA////wH/AAA////wH/AAA////gD/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/4AAAH/AAA/4AAAH/AAA/4AAAH/AAA/4AAAH/AAA/4B/gH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////wAAAAA////wAAAAA////wAAAAA////wAAAAA////wAAAAA////wAAAAA////wAAAAA////wAAAAA////wAAAAAAAB/wAAAAAAAB/wAAAAAAAB/wAAAAAAAB/wAAAAAAAB/wAAAAAAAB/wAAAAAAAB/wAAAAAAAB/wAAAAAAAB/wAAAAAAAB/wAAAAAAAB/wAAAAAAAB/wAAAAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////x//AAA////x//AAA////x//AAA////x//AAA////x//AAA////x//AAA////x//AAA////x//AAA////x//AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B////AAA/4B////AAA/4B////AAA/4B////AAA/4B////AAA/4B////AAA/4B////AAA/4B////AAA/wB////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B////AAA/4B////AAA/4B////AAA/4B////AAA/4B////AAA/4B////AAA/4B////AAA/4B////AAA/wB////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//gAAAAAAA//gAAAAAAA//gAAAAAAA//gAAAAAAA//gAAAAAAA//gAAAAAAA//gAAAAAAA//gAAAAAAA//gAAAAAAA/4AAAAAAAA/4AAAAAAAA/4AAAAAAAA/4AAAAAAAA/4AAAAAAAA/4AAAAAAAA/4AAAAAAAA/4AAAAAAAA/4AAAAAAAA/4AAAAAAAA/4AAAAAAAA/4AAAAAAAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////wH/AAA////wH/AAA////wH/AAA////wH/AAA////wH/AAA////wH/AAA////wH/AAA////wH/AAA////wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA/4B/wH/AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAA///////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP+AAH/AAAAP+AAH/AAAAP+AAH/AAAAP+AAH/AAAAP+AAH/AAAAP+AAH/AAAAP+AAH/AAAAP+AAH/AAAAH+AAD/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),46,atob("ERkmHyYmJiYmJCYmEQ=="),60+(s<<8)+(1<<16))};
    Graphics.prototype.setFontLECO1976Regular22=function(s){return g.setFontCustom(atob("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/nA/+cD/5wP/nAAAAAAAAPwAA/gAD+AAPwAAAAAD+AAP4AA/gAAAAAAAAAAAAAcOAP//A//8D//wP//AHDgAcOAP//A//8D//wP//AHDgAAAAAAAAH/jgf+OB/44H/jj8OP/w4//Dj/8OPxw/4HD/gcP+Bw/4AAAAAAAP+AA/8AD/wQOHHA4c8D//wP/8A//gAD4AAfAAH/8A//wP//A84cDjhwIP/AA/8AB/wAAAAAAAD//wP//A//8D//wOHHA4ccDhxwOHHA4f8Dh/wOH/A4f8ABwAAAAAAAAD8AAP4AA/gAD8AAAAAAAAAAAEAAD+AB//A///v/D//gB/wABwAAAAAADgAA/wAf/4P8///wf/4AP8AAOAAAAAAAAAyAAHcAAPwAD/gAP/AA/8AA/AAH8AAMwAAAAAAAAAAAAADgAAOAAA4AAf8AD/wAP/AA/8AAOAAA4AADgAAAAAAAAAAD8AAfwAB/AAD8AAAAAAAADgAAOAAA4AADgAAOAAA4AADgAAAAAAAAAADgAAOAAA4AADgAAAAAAAAABwAB/AA/8A//gP/gA/wADwAAIAAAAAAD//wP//A//8D//wOAHA4AcDgBwOAHA//8D//wP//A//8AAAAAAAA4AcDgBwOAHA//8D//wP//A//8AABwAAHAAAcAAAAAAAA+f8D5/wPn/A+f8DhxwOHHA4ccDhxwP/HA/8cD/xwP/HAAAAAAAAOAHA4AcDhxwOHHA4ccDhxwOHHA4ccD//wP//A//8D//wAAAAAAAD/wAP/AA/8AD/wAAHAAAcAABwAAHAA//8D//wP//A//8AAAAAAAA/98D/3wP/fA/98DhxwOHHA4ccDhxwOH/A4f8Dh/wOH/AAAAAAAAP//A//8D//wP//A4ccDhxwOHHA4ccDh/wOH/A4f8Dh/wAAAAAAAD4AAPgAA+AADgAAOAAA4AADgAAP//A//8D//wP//AAAAAAAAP//A//8D//wP//A4ccDhxwOHHA4ccD//wP//A//8D//wAAAAAAAD/xwP/HA/8cD/xwOHHA4ccDhxwOHHA//8D//wP//A//8AAAAAAAAOA4A4DgDgOAOA4AAAAAAAAOA/A4H8DgfwOA/AAAAAAAAB4AAPwAA/AAD8AAf4ABzgAPPAA8cAHh4AAAAAAAAAAAAHHAAccABxwAHHAAccABxwAHHAAccABxwAHHAAAAAAAAAOHAA4cADzwAPPAAf4AB/gAD8AAPwAAeAAB4AAAAAAAAA+AAD4AAPgAA+ecDh9wOH3A4fcDhwAP/AA/8AD/wAP/AAAAAAAAAP//4///j//+P//44ADjn/OOf845/zjnHOP8c4//zj//OP/84AAAAAAAP//A//8D//wP//A4cADhwAOHAA4cAD//wP//A//8D//wAAAAAAAD//wP//A//8D//wOHHA4ccDhxwOHHA//8D//wP9/A/j8AAAAAAAA//8D//wP//A//8DgBwOAHA4AcDgBwOAHA4AcDgBwOAHAAAAAAAAP//A//8D//wP//A4AcDgBwOAHA8A8D//wH/+AP/wAf+AAAAAAAAD//wP//A//8D//wOHHA4ccDhxwOHHA4ccDhxwOAHA4AcAAAAAAAA//8D//wP//A//8DhwAOHAA4cADhwAOHAA4cADgAAOAAAAAAD//wP//A//8D//wOAHA4ccDhxwOHHA4f8Dh/wOH/A4f8AAAAAAAA//8D//wP//A//8ABwAAHAAAcAABwAP//A//8D//wP//AAAAAAAAP//A//8D//wP//AAAAAAAAOAHA4AcDgBwOAHA4AcDgBwOAHA//8D//wP//A//8AAAAAAAA//8D//wP//A//8AHwAA/AAP8AB/wAPn/A8f8DB/wIH/AAAAAAAAP//A//8D//wP//AAAcAABwAAHAAAcAABwAAHAAAAAAAAP//A//8D//wP//Af8AAP+AAH/AAD8AAHwAD/AB/wAf8AP+AA//8D//wP//AAAAAAAAP//A//8D//wP//AfwAAfwAAfwAAfwAAfwP//A//8D//wAAAAAAAAAAAP//A//8D//wP//A4AcDgBwOAHA4AcD//wP//A//8D//wAAAAAAAD//wP//A//8D//wOHAA4cADhwAOHAA/8AD/wAP/AA/8AAAAAP//A//8D//wP//A4AcDgBwOAHA4AcD//+P//4///j//+AAA4AADgAAAP//A//8D//wP//A4eADh+AOH8A4f4D/3wP/HA/8MD/wQAAAAAAAD/xwP/HA/8cD/xwOHHA4ccDhxwOHHA4f8Dh/wOH/A4f8AAAAAAAA4AADgAAOAAA//8D//wP//A//8DgAAOAAA4AADgAAAAAA//8D//wP//A//8AABwAAHAAAcAABwP//A//8D//wP//AAAADAAAPgAA/wAD/4AB/8AA/8AAfwAB/AA/8Af+AP/AA/wAD4AAMAAA4AAD+AAP/gA//8AH/wAB/AAf8Af/wP/4A/4AD/gAP/4AH/8AB/wAB/AB/8D//wP/gA/gADgAAIABA4AcDwDwPw/Afn4Af+AA/wAD/AA//AH5+A/D8DwDwOAHAgAEAAAAP/AA/8AD/wAP/AAAf8AB/wAH/AAf8D/wAP/AA/8AD/wAAAAAAAADh/wOH/A4f8Dh/wOHHA4ccDhxwOHHA/8cD/xwP/HA/8cAAAAAAAAf//9///3///f//9wAA3AADcAAMAAAOAAA/gAD/wAH/8AB/8AA/wAAPAAAEAAAAHAADcAANwAB3///f//9///wAA"),32,atob("BwYLDg4UDwYJCQwMBgkGCQ4MDg4ODg4NDg4GBgwMDA4PDg4ODg4NDg4GDQ4MEg8ODQ8ODgwODhQODg4ICQg="),22+(s<<8)+(1<<16))};
    Graphics.prototype.setFontLECO1976Regular14=function(){return this.setFontCustom(atob('AAAAAAAAAAAD+w/sAAAAA8APAAAA8APAAAAMwP/D/wMwDMD/w/8DMAAAAAD8w/M8z/M/zPM/DPwAAAAPwD8QzcP/D/AHgD/D/wzMI/APwAAAAD/w/8MzDMwzMM/DPwDAAADwA8AAAAAAD8H/74f4BwAAAA4B/z8/8D8AAAAAeAPwD8AeAHgAAAAAAAAYAGAH4B+AGABgAAAAAAHgB4AAAAAYAGABgAYAAAAAABgAYAAAAQA8D/D+A8AAAAAA/8P/DAwwMMDD/w/8AAAAAwMMDD/w/8ADAAwAAO/DvwzMMzDMw/MPzAAAAAMDDMwzMMzDMw/8P/AAAAAPwD8ADAAwAMA/8P/AAAAAP3D9wzMMzDMwz8M/AAAAAP/D/wzMMzDMwz8M/AAA4AOADAAwAMAD/w/8AAAAA/8P/DMwzMMzD/w/8AAAAA/MPzDMwzMMzD/w/8AAAAAYYGGAAAAAGHhh4AABwAcAPgDYB3AYwAAAAAZgGYBmAZgGYBmAAAAABjAdwDYA+AHABwAAA4AOADOwzsMwD8A/AAAAAA//P/zAM37N+zZs/7P+wAAAAP/D/wzAMwDMA/8P/AAAAAP/D/wzMMzDMw/8P/AAAAAP/D/wwMMDDAwwMMDAAAAAP/D/wwMMDDhw/8H+AAAAAP/D/wzMMzDMwzMMDAAAAAP/D/wzAMwDMAzAMAAAA/8P/DAwzMMzDPwz8AAAAA/8P/AMADAAwD/w/8AAAAA/8P/AAAwMMDDAwwMMDD/w/8AAAAA/8P/AcAPAPwDvwj8AAAAA/8P/AAwAMADAAwAAP/D/w/AB+AHwA8B+B+A/8P/AAA/8P/D/wfAB8AHw/8P/AAAAAP/D/wwMMDDAw/8P/AAAAAP/D/wzAMwDMA/APwAAA/8P/DAwwMMDD/8//AAwAA/8P/DOAzwM/D9w/EAAAAA/MPzDMwzMMzDPwz8AADAAwAMAD/w/8MADAAwAAAD/w/8ADAAwAMP/D/wAAPAD8AP4AfAHwP4PwDgAAAPgD/gH8AfB/w/AP4A/wA8D/D/A8AAADAw4cP/A/APwH+DzwwMAAAAA/APwAPwD8A/D8A/AAAAAAz8M/DMwzMMzD8w/MAAAAA/////ADwA4ADwA/wB/ADwAAMAPAD////8A'),32,atob("BAQHCQkNCQQGBggIBAYEBgkHCQkJCQkICQkEBAcIBwkKCQkJCQkICQkECAkHDAkJCAkJCQgJCQ0JCQkFBgU="),14|65536)};

    let loadThemeColors = function() {
      settings = Object.assign({'theme':'System', 'showdate':true, 'clkinfoborder': true}, require("Storage").readJSON(SETTINGS_FILE,1)||{});
      theme = {fg: g.theme.fg, bg: g.theme.bg };
      if (settings.theme === "Dark") { theme.fg = g.toColor(1,1,1); theme.bg = g.toColor(0,0,0); }
      else if (settings.theme === "Light") { theme.fg = g.toColor(0,0,0); theme.bg = g.toColor(1,1,1); }
    };
    
    draw = function() {
      if (exerciseInProgress || highBpmPromptShown) return;
      let locale = require("locale");
      let date = new Date(), time = locale.time(date, 1);
      g.reset().setBgColor(theme.bg).clearRect(0, h2, w, h3);
      if (settings.showdate) {
        g.setColor(theme.fg).fillRect(w/2 - 40, h3 + 5, w/2 + 40, h);
        g.setFontLECO1976Regular22().setFontAlign(0, -1).setColor(theme.bg).drawString(date.getDate() + "." + (date.getMonth() + 1), w/2, h3 + 5);
      }
      g.setFontLECO1976Regular42().setFontAlign(0, -1).setColor(theme.fg).drawString(time, w/2, h2 + 8);
      g.setFont("6x8").setFontAlign(0, -1).setColor(theme.fg);
      g.clearRect(w/2 - 20, h-12, w/2 + 20, h-2);
      g.drawString((hrmConfidence > 60 ? currentBpm : "--") + " bpm", w/2, h-10);
      if (drawTimeout) clearTimeout(drawTimeout);
      drawTimeout = setTimeout(function() { drawTimeout = undefined; draw(); }, 60000 - (Date.now() % 60000));
    };

    buildPebbleUi = function() {
      let background = require("clockbg");
      loadThemeColors();
      background.fillRect(Bangle.appRect);
      g.setColor(theme.fg).fillRect(0, h2 - 6, w, h3 + 6);
      const breathingIcon = require("heatshrink").decompress(atob("j0GwgH+AAYOCBwMAkyQC/ATdyACEkAmV/4AoV4A=="));
      let clockInfoItems = [
        { name : "Atem 4-7-8", get : () => ({ text : "4-7-8", img : breathingIcon }), show : () => Breathing_478.start() },
        { name : "Atem 4-4-4", get : () => ({ text : "4-4-4", img : breathingIcon }), show : () => Breathing_444.start() }
      ];
      let clockInfoW = 0|(w/2), clockInfoH = h2 - 8;
      let clockInfoDraw = (itm, info, options) => {
          g.reset().setBgColor(theme.bg).setColor(theme.fg);
          var y,b=0; if (options.focus) { b=4; g.clearRect(options.x, options.y, options.x+options.w-1, options.y+options.h-1); }
          background.fillRect(options.x+b, options.y+b, options.x+options.w-1-b, options.y+options.h-1-b);
          var midx = options.x+options.w/2;
          if (info.img) g.drawImage(info.img, midx-12, options.y+8);
          g.setFontLECO1976Regular22().setFontAlign(0, 0);
          var txt = info.text.toString().toUpperCase(), y = options.y+options.h-20;
          if (settings.clkinfoborder) {
              g.setColor(theme.bg).drawString(txt, midx-1, y).drawString(txt, midx+1, y).drawString(txt, midx, y-1).drawString(txt, midx, y+1);
              g.setColor(theme.fg);
          }
          g.drawString(txt, midx, y);
      };
      let clock_info_mod = require("clock_info");
      clockInfoMenuA = clock_info_mod.addInteractive(clockInfoItems, { x : 0, y: 0, w: clockInfoW, h:clockInfoH, draw : clockInfoDraw });
      clockInfoMenuB = clock_info_mod.addInteractive(clockInfoItems, { x : w/2, y: 0, w: clockInfoW, h:clockInfoH, draw : clockInfoDraw, startWith: 1 });
      Bangle.setUI({
        mode : "clock", redraw : draw,
        remove : function() {
          if (drawTimeout) clearTimeout(drawTimeout); drawTimeout = undefined;
          if (clockInfoMenuA) clockInfoMenuA.remove();
          if (clockInfoMenuB) clockInfoMenuB.remove();
          delete Graphics.prototype.setFontLECO1976Regular22;
          delete Graphics.prototype.setFontLECO1976Regular42;
          delete Graphics.prototype.setFontLECO1976Regular14;
        }
      });
    };

    function showHighBpmPrompt() {
        if (exerciseInProgress || highBpmPromptShown) return;
        highBpmPromptShown = true;
        Bangle.setUI("updown", btn=>{
          highBpmPromptShown = false;
          if (btn) Breathing_46.start(); else restoreClockUi();
        });
        g.setBgColor("#FFAAAA").clear(); g.setColor(0,0,0).setFont("Vector", 24).setFontAlign(0, 0);
        g.drawString("Puls > 100", g.getWidth()/2, g.getHeight()/2 - 30);
        g.drawString("Atmen starten?", g.getWidth()/2, g.getHeight()/2);
        g.setFont("6x8").drawString("Tippen: JA", g.getWidth()/2, g.getHeight()/2+30);
        Bangle.buzz(100).then(() => setTimeout(() => Bangle.buzz(100), 200));
        setTimeout(() => { if(highBpmPromptShown) { highBpmPromptShown = false; restoreClockUi(); } }, 10000);
    }
    
    Bangle.on('HRM', function(hrm) {
      hrmConfidence = hrm.confidence;
      if (hrm.confidence > 60) {
          currentBpm = Math.round(hrm.bpm);
          if (exerciseInProgress) exerciseInProgress.updateBpm();
          else if (!highBpmPromptShown) {
              if (draw) draw(); if (currentBpm >= 100) showHighBpmPrompt();
          }
      } else if (!exerciseInProgress && !highBpmPromptShown && draw) draw();
    });

    Bangle.setHRMPower(1);
