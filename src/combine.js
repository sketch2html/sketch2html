'use strict';

import lodash from 'lodash';

function isCross(h, v) {
  if(h.y <= v.y[0] || h.y >= v.y[1]) {
    return false;
  }
  if(v.x <= h.x[0] || v.x >= h.x[1]) {
    return false;
  }
  return true;
}

function split(h, startH, endH, v, startV, endV, center) {
  h = lodash.cloneDeep(h);
  v = lodash.cloneDeep(v);
  h.forEach(item => {
    delete item.split;
    if(item.x[1] <= v[startV].x || item.x[0] >= v[endV].x) {
      item.ignore = true;
    }
    else {
      item.x[0] = Math.max(item.x[0], v[startV].x);
      item.x[1] = Math.min(item.x[1], v[endV].x);
    }
  });
  v.forEach(item => {
    delete item.split;
    if(item.y[1] <= h[startH].y || item.y[0] >= h[endH].y) {
      item.ignore = true;
    }
    else {
      item.y[0] = Math.max(item.y[0], h[startH].y);
      item.y[1] = Math.min(item.y[1], h[endH].y);
    }
  });
  let sh = [];
  let sv = [];
  outer:
  for(let i = startH + 1; i < endH; i++) {
    let a = h[i];
    if(a.ignore) {
      continue;
    }
    for(let j = startV + 1; j < endV; j++) {
      let b = v[j];
      if(b.ignore) {
        continue;
      }
      if(isCross(a, b)) {
        continue outer;
      }
    }
    a.split = true;
    sh.push(i);
  }
  outer:
  for(let i = startV + 1; i < endV; i++) {
    let b = v[i];
    if(b.ignore) {
      continue;
    }
    for(let j = startH + 1; j < endH; j++) {
      let a = h[j];
      if(a.ignore) {
        continue;
      }
      if(a.split) {
        continue;
      }
      if(isCross(a, b)) {
        continue outer;
      }
    }
    b.split = true;
    sv.push(i);
  }
  let res = {
    list: [],
  };
  if(sh.length && sv.length) {
    // 先尝试水平线等同矩形宽的可以无冲突切割
    let last = startH;
    for(let i = startH + 1; i < endH; i++) {
      let a = h[i];
      if(a.split && a.x[0] === v[startV].x && a.x[1] === v[endV].x) {
        res.direction = true;
        let temp = split(h, last, i, v, startV, endV, center);
        res.list.push(temp);
        last = i;
      }
    }
    if(res.direction === true && last !== endH) {
      let temp = split(h, last, endH, v, startV, endV, center);
      res.list.push(temp);
    }
    if(res.direction === true && res.list.length === 1) {
      res.list = res.list[0];
    }
    if(res.direction === true) {
      return res;
    }
    // 水平线不存在则尝试垂直线等同矩形高的
    last = startV;
    for(let i = startV + 1; i < endV; i++) {
      let a = v[i];
      if(a.split && a.y[0] === h[startH].y && a.y[1] === h[endH].y) {
        res.direction = false;
        let temp = split(h, startH, endH, v, last, i, center);
        res.list.push(temp);
        last = i;
      }
    }
    if(res.direction === false && last !== endV) {
      let temp = split(h, startH, endH, v, last, endV, center);
      res.list.push(temp);
    }
    if(res.direction === false && res.list.length === 1) {
      res.list = res.list[0];
    }
    if(res.direction === false) {
      return res;
    }
    // 都没有的话，理论上不存在这种可能
  }
  else if(sh.length) {
    res.direction = true;
    let last = startH;
    for(let i = startH + 1; i < endH; i++) {
      let a = h[i];
      if(a.split) {
        let temp = split(h, last, i, v, startV, endV, center);
        res.list.push(temp);
        last = i;
      }
    }
    if(last !== endH) {
      let temp = split(h, last, endH, v, startV, endV, center);
      res.list.push(temp);
    }
    if(res.list.length === 1) {
      res.list = res.list[0];
    }
  }
  else if(sv.length) {
    res.direction = false;
    let last = startV;
    for(let i = startV + 1; i < endV; i++) {
      let a = v[i];
      if(a.split) {
        let temp = split(h, startH, endH, v, last, i, center);
        res.list.push(temp);
        last = i;
      }
    }
    if(last !== endV) {
      let temp = split(h, startH, endH, v, last, endV, center);
      res.list.push(temp);
    }
    if(res.list.length === 1) {
      res.list = res.list[0];
    }
  }
  else {
    // 仅剩4条边，确定唯一包含矩形内容，可能为空返回null
    let countH = 0;
    let countV = 0;
    for(let i = startH + 1; i < endH; i++) {
      if(!h[i].ignore) {
        countH++;
      }
    }
    for(let i = startV + 1; i < endV; i++) {
      if(!v[i].ignore) {
        countV++;
      }
    }
    if(countH === 0 && countV === 0) {
      for(let i = 0; i < center.length; i++) {
        let c = center[i];
        if(c.x > v[startV].x && c.x < v[endV].x && c.y > h[startH].y && c.y < h[endH].y) {
          return c;
        }
      }
      return null;
    }
    // 此时仅有交叉线，依次选取递归进行
    else {
      for(let i = 0; i < sh.length; i++) {
        //
      }
      for(let i = 0; i < sv.length; i++) {}
    }
  }
  return res;
}

export default function(json) {
  let h = json.finalHorizontal;
  let v = json.finalVertical;
  let center = json.center;
  return split(h, 0, h.length - 1, v, 0, v.length - 1, center);
}
