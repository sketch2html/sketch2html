'use strict';

import UI from 'sketch/ui';

import format from './format';
import flatten from './flatten';

export default function() {
  let list = format();
  if(!list) {
    return;
  }
  let arr = list.map(item => {
    let json = item.toJSON();
    return flatten(json);
  });
  let options = ['Desktop', 'Documents', 'Downloads'];
  let sel = UI.getSelectionFromUser(
    "Please choose your output directory:",
    options
  );
  let ok = sel[2];
  let value = options[sel[1]];
  if(ok) {
    let path = `~/${value}/sketch2code`;
    list.forEach((scLayer) => {
      scLayer.output(path);
    });
  }
}
