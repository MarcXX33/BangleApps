(function(back) {
  const SETTINGS_FILE = "origo360.settings.json"; // KORRIGIERT

  let settings = {'theme':'System', 'showdate':true,'clkinfoborder':true}
  const storage = require('Storage');
  settings = Object.assign(settings, storage.readJSON(SETTINGS_FILE, 1)||{});

  function save() {
    storage.write(SETTINGS_FILE, settings);
  }

  var theme_options = ['System', 'Light', 'Dark'];

  E.showMenu({
    '': { 'title': 'Origo 360' }, // KORRIGIERT
    /*LANG*/'< Back': back,
    'Theme': {
      value: 0 | theme_options.indexOf(settings.theme),
      min: 0, max: theme_options.length - 1,
      format: v => theme_options[v],
      onchange: v => {
        settings.theme = theme_options[v];
        save();
      }
    },
    'Show Date': {
      value: !!settings.showdate,
      onchange: v => {
        settings.showdate = v;
        save();
      }
    },
    'ClockInfo border': {
      value: !!settings.clkinfoborder,
      onchange: v => {
        settings.clkinfoborder = v;
        save();
      }
    }
  });
})
