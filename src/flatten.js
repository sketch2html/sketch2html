'use strict';

import type from './type';

function recursion(data, list) {
  if(Array.isArray(data)) {
    data.forEach(item => {
      recursion(item, list);
    });
    return;
  }
  switch(data.type) {
    case type.GROUP:
      if(data.isImage) {
        list.push(data);
      }
      else if(data.children) {
        recursion(data.children, list);
      }
      break;
    case type.IMAGE:
    case type.TEXT:
    case type.SHAPE:
    case type.SHAPE_PATH:
      list.push(data);
      break;
    case type.SYMBOL_INSTANCE:
      if(data.children) {
        recursion(data.children, list);
      }
      break;
  }
}

export default function(json) {
  let list = [];
  recursion(json.children, list);
  list.forEach((item, i) => {
    item.z = i;
  });
  return {
    top: {
      id: json.id,
      name: json.name,
      type: json.type,
      x: json.x,
      y: json.y,
      xs: json.xs,
      ys: json.ys,
      xc: json.xc,
      yc: json.yc,
      width: json.width,
      height: json.height,
    },
    list,
  };
}
