(function(back) {
  const SETTINGS_FILE = "origo360.settings.json";
  let settings = require('Storage').readJSON(SETTINGS_FILE, 1) || {
    showDate: true
  };

  function save(key, value) {
    settings[key] = value;
    require('Storage').write(SETTINGS_FILE, settings);
  }

  const menu = {
    '': { 'title': 'Origo 360' },
    '< Back': back,
    'Show Date': {
      value: !!settings.showDate,
      onchange: v => save('showDate', v)
    }
  };
  E.showMenu(menu);
})
