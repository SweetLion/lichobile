var i18n = require('../../i18n');

function renderOption(label, value, storedValue) {
  return m('option', {
    value: value,
    selected: storedValue === value
  }, i18n(label));
}

module.exports = {

  renderRadio: function(label, name, value, settingsProp) {
    var isOn = settingsProp() === value;
    var id = name + '_' + value;
    return [
      m('input.radio[type=radio]', {
        name: name,
        id: id,
        className: value,
        value: value,
        checked: isOn,
        onchange: function(e) {
          settingsProp(e.target.value);
        }
      }),
      m('label', {
        'for': id
      }, i18n(label))
    ];
  },

  renderSelect: function(label, name, options, settingsProp, isDisabled) {
    var storedValue = settingsProp();
    return [
      m('label', {
        'for': 'select_' + name
      }, i18n(label)),
      m('select', {
        id: 'select_' + name,
        disabled: isDisabled,
        config: function(el, isUpdate, context) {
          if (!isUpdate) {
            var onChange = function(e) {
              settingsProp(e.target.value);
              setTimeout(function() {
                m.redraw();
              }, 10);
            };
            el.addEventListener('change', onChange, false);
            context.onunload = function() {
              el.removeEventListener('change', onChange, false);
            };
          }
        }
      }, options.map(function(e) {
        return renderOption(e[0], e[1], storedValue);
      }))
    ];
  },

  renderCheckbox: function(label, name, settingsProp) {
    var isOn = settingsProp();
    return m('div.check_container', [
      m('label', {
        'for': name
      }, label),
      m('input[type=checkbox]', {
        name: name,
        checked: isOn,
        onchange: function() {
          settingsProp(!isOn);
        }
      })
    ]);
  }

};
