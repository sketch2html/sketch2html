'use strict';

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
  for(let i = 0, len = json.length; i < len - 1; i++) {
    let a = json[i];
    for(let j = i + 1; j < len; j++) {
      let b = json[j];
      if(overlay(a, b)) {
        addOverlay(a, b);
      }
    }
  }
  let zHash = new Map();
  let lHash = new Map();
  json.forEach((item, i) => {
    zHash.set(item.id, i);
    lHash.set(item.id, item);
  });
  // 重合的图层，排除掉本身是背景的图，下方为图像的肯定是背景图
  json.forEach((item, i) => {
    if(item.overlay.length && item.isImage) {
      let num = 0;
      item.overlay.forEach(id => {
        let z = zHash.get(id);
        if(z > i) {
          num++;
        }
      });
      item.isBackground = num > 0;
    }
  });
  return json;
}
