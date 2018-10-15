'use strict';

import type from './type';

export default {
  getTop(layer) {
    if(!layer) {
      return null;
    }
    do {
      if(layer.type === type.ARTBOARD) {
        return layer;
      }
      if(layer.parent.type === type.PAGE) {
        return layer;
      }
      layer = layer.parent;
    }
    while(layer.parent);
    return null;
  },
};
