'use strict';

import lodash from 'lodash';
import sort from './sort';

function getOrigin(json) {
  let left = -1;
  let top = -1;
  let right = -1;
  let bottom = -1;
  let originHorizontal = [];
  let originVertical = [];
  json.forEach((item, i) => {
    if(i) {
      left = Math.min(left, item.xs);
      right = Math.max(right, item.xs + item.width);
      top = Math.min(top, item.ys);
      bottom = Math.max(bottom, item.ys + item.height);
    }
    else {
      left = item.xs;
      right = item.xs + item.width;
      top = item.ys;
      bottom = item.ys + item.height;
    }
    originHorizontal.push({
      x: [item.xs, item.xs + item.width],
      y: item.ys,
      st: true,
      i,
    });
    originHorizontal.push({
      x: [item.xs, item.xs + item.width],
      y: item.ys + item.height,
      st: false,
      i,
    });
    originVertical.push({
      x: item.xs,
      y: [item.ys, item.ys + item.height],
      st: true,
      i,
    });
    originVertical.push({
      x: item.xs + item.width,
      y: [item.ys, item.ys + item.height],
      st: false,
      i,
    });
  });
  sort(originHorizontal, (a, b)   => {
    if(a.y === b.y) {
      return a.x[0] > b.x[0];
    }
    return a.y > b.y;
  });
  sort(originVertical, (a, b) => {
    if(a.x === b.x) {
      return a.y[0] > b.y[0];
    }
    return a.x > b.x;
  });
  return {
    top,
    right,
    bottom,
    left,
    originHorizontal,
    originVertical,
  };
}

function getExtend(top, right, bottom, left, originHorizontal, originVertical) {
  let extendHorizontal = [];
  let extendVertical = [];
  let hash = new Map();
  originHorizontal.forEach(item => {
    let x0 = left;
    let x1 = right;
    if(item.x[0] > left) {
      for(let i = originVertical.length - 1; i >= 0; i--) {
        let l = originVertical[i];
        if(l.x < item.x[0]) {
          for(let j = i; j >= 0; j--) {
            let l = originVertical[j];
            x0 = l.x;
            if(isCross({ x: [x0, x1], y: item.y }, l)) {
              break;
            }
          }
          break;
        }
      }
    }
    if(item.x[1] < right) {
      for(let i = 0; i < originVertical.length; i++) {
        let l = originVertical[i];
        if(l.x > item.x[1]) {
          for(let j = i; j < originVertical.length; j++) {
            let l = originVertical[j];
            x1 = l.x;
            if(isCross({ x: [x0, x1], y: item.y }, l)) {
              break;
            }
          }
          break;
        }
      }
    }
    let key = x0 + ':' + x1 + '|' + item.y + '|' + item.st;
    if(hash.has(key)) {
      return;
    }
    hash.set(key, true);
    extendHorizontal.push({
      x: [x0, x1],
      y: item.y,
      st: item.st,
      i: item.i,
    });
  });
  hash = new Map();
  originVertical.forEach(item => {
    let y0 = top;
    let y1 = bottom;
    if(item.y[0] > top) {
      for(let i = originHorizontal.length - 1; i >= 0; i--) {
        let l = originHorizontal[i];
        if(l.y < item.y[0]) {
          for(let j = i; j >= 0; j--) {
            let l = originHorizontal[j];
            y0 = l.y;
            if(isCross(l, { x: item.x, y: [y0, y1] })) {
              break;
            }
          }
          break;
        }
      }
    }
    if(item.y[1] < bottom) {
      for(let i = 0; i < originHorizontal.length; i++) {
        let l = originHorizontal[i];
        if(l.y > item.y[1]) {
          for(let j = i; j < originHorizontal.length; j++) {
            let l = originHorizontal[j];
            y1 = l.y;
            if(isCross(l, { x: item.x, y: [y0, y1] })) {
              break;
            }
          }
          break;
        }
      }
    }
    let key = item.x + '|' + y0 + ':' + y1 + '|' + item.st;
    if(hash.has(key)) {
      return;
    }
    hash.set(key, true);
    extendVertical.push({
      x: item.x,
      y: [y0, y1],
      st: item.st,
      i: item.i,
    });
  });
  return {
    extendHorizontal,
    extendVertical,
  };
}

