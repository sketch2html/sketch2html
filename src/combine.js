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
    if(item.x[1] <= v[startV].x || item.x[0] >= v[endV].x) {
      item.ignore = true;
    }
    else {
      item.x[0] = Math.max(item.x[0], v[startV].x);
      item.x[1] = Math.min(item.x[1], v[endV].x);
    }
  });
  v.forEach(item => {
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
    sv.push(i);
  }
  let res = {
    list: [],
  };
  if(sh.length && sv.length) {
    // 先尝试水平线等同矩形宽的可以无冲突切割
    let last = startH;
    for(let i = 0; i < sh.length; i++) {
      let a = h[sh[i]];
      if(a.x[0] === v[startV].x && a.x[1] === v[endV].x) {
        res.direction = true;
        // let temp = { list: [] };
        let temp = split(h, last, sh[i], v, startV, endV, center);
        // res.list.push(Array.isArray(temp.list) ? temp : temp.list);
        res.list.push(temp);
        last = sh[i];
      }
    }
    if(res.direction === true) {
      // let temp = { list: [] };
      let temp = split(h, last, endH, v, startV, endV, center);
      res.list.push(temp);
    }
    if(res.direction === true) {
      return;
    }
    // 水平线不存在则尝试垂直线等同矩形高的
    last = startV;
    for(let i = 0; i < sv.length; i++) {
      let a = v[sv[i]];
      if(a.y[0] === h[startH].y && a.y[1] === h[endH].y) {
        res.direction = false;
        let temp = split(h, startH, endH, v, last, sv[i], center);
        res.list.push(temp);
        last = sv[i];
      }
    }
    if(res.direction === false) {
      let temp = split(h, startH, endH, v, last, endV, center);
      res.list.push(temp);
    }
    // 都没有的话，理论上不存在这种可能
  }
  else if(sh.length) {
    res.direction = true;
    let last = startH;
    for(let i = 0; i < sh.length; i++) {
      let a = h[sh[i]];
      if(a.x[0] === v[startV].x && a.x[1] === v[endV].x) {
        res.direction = true;
        let temp = split(h, last, sh[i], v, startV, endV, center);
        res.list.push(temp);
        last = sh[i];
      }
    }
    let temp = split(h, last, endH, v, startV, endV, center);
    res.list.push(temp);
  }
  else if(sv.length) {
    res.direction = false;
    let last = startV;
    for(let i = 0; i < sv.length; i++) {
      let a = v[sv[i]];
      if(a.y[0] === h[startH].y && a.y[1] === h[endH].y) {
        res.direction = false;
        let temp = split(h, startH, endH, v, last, sv[i], center);
        res.list.push(temp);
        last = sv[i];
      }
    }
    let temp = split(h, startH, endH, v, last, endV, center);
    res.list.push(temp);
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
          return c.id;
        }
      }
      return null;
    }
    // 此时仅有交叉线，依次选取递归进行
    else {
      res.parataxis = true;
      for(let i = startH + 1; i < endH; i++) {
        let a = h[i];
        if(a.x[0] === v[startV].x && a.x[1] === v[endV].x) {
          let p = { direction: true, list: [] };
          let temp = split(h, startH, i, v, startV, endV, center);
          p.list.push(temp);
          temp = split(h, i, endH, v, startV, endV, center);
          p.list.push(temp);
          res.list.push(p);
        }
      }
      for(let i = startV + 1; i < endV; i++) {
        let a = v[i];
        if(a.y[0] === h[startH].y && a.y[1] === h[endH].y) {
          let p = { direction: false, list: [] };
          let temp = split(h, startH, endH, v, startV, i, center);
          p.list.push(temp);
          temp = split(h, startH, endH, v, i, endV, center);
          p.list.push(temp);
          res.list.push(p);
        }
      }
    }
  }
  return res;
}

function scan(res, total) {
  if(res.parataxis) {
    return res.list.map(item => {
      return scan(item, total);
    });
  }
  else {
    for(let i = 0; i < res.list.length; i++) {
      let item = res.list[i];
      if(item !== null && typeof item !== 'string' && item.parataxis) {
        return scan(item, total);
      }
    }
    return total.n++;
  }
}

function indexing(index, hyperIndex, temp) {
  if(Array.isArray(index)) {
    index.forEach((item, i) => {
      temp.push(i);
      indexing(item, hyperIndex, temp);
      temp.pop();
    });
  }
  else {
    hyperIndex.push(lodash.cloneDeep(temp));
  }
}

function spread(res, arr) {
  if(res === null || typeof res === 'string') {
    return res;
  }
  else if(res.parataxis) {
    let i = arr.shift();
    let temp = spread(res.list[i], arr);
    temp.parataxis = true;
    return temp;
  }
  else {
    return {
      direction: res.direction,
      list: res.list.map(item => {
        return spread(item, arr);
      }),
    };
  }
}

export default function(json) {
  let h = json.finalHorizontal;
  let v = json.finalVertical;
  let center = json.center;
  let res = split(h, 0, h.length - 1, v, 0, v.length - 1, center);
  let index = scan(res, { n: 0 });
  let hyperIndex = [];
  indexing(index, hyperIndex, []);
  let list = hyperIndex.map(item => {
    return spread(res, lodash.clone(item));
  });
  return {
    center,
    list,
  };
}
