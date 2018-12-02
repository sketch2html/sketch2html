'use strict';

import modelBasic from './ml/basic';
import modelRow from './ml/row';
import modelCol from './ml/col';
import modelJunior from './ml/junior';
import flag from './flag';
import sort from './sort';

function getInSquare(top, right, bottom, left, list) {
  for(let i = 0; i < list.length; i++) {
    let item = list[i];
    if(!item.isBackground && item.xc >= left && item.xc <= right && item.yc >= top && item.yc <= bottom) {
      return item;
    }
  }
  return null;
}

// 完全相交才算，顶点碰触不算
function isCross(h, v) {
  if(h.y <= v.y[0] || h.y >= v.y[1]) {
    return false;
  }
  if(v.x <= h.x[0] || v.x >= h.x[1]) {
    return false;
  }
  return true;
}

// 根据横线裁剪获得横线内的竖线
function getVerticalByHorizontal(h, v) {
  let x0 = h[0].x[0];
  let x1 = h[0].x[1];
  let y0 = h[0].y;
  let y1 = h[h.length - 1].y;
  let res = [];
  v.forEach(item => {
    if(item.x >= x0 && item.x <= x1) {
      if(item.y[0] >= y0 && item.y[0] < y1 || item.y[1] <= y1 && item.y[1] > y0 || item.y[0] < y0 && item.y[1] > y1) {
        res.push({
          x: item.x,
          y: [Math.max(item.y[0], y0), Math.min(item.y[1], y1)],
        });
      }
    }
  });
  return res;
}

function getHorizontalByVertical(h, v) {}

function recursion(json) {
  let { finalHorizontal, finalVertical } = json;
  let rowNum = finalHorizontal.length - 1;
  let colNum = finalVertical.length - 1;
  // 单格、单行列及多行区分处理
  if(rowNum === 1 && colNum === 1) {
    return single(json);
  }
  else if(rowNum === 1) {
    return row(json);
  }
  else if(colNum === 1) {
    return col(json);
  }
  return multi(json);
}

function single(json) {
  let { list, finalHorizontal, finalVertical } = json;
  let o = getInSquare(finalHorizontal[0].y, finalVertical[1].x, finalHorizontal[1].y, finalVertical[0].x, list);
  return Object.assign({ flag: flag.ELEMENT }, o);
}

function row() {}

function col(json) {
  let { list, finalHorizontal, finalVertical } = json;
  let square = [];
  let left = finalVertical[0];
  let right = finalVertical[1];
  for(let i = 1; i < finalHorizontal.length; i++) {
    let top = finalHorizontal[i - 1];
    let bottom = finalHorizontal[i];
    let o = getInSquare(top.y, right.x, bottom.y, left.x, list);
    square.push(o);
  }
  let data = transform(square);
  let res = modelBasic(data, 1);
  if(res.forecast >= 0.5) {}
  return {
    flag: flag.GROUP,
    direction: 0,
    children: square.map(item => {
      return Object.assign({ flag: flag.ELEMENT }, item);
    }),
  };
}