function getMerge(extendHorizontal, extendVertical) {
  let mergeHorizontal = [];
  let mergeVertical = [];
  let xHash = new Map();
  let yHash = new Map();
  for(let i = 0; i < extendHorizontal.length - 1; i++) {
    let a = extendHorizontal[i];
    let b = extendHorizontal[i + 1];
    a = lodash.cloneDeep(a);
    if(a.i !== b.i && a.st !== b.st && a.x[0] === b.x[0] && a.x[1] === b.x[1]) {
      i++;
      let y = (a.y + b.y) >> 1;
      let arr;
      if(xHash.has(a.y)) {
        arr = xHash.get(a.y);
      }
      else {
        arr = [];
        xHash.set(a.y, arr);
      }
      arr.push({
        y,
        x: a.x,
      });
      a.y = y;
      mergeHorizontal.push(a);
      let arr2;
      if(xHash.has(b.y)) {
        arr2 = xHash.get(b.y);
      }
      else {
        arr2 = [];
        xHash.set(b.y, arr2);
      }
      arr2.push({
        y,
        x: b.x,
      });
    }
    else {
      mergeHorizontal.push(a);
    }
  }
  mergeHorizontal.push(extendHorizontal[extendHorizontal.length - 1]);
  for(let i = 0; i < extendVertical.length - 1; i++) {
    let a = extendVertical[i];
    let b = extendVertical[i + 1];
    a = lodash.cloneDeep(a);
    if(a.i !== b.i && a.st !== b.st && a.y[0] === b.y[0] && a.y[1] === b.y[1]) {
      i++;
      let x = (a.x + b.x) >> 1;
      let arr;
      if(yHash.has(a.x)) {
        arr = yHash.get(a.x);
      }
      else {
        arr = [];
        yHash.set(a.x, arr);
      }
      arr.push({
        x,
        y: a.y,
      });
      a.x = x;
      mergeVertical.push(a);
      let arr2;
      if(yHash.has(b.x)) {
        arr2 = yHash.get(b.x);
      }
      else {
        arr2 = [];
        yHash.set(b.x, arr2);
      }
      arr2.push({
        x,
        y: a.y,
      });
    }
    else {
      mergeVertical.push(a);
    }
  }
  mergeVertical.push(extendVertical[extendVertical.length - 1]);
  mergeHorizontal.forEach(item => {
    if(yHash.has(item.x[0])) {
      let arr = yHash.get(item.x[0]);
      for(let i = 0; i < arr.length; i++) {
        let o = arr[i];
        if(item.y >= o.y[0] && item.y <= o.y[1]) {
          item.x[0] = o.x;
          break;
        }
      }
    }
    if(yHash.has(item.x[1])) {
      let arr = yHash.get(item.x[1]);
      for(let i = 0; i < arr.length; i++) {
        let o = arr[i];
        if(item.y >= o.y[0] && item.y <= o.y[1]) {
          item.x[1] = o.x;
          break;
        }
      }
    }
  });
  mergeVertical.forEach(item => {
    if(xHash.has(item.y[0])) {
      let arr = xHash.get(item.y[0]);
      for(let i = 0; i < arr.length; i++) {
        let o = arr[i];
        if(item.x >= o.x[0] && item.x <= o.x[1]) {
          item.y[0] = o.y;
          break;
        }
      }
    }
    if(xHash.has(item.y[1])) {
      let arr = xHash.get(item.y[1]);
      for(let i = 0; i < arr.length; i++) {
        let o = arr[i];
        if(item.x >= o.x[0] && item.x <= o.x[1]) {
          item.y[1] = o.y;
          break;
        }
      }
    }
  });
  let point = [];
  mergeHorizontal.forEach(h => {
    mergeVertical.forEach(v => {
      let p = getPoint(h, v);
      if(p) {
        point.push(p);
      }
    });
  });
  return {
    mergeHorizontal,
    mergeVertical,
    point,
  };
}

