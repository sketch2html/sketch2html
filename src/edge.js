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

// 将所有边线延长，直至边界或者与其它线相交
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

// 两条平行线长度相等，且中间没有元素，可合并
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
      let y = (a.y + b.y) * 0.5;
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
      let x = (a.x + b.x) * 0.5;
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

// 以一条线为交界，相邻的两个单一矩形，如果有一个为空，则可以合并
function getUnion(mergeHorizontal, mergeVertical, json, point) {
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
      if(isEmpty(a.y1, a.x4, a.y4, a.x1, json) || isEmpty(b.y1, b.x4, b.y4, b.x1, json)) {
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
      if(isEmpty(a.y1, a.x4, a.y4, a.x1, json) || isEmpty(b.y1, b.x4, b.y4, b.x1, json)) {
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

// 以一条线为交界，相邻的两个联合矩形，如果有一个为空，则可以合并
function getUnBlank(unionHorizontal, unionVertical, json, square) {
  let blankHorizontal = lodash.cloneDeep(unionHorizontal);
  let blankVertical = lodash.cloneDeep(unionVertical);
  let blankSquare = lodash.cloneDeep(square);
  // 再次尝试合并，此次只考虑联合矩形
  do {
    let fin = true;
    for(let i = 1; i < blankVertical.length - 1; i++) {
      let l = blankVertical[i];
      let pair = getPairGroupSquare(blankSquare, l, false);
      if(!pair) {
        continue;
      }
      let [a, b] = pair;
      let ea = isEmpty(a[0].y1, a[0].x4, a[a.length - 1].y4, a[0].x1, json);
      let eb = isEmpty(b[0].y1, b[0].x4, b[b.length - 1].y4, b[0].x1, json);
      if(ea || eb) {
        // 记录下这条线与其它线的交点
        let cPoint = [];
        let pointHash = new Map();
        for(let j = 0; j < blankHorizontal.length; j++) {
          let h = blankHorizontal[j];
          if(isCross(h, l)) {
            cPoint.push({
              x: l.x,
              y: h.y,
            });
            let key = l.x + ',' + h.y;
            pointHash.set(key, cPoint.length - 1);
          }
        }
        // 检测横线有没有和被删掉的竖线相交的，将其左右缩短
        for(let j = 1; j < blankHorizontal.length - 1; j++) {
          let l2 = blankHorizontal[j];
          if(l2.x[0] === l.x) {
            for(let k = i + 1; k < blankVertical.length - 1; k++) {
              let l3 = blankVertical[k];
              if(l3.x > l.x && isCross(l2, l3)) {
                // 同时尝试将缩掉的这一段线作为相邻边界，合并上下完全相邻的矩形
                unionSquarePair(blankSquare, { x: [l2.x[0], l3.x], y: l2.y }, false);
                l2.x[0] = l3.x;
                // 缩掉的线同时忽略本来相交的点
                let key = l.x + ',' + l2.y;
                if(pointHash.has(key)) {
                  cPoint[pointHash.get(key)].ignore = true;
                }
                break;
              }
            }
          }
          else if(l2.x[1] === l.x) {
            for(let k = i - 1; k > 0; k--) {
              let l3 = blankVertical[k];
              if(l3.x < l.x && isCross(l2, l3)) {
                // 同时尝试将缩掉的这一段线作为相邻边界，合并上下完全相邻的矩形
                unionSquarePair(blankSquare, { x: [l3.x, l2.x[1]], y: l2.y }, false);
                l2.x[1] = l3.x;
                let key = l.x + ',' + l2.y;
                if(pointHash.has(key)) {
                  cPoint[pointHash.get(key)].ignore = true;
                }
                break;
              }
            }
          }
        }
        cPoint = cPoint.filter(item => !item.ignore);
        // 以缩掉的线被还在的点分割的线段为边界，合并完全相邻的矩形
        for(let j = 0; j < cPoint.length - 1; j++) {
          let l2 = {
            x: l.x,
            y: [cPoint[j].y, cPoint[j + 1].y],
          };
          unionSquarePair(blankSquare, l2, true);
        }
        blankVertical.splice(i--, 1);
        fin = false;
      }
    }
    for(let i = 1; i < blankHorizontal.length - 1; i++) {
      let l = blankHorizontal[i];
      let pair = getPairGroupSquare(blankSquare, l, true);
      if(!pair) {
        continue;
      }
      let [a, b] = pair;
      let ea = isEmpty(a[0].y1, a[a.length - 1].x4, a[0].y4, a[0].x1, json);
      let eb = isEmpty(b[0].y1, b[b.length - 1].x4, b[0].y4, b[0].x1, json);
      if(ea || eb) {
        // 记录下这条线与其它线的交点
        let cPoint = [];
        let pointHash = new Map();
        for(let j = 0; j < blankVertical.length; j++) {
          let v = blankVertical[j];
          if(isCross(l, v)) {
            cPoint.push({
              x: v.x,
              y: l.y,
            });
            let key = v.x + ',' + l.y;
            pointHash.set(key, cPoint.length - 1);
          }
        }
        // 检测竖线有没有和被删掉的横线相交的，将其上下缩短
        for(let j = 1; j < blankVertical.length - 1; j++) {
          let l2 = blankVertical[j];
          if(l2.y[0] === l.y) {
            for(let k = i + 1; k < blankHorizontal.length - 1; k++) {
              let l3 = blankHorizontal[k];
              if(l3.y > l.y && isCross(l3, l2)) {
                // 同时尝试将缩掉的这一段线作为相邻边界，合并左右完全相邻的矩形
                unionSquarePair(blankSquare, { x: l2.x, y: [l2.y[0], l3.y] }, true);
                l2.y[0] = l3.y;
                // 缩掉的线同时忽略本来相交的点
                let key = l2.x + ',' + l.y;
                if(pointHash.has(key)) {
                  cPoint[pointHash.get(key)].ignore = true;
                }
                break;
              }
            }
          }
          else if(l2.y[1] === l.y) {
            for(let k = i - 1; k > 0; k--) {
              let l3 = blankHorizontal[k];
              if(l3.y < l.y && isCross(l3, l2)) {
                // 同时尝试将缩掉的这一段线作为相邻边界，合并左右完全相邻的矩形
                unionSquarePair(blankSquare, { x: l2.x, y: [l3.y, l2.y[1]] }, true);
                l2.y[1] = l3.y;
                let key = l2.x + ',' + l.y;
                if(pointHash.has(key)) {
                  cPoint[pointHash.get(key)].ignore = true;
                }
                break;
              }
            }
          }
        }
        cPoint = cPoint.filter(item => !item.ignore);
        // 以缩掉的线被还在的点分割的线段为边界，合并完全相邻的矩形
        for(let j = 0; j < cPoint.length - 1; j++) {
          let l2 = {
            x: [cPoint[j].x, cPoint[j + 1].x],
            y: l.y,
          };
          unionSquarePair(blankSquare, l2, false);
        }
        blankHorizontal.splice(i--, 1);
        fin = false;
      }
    }
    if(fin) {
      break;
    }
  }
  while(true);
  return {
    blankHorizontal,
    blankVertical,
    blankSquare,
  };
}

// 以一条线为交界，相邻的一个联合矩形，如果为空，则可以合并
// 与blank不同的是只需一边即可，而blank需要两边的联合矩形
function getFinal(blankHorizontal, blankVertical, json, blankSquare) {
  let finalHorizontal = lodash.cloneDeep(blankHorizontal);
  let finalVertical = lodash.cloneDeep(blankVertical);
  let finalSquare = lodash.cloneDeep(blankSquare);
  do {
    let fin = true;
    for(let i = 1; i < finalVertical.length - 1; i++) {
      let l = finalVertical[i];
      let group = getGroupSquare(finalSquare, l, false);
      if(!group) {
        continue;
      }
      let [a, b] = group;
      if(a.length && isEmpty(a[0].y1, a[0].x4, a[a.length - 1].y4, a[0].x1, json)) {
        for(let j = 0; j < a.length; j++) {
          let item = a[j];
          item.ignore = true;
          let p = getPair(item, finalSquare, false, true);
          p.x1 = Math.min(p.x1, item.x1);
          p.x4 = Math.max(p.x4, item.x4);
        }
        finalVertical.splice(i--, 1);
        finalSquare = finalSquare.filter(item => !item.ignore);
        fin = false;
      }
      else if(b.length && isEmpty(b[0].y1, b[0].x4, b[b.length - 1].y4, b[0].x1, json)) {
        for(let j = 0; j < b.length; j++) {
          let item = b[j];
          item.ignore = true;
          let p = getPair(item, finalSquare, false, false);
          p.x1 = Math.min(p.x1, item.x1);
          p.x4 = Math.max(p.x4, item.x4);
        }
        finalVertical.splice(i--, 1);
        finalSquare = finalSquare.filter(item => !item.ignore);
        fin = false;
      }
    }
    for(let i = 1; i < finalHorizontal.length - 1; i++) {
      let l = finalHorizontal[i];
      let group = getGroupSquare(finalSquare, l, true);
      if(!group) {
        continue;
      }
      let [a, b] = group;
      if(a.length && isEmpty(a[0].y1, a[a.length - 1].x4, a[0].y4, a[0].x1, json)) {
        for(let j = 0; j < a.length; j++) {
          let item = a[j];
          item.ignore = true;
          let p = getPair(item, finalSquare, true, true);
          p.y1 = Math.min(p.y1, item.y1);
          p.y4 = Math.max(p.y4, item.y4);
        }
        finalHorizontal.splice(i--, 1);
        finalSquare = finalSquare.filter(item => !item.ignore);
        fin = false;
      }
      else if(b.length && isEmpty(b[0].y1, b[b.length - 1].x4, b[0].y4, b[0].x1, json)) {
        for(let j = 0; j < b.length; j++) {
          let item = b[j];
          item.ignore = true;
          let p = getPair(item, finalSquare, true, false);
          p.y1 = Math.min(p.y1, item.y1);
          p.y4 = Math.max(p.y4, item.y4);
        }
        finalHorizontal.splice(i--, 1);
        finalSquare = finalSquare.filter(item => !item.ignore);
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
    finalSquare,
  };
}

// 相交或者一边顶到另一条边的中间才算，两条顶点相交不算
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

function isEmpty(top, right, bottom, left, json) {
  for(let i = 0; i < json.length; i++) {
    let item = json[i];
    if(item.xc >= left && item.xc <= right && item.yc >= top && item.yc <= bottom) {
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
        for(let j = 0; j < square.length; j++) {
          if(j === i) {
            continue;
          }
          let b = square[j];
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
  if(hOrV) {
    for(let i = 0; i < square.length; i++) {
      let item = square[i];
      if(item.y4 === l.y && item.x1 >= l.x[0] && item.x4 <= l.x[1]) {
        a.push(item);
      }
      else if(item.y1 === l.y && item.x1 >= l.x[0] && item.x4 <= l.x[1]) {
        b.push(item);
      }
    }
    if(a.length && b.length) {
      for(let i = 1; i < a.length; i++) {
        if(a[i].y1 !== a[0].y1) {
          return null;
        }
      }
      for(let i = 1; i < b.length; i++) {
        if(b[i].y4 !== b[0].y4) {
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
        a.push(item);
      }
      else if(item.x1 === l.x && item.y1 >= l.y[0] && item.y4 <= l.y[1]) {
        b.push(item);
      }
    }
    if(a.length && b.length) {
      for(let i = 1; i < a.length; i++) {
        if(a[i].x1 !== a[0].x1) {
          return null;
        }
      }
      for(let i = 1; i < b.length; i++) {
        if(b[i].x4 !== b[0].x4) {
          return null;
        }
      }
      return [a, b];
    }
  }
  return null;
}

function getGroupSquare(square, l, hOrV) {
  let a = [];
  let b = [];
  if(hOrV) {
    for(let i = 0; i < square.length; i++) {
      let item = square[i];
      if(item.y4 === l.y && item.x1 >= l.x[0] && item.x4 <= l.x[1]) {
        a.push(item);
      }
      else if(item.y1 === l.y && item.x1 >= l.x[0] && item.x4 <= l.x[1]) {
        b.push(item);
      }
    }
    if(a.length) {
      for(let i = 1; i < a.length; i++) {
        if(a[i].y1 !== a[0].y1) {
          a = [];
          break;
        }
      }
    }
    if(b.length) {
      for(let i = 1; i < b.length; i++) {
        if(b[i].y4 !== b[0].y4) {
          b = [];
          break;
        }
      }
    }
    if(a.length || b.length) {
      return [a, b];
    }
  }
  else {
    for(let i = 0; i < square.length; i++) {
      let item = square[i];
      if(item.x4 === l.x && item.y1 >= l.y[0] && item.y4 <= l.y[1]) {
        a.push(item);
      }
      else if(item.x1 === l.x && item.y1 >= l.y[0] && item.y4 <= l.y[1]) {
        b.push(item);
      }
    }
    if(a.length) {
      for(let i = 1; i < a.length; i++) {
        if(a[i].x1 !== a[0].x1) {
          a = [];
          break;
        }
      }
    }
    if(b.length) {
      for(let i = 1; i < b.length; i++) {
        if(b[i].x4 !== b[0].x4) {
          b = [];
          break;
        }
      }
    }
    if(a.length || b.length) {
      return [a, b];
    }
  }
  return null;
}

function unionSquarePair(square, l, hOrV) {
  if(hOrV) {
    for(let i = 0; i < square.length; i++) {
      let a = square[i];
      for(let j = 0; j < square.length; j++) {
        if(j === i) {
          continue;
        }
        let b = square[j];
        if(a.x4 === l.x
          && a.y1 === l.y[0]
          && a.y4 === l.y[1]
          && b.x1 === l.x
          && b.y1 === l.y[0]
          && b.y4 === l.y[1]) {
          a.x4 = b.x4;
          square.splice(j, 1);
          return;
        }
      }
    }
  }
  else {
    for(let i = 0; i < square.length; i++) {
      let a = square[i];
      for(let j = 0; j < square.length; j++) {
        if(j === i) {
          continue;
        }
        let b = square[j];
        if(a.y4 === l.y
          && a.x1 === l.x[0]
          && a.x4 === l.x[1]
          && b.y1 === l.y
          && b.x1 === l.x[0]
          && b.x4 === l.x[1]) {
          a.y4 = b.y4;
          square.splice(j, 1);
          return;
        }
      }
    }
  }
}

function getPair(item, square, hOrV, direction) {
  if(hOrV) {
    for(let i = 0; i < square.length; i++) {
      let o = square[i];
      if(o !== item && o.x1 === item.x1 && o.x4 === item.x4) {
        if(direction) {
          if(o.y1 === item.y4) {
            return o;
          }
        }
        else {
          if(o.y4 === item.y1) {
            return o;
          }
        }
      }
    }
  }
  else {
    for(let i = 0; i < square.length; i++) {
      let o = square[i];
      if(o !== item && o.y1 === item.y1 && o.y4 === item.y4) {
        if(direction) {
          if(o.x1 === item.x4) {
            return o;
          }
        }
        else {
          if(o.x4 === item.x1) {
            return o;
          }
        }
      }
    }
  }
  return null;
}

export default function(json) {
  let { list } = json;
  let available = list.filter(item => !item.isBackground);
  let { top, right, bottom, left, originHorizontal, originVertical } = getOrigin(available);
  let { extendHorizontal, extendVertical } = getExtend(top, right, bottom, left, originHorizontal, originVertical);
  let { mergeHorizontal, mergeVertical, point } = getMerge(extendHorizontal, extendVertical);
  let { unionHorizontal, unionVertical, unionPoint, square } = getUnion(mergeHorizontal, mergeVertical, available, point);
  let { blankHorizontal, blankVertical, blankSquare } = getUnBlank(unionHorizontal, unionVertical, available, square);
  let { finalHorizontal, finalVertical, finalSquare } = getFinal(blankHorizontal, blankVertical, available, blankSquare);
  return {
    originHorizontal,
    originVertical,
    extendHorizontal,
    extendVertical,
    mergeHorizontal,
    mergeVertical,
    point,
    unionHorizontal,
    unionVertical,
    unionPoint,
    square,
    blankHorizontal,
    blankVertical,
    blankSquare,
    finalHorizontal,
    finalVertical,
    finalSquare,
    available,
    top: json.top,
    list,
  };
}