function multi(json) {
  let { list, finalHorizontal, finalVertical } = json;
  let rowNum = finalHorizontal.length - 1;
  let colNum = finalVertical.length - 1;
  // 找出可能独立的区域，即横竖线撑满的
  let absH = [];
  let absV = [];
  let first = finalHorizontal[0];
  outer:
  for(let i = 1; i < rowNum; i++) {
    let item = finalHorizontal[i];
    if(item.x[0] === first.x[0] && item.x[1] === first.x[1]) {
      for(let j = 1; j < colNum; j++) {
        if(isCross(item, finalVertical[j])) {
          continue outer;
        }
      }
      absH.push(i);
    }
  }
  first = finalVertical[0];
  outer:
  for(let i = 1; i < colNum; i++) {
    let item = finalVertical[i];
    if(item.y[0] === first.y[0] && item.y[1] === first.y[1]) {
      for(let j = 1; j < rowNum; j++) {
        if(isCross(finalHorizontal[j], item)) {
          continue outer;
        }
      }
      absV.push(i);
    }
  }
  // 横线独立，可分割为多块
  if(absH.length) {
    let index = [];
    let last = 0;
    for(let i = 0; i < absH.length; i++) {
      let item = absH[i];
      index.push([last, item]);
      last = item;
    }
    index.push([last, rowNum]);
    // 分别组装独立的分割区域的横竖线，并递归分析
    let children = index.map(item => {
      let h = [];
      for(let i = item[0]; i <= item[1]; i++) {
        h.push(finalHorizontal[i]);
      }
      let v = getVerticalByHorizontal(h, finalVertical);
      return recursion({
        list,
        finalHorizontal: h,
        finalVertical: v,
      });
    });
    return {
      flag: flag.GROUP,
      direction: 0,
      children,
    };
  }
  if(absV.length) {}
  // 没有独立区域时，获取所有竖线端点坐标，判断竖线是否等长，不等长说明可用横线分割
  let vs = [];
  let vMap = new Map();
  for(let i = 0; i < colNum; i++) {
    let item = finalVertical[i];
    if(!vMap.has(item.y[0])) {
      vMap.set(item.y[0], true);
      vs.push(item.y[0]);
    }
    if(!vMap.has(item.y[1])) {
      vMap.set(item.y[1], true);
      vs.push(item.y[1]);
    }
  }
  // 超过2个端点说明不等长
  if(vs.length > 2) {
    // 获取所有端点上的横线，且过滤掉不是满长的横线的端点
    let hMap = new Map();
    first = finalHorizontal[0];
    finalHorizontal.forEach((item, i) => {
      if(item.x[0] === first.x[0] && item.x[1] === first.x[1]) {
        hMap.set(item.y, i);
      }
    });
    vs = vs.filter(item => {
      return hMap.has(item);
    });
    sort(vs, (a, b) => {
      return a > b;
    });
    let hs = [];
    vs.forEach(item => {
      hs.push(hMap.get(item));
    });
    // 按满长横线划分独立区域
    let index = [];
    for(let i = 1; i < hs.length; i++) {
      index.push([hs[i - 1], hs[i]]);
    }
    let children = index.map(item => {
      let h = [];
      for(let i = item[0]; i <= item[1]; i++) {
        h.push(finalHorizontal[i]);
      }
      let v = getVerticalByHorizontal(h, finalVertical);
      return recursion({
        list,
        finalHorizontal: h,
        finalVertical: v,
      });
    });
    // 获取端点上的横线
    return {
      flag: flag.GROUP,
      direction: 0,
      children,
    };
  }
  // 获取所有横线端点坐标，判断横线是否等长，不等长说明可用竖线分割
  let hs = [];
  let hMap = new Map();
  for(let i = 0; i < rowNum; i++) {
    let item = finalHorizontal[i];
    if(!hMap.has(item.x[0])) {
      hMap.set(item.x[0], true);
      hs.push(item.x[0]);
    }
    if(!hMap.has(item.x[1])) {
      hMap.set(item.x[1], true);
      hs.push(item.x[1]);
    }
  }
  // 超过2个端点说明不等长
  if(hs.length > 2) {}
  // 前置均没有说明此时是均匀矩阵多格
  return grid(json, rowNum, colNum);
}