function getUnion(mergeHorizontal, mergeVertical, center, point) {
  let unionHorizontal = lodash.cloneDeep(mergeHorizontal);
  let unionVertical = lodash.cloneDeep(mergeVertical);
  // 按行分组点
  let hp = [];
  let temp = [];
  let last = null;
  point.forEach(p => {
    if(last === null) {
      temp = [p];
    }
    else if(p.y === last.y) {
      temp.push(p);
    }
    else {
      hp.push(temp);
      temp = [p];
    }
    last = p;
  });
  hp.push(temp);
  // 按列分组点
  let copy = lodash.cloneDeep(point);
  sort(point, (a, b) => {
    if(a.y === b.y) {
      return a.x > b.x;
    }
    return a.y > b.y;
  });
  let vp = [];
  last = null;
  copy.forEach(p => {
    if(last === null) {
      temp = [p];
    }
    else if(p.x === last.x) {
      temp.push(p);
    }
    else {
      vp.push(temp);
      temp = [p];
    }
    last = p;
  });
  vp.push(temp);
  // 按行尝试组成最小矩形
  let square = [];
  let hash = new Map();
  for(let i = 0; i < hp.length - 1; i++) {
    let arr1 = hp[i];
    outer:
    for(let j = 0; j < arr1.length - 1; j++) {
      let p1 = arr1[j];
      for(let k = j + 1; k < arr1.length; k++) {
        let p2 = arr1[k];
        for(let l = i + 1; l < hp.length; l++) {
          let arr2 = hp[l];
          for(let m = 0; m < arr2.length - 1; m++) {
            let p3 = arr2[m];
            if(p3.x < p1.x) {
              continue;
            }
            if(p3.x > p1.x) {
              break;
            }
            for(let n = m + 1; n < arr2.length; n++) {
              let p4 = arr2[n];
              if(p4.x < p2.x) {
                continue;
              }
              if(p4.x > p2.x) {
                break;
              }
              let key = p1.x + ':' + p1.y + '|' + p4.x + ':' + p4.y;
              if(!hash.has(key)) {
                hash.set(key, true);
                let s = {
                  x1: p1.x,
                  y1: p1.y,
                  x4: p4.x,
                  y4: p4.y,
                };
                if(isInLine(unionHorizontal, unionVertical, s)) {
                  square.push(s);
                  j = k - 1;
                  continue outer;
                }
              }
            }
          }
        }
      }
    }
  }
  // 按列尝试组成最小矩形
  for(let i = 0; i < vp.length - 1; i++) {
    let arr1 = vp[i];
    outer:
    for(let j = 0; j < arr1.length - 1; j++) {
      let p1 = arr1[j];
      for(let k = j + 1; k < arr1.length; k++) {
        let p3 = arr1[k];
        for(let l = i + 1; l < vp.length; l++) {
          let arr2 = vp[l];
          for(let m = 0; m < arr2.length - 1; m++) {
            let p2 = arr2[m];
            if(p2.y < p1.y) {
              continue;
            }
            if(p2.y > p1.y) {
              break;
            }
            for(let n = m + 1; n < arr2.length; n++) {
              let p4 = arr2[n];
              if(p4.y < p3.y) {
                continue;
              }
              if(p4.y > p3.y) {
                break;
              }
              let key = p1.x + ':' + p1.y + '|' + p4.x + ':' + p4.y;
              if(!hash.has(key)) {
                hash.set(key, true);
                let s = {
                  x1: p1.x,
                  y1: p1.y,
                  x4: p4.x,
                  y4: p4.y,
                };
                if(isInLine(unionHorizontal, unionVertical, s)) {
                  square.push(s);
                  j = k - 1;
                  continue outer;
                }
              }
            }
          }
        }
      }
    }
  }
  // 不停尝试合并直到无法再合并为止
  do {
    let fin = true;
    for(let i = 1; i < unionVertical.length - 1; i++) {
      let l = unionVertical[i];
      let pair = getPairSquare(square, l, false);
      if(!pair) {
        continue;
      }
      let a = square[pair[0]];
      let b = square[pair[1]];
      if(isEmpty(a.y1, a.x4, a.y4, a.x1, center) || isEmpty(b.y1, b.x4, b.y4, b.x1, center)) {
        a.x4 = b.x4;
        square.splice(pair[1], 1);
        unionVertical.splice(i--, 1);
        fin = false;
      }
    }
    for(let i = 1; i < unionHorizontal.length - 1; i++) {
      let l = unionHorizontal[i];
      let pair = getPairSquare(square, l, true);
      if(!pair) {
        continue;
      }
      let a = square[pair[0]];
      let b = square[pair[1]];
      if(isEmpty(a.y1, a.x4, a.y4, a.x1, center) || isEmpty(b.y1, b.x4, b.y4, b.x1, center)) {
        a.y4 = b.y4;
        square.splice(pair[1], 1);
        unionHorizontal.splice(i--, 1);
        fin = false;
      }
    }
    if(fin) {
      break;
    }
  }
  while(true);
  let unionPoint = [];
  unionHorizontal.forEach(h => {
    unionVertical.forEach(v => {
      let p = getPoint(h, v);
      if(p) {
        unionPoint.push(p);
      }
    });
  });
  return {
    unionHorizontal,
    unionVertical,
    unionPoint,
    square,
  };
}

