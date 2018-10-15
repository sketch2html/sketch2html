'use strict';

import { Document } from 'sketch/dom';
import UI from 'sketch/ui';

import preCheck from './preCheck';
import ScLayer from './ScLayer';
import util from './util';

export default function() {
  let selection = preCheck();
  if(!selection) {
    return;
  }
  let list = [];
  selection.map(item => {
    let artboard = util.getTop(item);
    let scLayer = ScLayer.getInstance(item, 0, artboard);
    if(scLayer) {
      scLayer.parse();
      if(!scLayer.meta) {
        list.push(scLayer);
      }
    }
  });
  if(!list.length) {
    UI.alert('Warn', 'No avalible layer can be output!');
    return;
  }
  return list;
}