function grid(json, rowNum, colNum) {
  let { list, finalHorizontal, finalVertical } = json;
  // 行列顺序组成数组
  let square = [];
  for(let i = 1; i <= rowNum; i++) {
    let top = finalHorizontal[i - 1];
    let bottom = finalHorizontal[i];
    for(let j = 1; j <= colNum; j++) {
      let left = finalVertical[j - 1];
      let right = finalVertical[j];
      let o = getInSquare(top.y, right.x, bottom.y, left.x, list);
      square.push(o);
    }
  }
  // 检测去除空白格，获取完整的列/空白的列/半空的列
  let fullCol = [];
  let emptyCol = [];
  let halfCol = [];
  for(let i = 0; i < colNum; i++) {
    let has = false;
    let none = false;
    for(let j = 0; j < rowNum; j++) {
      let k = j * colNum + i;
      if(square[k]) {
        has = true;
      }
      else {
        none = true;
      }
    }
    if(has && !none) {
      fullCol.push(i);
    }
    else if(!has && none) {
      emptyCol.push(i);
    }
    else {
      halfCol.push(i);
    }
  }
  // 先移除空白列，等于合并空白列两侧的边
  if(emptyCol.length) {
    for(let i = emptyCol.length - 1; i >= 0; i--) {
      let item = emptyCol[i];
      for(let j = 0; j < rowNum; j++) {
        let k = j * colNum + item;
        square.splice(k, 1);
        // finalVertical.splice(item, 1);
        fullCol = fullCol.map(item2 => {
          if(item2 > item) {
            return item2 - 1;
          }
          return item2;
        });
        halfCol = halfCol.map(item2 => {
          if(item2 > item) {
            return item2 - 1;
          }
          return item2;
        });
      }
      finalVertical.splice(item, 1);
    }
    colNum -= emptyCol.length;
  }
  // 完整的矩阵
  if(fullCol.length === colNum) {
    if(rowNum === 1) {
      return row(json);
    }
    if(colNum === 1) {
      return col(json);
    }
    return matrix(square, rowNum, colNum);
  }
  return null;
}

function matrix(list, rowNum, colNum) {
  // 尝试整个行列成组ai判断
  let data = transform(list);
  let rRow = modelRow(data, rowNum, colNum);
  let rCol = modelCol(data, rowNum, colNum);
  let forecast = Math.max(rRow.forecast, rCol.forecast);
  let direction = rRow.forecast >= rCol.forecast ? 0 : 1;
  let total = {
    forecast,
    row: rRow.forecast,
    col: rCol.forecast,
    direction: forecast >= 0.5 ? direction : 0,
  };
  // 多行多列时，尝试一级拆分，并拆分后的结果与之前进行初级布局ai判断
  let split = [];
  if(rowNum > 2) {}
  if(colNum > 2) {
    for(let i = 1; i < colNum; i++) {
      // TODO: 特殊情况下判断左右均可分割时，需忽略
      // start部分
      if(i > 1) {
        let nData = [];
        for(let j = 0; j < rowNum; j++) {
          for(let k = 0; k < i; k++) {
            nData.push(data[j * colNum + k]);
          }
        }
        let rRow = modelRow(nData, rowNum, i);
        let rCol = modelCol(nData, rowNum, i);
        if(rRow.forecast >= 0.5) {
          let temp = modelJunior(forecast, rRow.forecast);
          if(temp.forecast >= 0.5) {
            split.push({
              h: 0,
              v: i,
              direction: 0,
              area: 0,
              forecast: temp.forecast,
            });
          }
        }
        if(rCol.forecast >= 0.5) {
          let temp = modelJunior(forecast, rCol.forecast);
          if(temp.forecast >= 0.5) {
            split.push({
              h: 0,
              v: i,
              direction: 1,
              area: 0,
              forecast: temp.forecast,
            });
          }
        }
      }
      // end部分
      if(i < colNum - 1) {
        let nData = [];
        for(let j = 0; j < rowNum; j++) {
          for(let k = i; k < colNum; k++) {
            nData.push(data[j * colNum + k]);
          }
        }
        let rRow = modelRow(nData, rowNum, colNum - i);
        let rCol = modelCol(nData, rowNum, colNum - i);
        if(rRow.forecast >= 0.5) {
          let temp = modelJunior(forecast, rRow.forecast);
          if(temp.forecast >= 0.5) {
            split.push({
              h: 0,
              v: i,
              direction: 0,
              area: 1,
              forecast: temp.forecast,
            });
          }
        }
        if(rCol.forecast >= 0.5) {
          let temp = modelJunior(forecast, rCol.forecast);
          if(temp.forecast >= 0.5) {
            split.push({
              h: 0,
              v: i,
              direction: 1,
              area: 1,
              forecast: temp.forecast,
            });
          }
        }
      }
    }
  }
  if(split.length === 1) {}
  else if(split.length > 1) {}
  else if(total.forecast >= 0.5) {
    if(total.row >= total.col) {}
    else {
      let children = [];
      for(let i = 0; i < colNum; i++) {
        let temp = {
          flag: flag.GROUP,
          direction: 0,
          children: [],
        };
        for(let j = 0; j < rowNum; j++) {
          let item = Object.assign({
            flag: flag.ELEMENT,
          }, list[j * colNum + i]);
          temp.children.push(item);
        }
        children.push(temp);
      }
      return {
        flag: flag.LIST,
        direction: total.direction,
        children,
      };
    }
  }
  // 只是普通的多行列
  return {
    flag: flag.GROUP,
    direction: 0,
  }
}