function getFinal(unionHorizontal, unionVertical, center, square) {
  let finalHorizontal = lodash.cloneDeep(unionHorizontal);
  let finalVertical = lodash.cloneDeep(unionVertical);
  // 再次尝试合并，此次只考虑联合矩形
  do {
    let fin = true;
    for(let i = 1; i < finalVertical.length - 1; i++) {
      let l = finalVertical[i];
      let pair = getPairGroupSquare(square, l, false);
      if(!pair) {
        continue;
      }
      let a = pair[0].map((item, i) => {
        if(i) {
          square[item].ignore = true;
        }
        return square[item];
      });
      let b = pair[1].map((item, i) => {
        if(i) {
          square[item].ignore = true;
        }
        return square[item];
      });
      if(isEmpty(a[0].y1, a[0].x4, a[a.length - 1].y4, a[0].x1, center)
        || isEmpty(b[0].y1, b[0].x4, b[b.length - 1].y4, b[0].x1, center)) {
        a.forEach((item, i) => {
          item.x4 = b[i].x4;
          item.y4 = a[a.length - 1].y4;
        });
        square = square.filter(item => !item.ignore);
        finalVertical.splice(i--, 1);
        fin = false;
      }
    }
    for(let i = 1; i < finalHorizontal.length - 1; i++) {
      let l = finalHorizontal[i];
      let pair = getPairGroupSquare(square, l, true);
      if(!pair) {
        continue;
      }
      let a = pair[0].map((item, i) => {
        if(i) {
          square[item].ignore = true;
        }
        return square[item];
      });
      let b = pair[1].map((item, i) => {
        if(i) {
          square[item].ignore = true;
        }
        return square[item];
      });
      if(isEmpty(a[0].y1, a[a.length - 1].x4, a[0].y4, a[0].x1, center)
        || isEmpty(b[0].y1, b[b.length - 1].x4, b[0].y4, b[0].x1, center)) {
        a.forEach((item, i) => {
          item.y4 = b[i].y4;
          item.x4 = a[a.length - 1].x4;
        });
        square = square.filter(item => !item.ignore);
        finalHorizontal.splice(i--, 1);
        fin = false;
      }
    }
    if(fin) {
      break;
    }
  }
  while(true);
  return {
    finalHorizontal,
    finalVertical,
  };
}

function isCross(h, v) {
  if(h.y < v.y[0] || h.y > v.y[1]) {
    return false;
  }
  if(v.x < h.x[0] || v.x > h.x[1]) {
    return false;
  }
  if(h.y === v.y[0] || h.y === v.y[1]) {
    return h.x[0] !== v.x && h.x[1] !== v.x;
  }
  if(v.x === h.x[0] || v.x === h.x[1]) {
    return v.y[0] !== h.y && v.y[1] !== h.y;
  }
  return true;
}

function getPoint(h, v) {
  if((h.y === v.y[0] || h.y === v.y[1]) && (v.x === h.x[0] || v.x === h.x[1])) {
    return {
      x: v.x,
      y: h.y,
    };
  }
  else if(h.y >= v.y[0] && h.y <= v.y[1] && v.x >= h.x[0] && v.x <= h.x[1]) {
    return {
      x: v.x,
      y: h.y,
    };
  }
  return null;
}

function isInLine(h, v, square) {
  let top = false;
  let right = false;
  let bottom = false;
  let left = false;
  outer:
  for(let i = 0; i < h.length; i++) {
    let item = h[i];
    if(square.y1 === item.y && square.x1 >= item.x[0] && square.x4 <= item.x[1]) {
      top = true;
      for(let j = i + 1; j < h.length; j++) {
        let item = h[j];
        if(square.y4 === item.y && square.x1 >= item.x[0] && square.x4 <= item.x[1]) {
          bottom = true;
          break outer;
        }
      }
      break;
    }
  }
  if(!top || !bottom) {
    return false;
  }
  outer:
  for(let i = 0; i < v.length; i++) {
    let item = v[i];
    if(square.x1 === item.x && square.y1 >= item.y[0] && square.y4 <= item.y[1]) {
      left = true;
      for(let j = i + 1; j < v.length; j++) {
        let item = v[j];
        if(square.x4 === item.x && square.y1 >= item.y[0] && square.y4 <= item.y[1]) {
          right = true;
          break outer;
        }
      }
      break;
    }
  }
  return right && left;
}

