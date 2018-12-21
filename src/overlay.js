'use strict';

import type from './type';

function overlay(a, b) {
  if(b.xs >= a.xs + a.width || a.xs >= b.xs + b.width) {
    return false;
  }
  if(b.ys >= a.ys + a.height || a.ys >= b.ys + b.height) {
    return false;
  }
  return true;
}

function addOverlay(a, b) {
  if(a.overlay.indexOf(b) === -1) {
    a.overlay.push(b.id);
  }
  if(b.overlay.indexOf(a) === -1) {
    b.overlay.push(a.id);
  }
}

export default function(json) {
  let { list } = json;
  for(let i = 0, len = list.length; i < len - 1; i++) {
    let a = list[i];
    for(let j = i + 1; j < len; j++) {
      let b = list[j];
      if(overlay(a, b)) {
        addOverlay(a, b);
      }
    }
  }
  let zHash = new Map();
  let lHash = new Map();
  list.forEach((item, i) => {
    zHash.set(item.id, i);
    lHash.set(item.id, item);
  });
  // 和文字或图像重合且在下方的一定是背景图
  list.forEach((item, i) => {
    if(item.overlay.length && (item.isImage || item.isMeta)) {
      let num = 0;
      item.overlay.forEach(id => {
        let z = zHash.get(id);
        let o = lHash.get(id);
        if(z > i && o.type === type.TEXT) {
          num++;
        }
      });
      item.isBackground = num > 0;
    }
  });
  // 重合的图像图层，取下方的作为布局，上方的为前景图
  // list.forEach((item, i) => {
  //   if(item.overlay.length && (item.isImage || item.isMeta) && !item.isBackground && item.type !== type.TEXT) {
  //     let num = 0;
  //     item.overlay.forEach(id => {
  //       let z = zHash.get(id);
  //       let o = lHash.get(id);
  //       if(!o.isBackground && z < i) {
  //         num++;
  //       }
  //     });
  //     item.isForeground = num > 0;
  //   }
  // });
  return json;
}