function transform(list) {
  return list.map(item => {
    return {
      x: item.xs,
      y: item.ys,
      width: item.width,
      height: item.height,
      type: item.isImage ? 0 : 1,
      fontSize: item.fontSize,
      lineHeight: item.lineHeight,
    };
  });
}

// 相同direction的group下嵌套的group，可以提取children至上一级
function mergeSameDirectionGroup(json) {
  if(!json || !json.children || [flag.GROUP, flag.LIST].indexOf(json.flag) === -1) {
    return;
  }
  let sameDirection = json.flag === flag.GROUP;
  json.children.forEach(item => {
    if(item === null) {
      return;
    }
    if([flag.GROUP, flag.LIST].indexOf(item.flag) === -1) {
      return;
    }
    if(item.flag === flag.LIST || item.direction !== json.direction) {
      sameDirection = false;
    }
    mergeSameDirectionGroup(item);
  });
  if(sameDirection) {
    let children = json.children;
    for(let i = children.length - 1; i >= 0; i--) {
      let item = children[i];
      if([flag.GROUP, flag.LIST].indexOf(item.flag) === -1) {
        continue;
      }
      children.splice(i, 1, ...item.children);
    }
  }
}

// 标记上下级组相同方向，且下级组仅包含元素的情况
function markSameDirection(json, last) {
  if(!json || !json.children || [flag.GROUP, flag.LIST].indexOf(json.flag) === -1) {
    return;
  }
  let onlyElement = json.flag === flag.GROUP;
  json.children.forEach(item => {
    if(item === null) {
      return;
    }
    if(item.flag !== flag.ELEMENT) {
      onlyElement = false;
    }
    markSameDirection(item, json);
  });
  if(onlyElement && last && last.flag === flag.GROUP && last.direction === json.direction) {
    json.onlyElement = true;
  }
}

// 合并掉上述情况，由上级组直接包含元素
function promoteSameDirection(json) {
  if(!json || !json.children || [flag.GROUP, flag.LIST].indexOf(json.flag) === -1) {
    return;
  }
  let children = json.children;
  for(let i = children.length - 1; i >= 0; i--) {
    let item = children[i];
    if(item.onlyElement) {
      children.splice(i, 1, ...item.children);
    }
  }
  children.forEach(item => {
    promoteSameDirection(item);
  });
}

// 标记组包含的所有元素id列表
function markIdList(json) {
  if(!json) {
    return [];
  }
  let idList = [];
  if(json.flag === flag.ELEMENT) {
    idList.push(json.id);
  }
  else {
    json.children.forEach(item => {
      idList = idList.concat(markIdList(item));
    });
    json.idList = idList;
  }
  return idList;
}