function isEmpty(top, right, bottom, left, center) {
  for(let i = 0; i < center.length; i++) {
    let item = center[i];
    if(item.x >= left && item.x <= right && item.y >= top && item.y <= bottom) {
      return false;
    }
  }
  return true;
}

function getPairSquare(square, l, hOrV) {
  if(hOrV) {
    for(let i = 0; i < square.length; i++) {
      let a = square[i];
      if(a.y4 === l.y && a.x1 === l.x[0] && a.x4 === l.x[1]) {
        for(let j = 0; j < square.length && j !== i; j++) {
          let b = square[i];
          if(b.y1 === l.y && b.x1 === l.x[0] && b.x4 === l.x[1]) {
            return [i, j];
          }
        }
      }
    }
  }
  else {
    for(let i = 0; i < square.length; i++) {
      let a = square[i];
      if(a.x4 === l.x && a.y1 === l.y[0] && a.y4 === l.y[1]) {
        for(let j = 0; j < square.length; j++) {
          if(j === i) {
            continue;
          }
          let b = square[j];
          if(b.x1 === l.x && b.y1 === l.y[0] && b.y4 === l.y[1]) {
            return [i, j];
          }
        }
      }
    }
  }
  return null;
}

function getPairGroupSquare(square, l, hOrV) {
  let a = [];
  let b = [];
  let as = [];
  let bs = [];
  if(hOrV) {
    for(let i = 0; i < square.length; i++) {
      let item = square[i];
      if(item.y4 === l.y && item.x1 >= l.x[0] && item.x4 <= l.x[1]) {
        a.push(i);
        as.push(item);
      }
      else if(item.y1 === l.y && item.x1 >= l.x[0] && item.x4 <= l.x[1]) {
        b.push(i);
        bs.push(item);
      }
    }
    if(as.length && bs.length) {
      for(let i = 1; i < as.length; i++) {
        if(as[i].y1 !== as[0].y1) {
          return null;
        }
      }
      for(let i = 1; i < bs.length; i++) {
        if(bs[i].y4 !== bs[0].y4) {
          return null;
        }
      }
      return [a, b];
    }
  }
  else {
    for(let i = 0; i < square.length; i++) {
      let item = square[i];
      if(item.x4 === l.x && item.y1 >= l.y[0] && item.y4 <= l.y[1]) {
        a.push(i);
        as.push(item);
      }
      else if(item.x1 === l.x && item.y1 >= l.y[0] && item.y4 <= l.y[1]) {
        b.push(i);
        bs.push(item);
      }
    }
    if(as.length && bs.length) {
      for(let i = 1; i < as.length; i++) {
        if(as[i].x1 !== as[0].x1) {
          return null;
        }
      }
      for(let i = 1; i < bs.length; i++) {
        if(bs[i].x4 !== bs[0].x4) {
          return null;
        }
      }
      return [a, b];
    }
  }
  return null;
}

export default function(json) {
  json = json.filter(item => !item.isBackground);
  let { top, right, bottom, left, originHorizontal, originVertical } = getOrigin(json);
  let { extendHorizontal, extendVertical } = getExtend(top, right, bottom, left, originHorizontal, originVertical);
  let { mergeHorizontal, mergeVertical, point } = getMerge(extendHorizontal, extendVertical);
  let center = [];
  json.forEach(item => {
    center.push({
      x: item.xs + (item.width >> 1),
      y: item.ys + (item.height >> 1),
      id: item.id,
    });
  });
  let { unionHorizontal, unionVertical, unionPoint, square } = getUnion(mergeHorizontal, mergeVertical, center, point);
  let { finalHorizontal, finalVertical } = getFinal(unionHorizontal, unionVertical, center, square);
  return {
    originHorizontal,
    originVertical,
    extendHorizontal,
    extendVertical,
    mergeHorizontal,
    mergeVertical,
    center,
    unionHorizontal,
    unionVertical,
    point,
    unionPoint,
    finalHorizontal,
    finalVertical,
  };
}
