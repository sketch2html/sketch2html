'use strict';

import { Document } from 'sketch/dom';
import UI from 'sketch/ui';

export default function() {
  let document = Document.getSelectedDocument();
  let selection = document.selectedLayers;
  if(!selection || selection.isEmpty) {
    UI.alert('Warn', 'At lease one layer must be selected!');
    return;
  }
  return selection;
}