// background和元素一一对应时，被视作元素背景
function attachElementBackground(json, background) {
  if(!json) {
    return;
  }
  // 元素只有当和背景一对一时才符合，元素可能包含多个背景，进行筛选；极端条件一对一可能出现多个，暂时忽略
  if(json.flag === flag.ELEMENT) {
    let bg;
    json.overlay.forEach(item => {
      if(background.has(item)) {
        let temp = background.get(item);
        let count = 0;
        temp.overlay.forEach(item2 => {
          if(!background.has(item2)) {
            count++;
          }
        });
        if(count === 1) {
          bg = temp;
        }
      }
    });
    if(bg) {
      json.bg = bg;
      background.delete(bg.id);
    }
  }
  else {
    json.children.forEach(item => {
      attachElementBackground(item, background);
    });
  }
}

// background被最小完整包含于一个组，即冲突id最小包含时，被认为是组的背景
function attachGroupBackground(json, available, background) {
  if(!json) {
    return;
  }
  if([flag.GROUP, flag.LIST].indexOf(json.flag) > -1) {
    // 深度优先遍历，确保最小完整包含
    json.children.forEach(item => {
      attachGroupBackground(item, available, background);
    });
    let idMap = new Map();
    json.idList.forEach(item => {
      idMap.set(item, true);
    });
    let bg;
    background.forEach(item => {
      let list = item.overlay.filter(item2 => available.has(item2));
      if(list.length) {
        let count = 0;
        list.forEach(item2 => {
          if(idMap.has(item2)) {
            count++;
          }
        });
        if(count === list.length) {
          bg = item;
        }
      }
    });
    if(bg) {
      json.bg = bg;
      background.delete(bg.id);
    }
  }
}

// 标记每层dom的范围，包括background
function markRect(json) {
  if(!json) {
    return;
  }
  if([flag.GROUP, flag.LIST].indexOf(json.flag) > -1) {
    let list = json.children.map(item => {
      return markRect(item);
    });
    let rect = Object.assign([], list[0]);
    for(let i = 1; i < list.length; i++) {
      let item = list[i];
      rect[0] = Math.min(rect[0], item[0]);
      rect[1] = Math.max(rect[1], item[1]);
      rect[2] = Math.max(rect[2], item[2]);
      rect[3] = Math.min(rect[3], item[3]);
    }
    let bg = json.bg;
    if(bg) {
      rect[0] = Math.min(rect[0], bg.ys);
      rect[1] = Math.max(rect[1], bg.xs + bg.width);
      rect[2] = Math.max(rect[2], bg.ys + bg.height);
      rect[3] = Math.min(rect[3], bg.xs);
    }
    json.rect = rect;
    return rect;
  }
  else {
    let { xs, ys, width, height, bg } = json;
    let x4 = xs + width;
    let y4 = ys + height;
    if(bg) {
      xs = Math.min(xs, bg.xs);
      ys = Math.min(ys, bg.ys);
      x4 = Math.max(x4, bg.xs + bg.width);
      y4 = Math.max(y4, bg.ys + bg.height);
    }
    json.rect = [ys, x4, y4, xs];
    return json.rect;
  }
}

// 设置flex的占比
function flex(json) {
  if(!json) {
    return;
  }
  if(json.flag === flag.GROUP) {
    json.children.forEach(item => flex(item));
  }
  else if(json.flag === flag.LIST) {
    let { direction, children, rect } = json;
    let w = rect[1] - rect[3];
    w /= 3;
    for(let i = 0; i < children.length; i++) {
      let item = children[i];
      item.flex = 1;
      item.rect[3] = rect[3] + w * i;
      item.rect[1] = Math.min(rect[1], rect[3] + w * (i + 1));
    }
  }
}

export default function(json) {
  let { top, list } = json;
  let layout = recursion(json);
  mergeSameDirectionGroup(layout);
  markSameDirection(layout);
  promoteSameDirection(layout);
  markIdList(layout);
  let available = new Map();
  let background = new Map();
  list.forEach(item => {
    if(item.isBackground) {
      background.set(item.id, item);
    }
    else if(!item.isForeground) {
      available.set(item.id, item);
    }
  });
  attachElementBackground(layout, background);
  attachGroupBackground(layout, available, background);
  markRect(layout);
  flex(layout);
  return {
    top,
    list,
    layout,
  };
}
