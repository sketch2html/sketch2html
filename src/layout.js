'use strict';

import modelBasic from './ml/basic';
import modelRow from './ml/row';
import modelCol from './ml/col';
import modelJunior from './ml/junior';
import type from './type';
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

// 此过程中处理掉连续单格可能成组flex布局的情况、独立划分区域的情况
function recursion(json) {
  let { finalHorizontal, finalVertical } = json;
  let rowNum = finalHorizontal.length - 1;
  let colNum = finalVertical.length - 1; console.log(0, rowNum, colNum)
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

function row(json) {
  let { list, finalHorizontal, finalVertical } = json;
  let square = [];
  let top = finalHorizontal[0];
  let bottom = finalHorizontal[1];
  for(let i = 1; i < finalVertical.length; i++) {
    let left = finalVertical[i - 1];
    let right = finalVertical[i];
    let o = getInSquare(top.y, right.x, bottom.y, left.x, list);
    square.push(o);
  }
  let data = transform(square);
  let res = modelBasic(data, 0);
  if(res.forecast >= 0.5) {
    return {
      flag: flag.LIST,
      direction: 1,
      children: square.map(item => {
        return Object.assign({ flag: flag.ELEMENT }, item);
      }),
    };
  }
  return {
    flag: flag.GROUP,
    direction: 1,
    children: square.map(item => {
      return Object.assign({ flag: flag.ELEMENT }, item);
    }),
  };
}

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
  if(res.forecast >= 0.5) {
    return {
      flag: flag.LIST,
      direction: 0,
      children: square.map(item => {
        return Object.assign({ flag: flag.ELEMENT }, item);
      }),
    };
  }
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
  // 找出可能独立的区域，即横竖线撑满的且无相交
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
  } console.log(1, absH.length, absV.length);
  // 横线独立，可分割为多行
  if(absH.length) {
    let index = [];
    let last = 0;
    for(let i = 0; i < absH.length; i++) {
      let item = absH[i];
      index.push([last, item]);
      last = item;
    }
    index.push([last, rowNum]); console.log(2, index);
    // 分别组装独立的分割区域的横竖线，并递归分析
    let children = index.map(item => {
      let h = [];
      for(let i = item[0]; i <= item[1]; i++) {
        h.push(finalHorizontal[i]);
      }
      let v = getVerticalByHorizontal(h, finalVertical); console.log(3, item);
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
  // TODO: 竖线独立，可分割为多列
  if(absV.length) {}
  // 没有独立区域时，获取所有竖线端点坐标，判断竖线是否等长，不等长说明要按端点横向分割
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
  } console.log(4, vs.length)
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
  } console.log(5, vs.length)
  // TODO: 超过2个端点说明不等长
  if(hs.length > 2) {}
  // 前置均没有说明此时是均匀矩阵多格，
  return grid(json, rowNum, colNum);
}

function grid(json, rowNum, colNum) {
  let { list, finalHorizontal, finalVertical } = json; console.log(6, rowNum, colNum)
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
  } console.log(7, fullCol.length, colNum)
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
  // TODO: 按行分
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

// 转换成ai需要的数据格式
function transform(list) {
  return list.map(item => {
    if(!item) {
      return null;
    }
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

// 相同direction的group下的子group，可以提取子children至上一级
function mergeSameDirectionGroup(json, foreground, background) {
  if(json.flag === flag.GROUP) {
    let children = json.children;
    for(let i = children.length - 1; i >= 0; i--) {
      let item = children[i];
      if(!item) {
        continue;
      }
      if(item.flag === flag.ELEMENT) {
        continue;
      }
      mergeSameDirectionGroup(item, foreground, background);
      if(item.flag === flag.GROUP && item.direction === json.direction) {
        children.splice(i, 1, ...item.children);
      }
    }
  }
  else if(json.flag === flag.LIST) {
    json.children.forEach(item => {
      if(item === null) {
        return;
      }
      mergeSameDirectionGroup(item, foreground, background);
    });
  }
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

// 删除标记
function removeIdList(json) {
  if(!json) {
    return;
  }
  if([flag.GROUP, flag.LIST].indexOf(json.flag) > -1) {
    json.children.forEach(item => {
      removeIdList(item);
    });
    delete json.idList;
  }
}

// background完全属于一个元素时，被视作元素背景
function attachElementBackground(json, foreground, background) {
  if(!json) {
    return;
  }
  if(json.flag === flag.ELEMENT) {
    let list = [];
    json.overlay.forEach(id => {
      if(background.has(id)) {
        let bg = background.get(id);
        let count = 0;
        bg.overlay.forEach(id => {
          if(foreground.has(id)) {
            count++;
          }
        });
        // 只和当前元素重合，说明是背景，不可能为0，>1则和多个重合
        if(count === 1) {
          list.push(bg);
        }
      }
    });
    if(list.length) {
      json.bg = list;
      list.forEach(item => {
        background.delete(item.id);
      });
    }
  }
  else if([flag.GROUP, flag.LIST].indexOf(json.flag) > -1) {
    json.children.forEach(item => {
      attachElementBackground(item, foreground, background);
    });
  }
}

// group的相邻children组合同属于一个bg时，独立成组
function unionGroupBackground(json, foreground, background) {
  if(!json || !background.size) {
    return;
  }
  if(json.flag === flag.GROUP) {
    let children = json.children;
    children.forEach(item => {
      unionGroupBackground(item, foreground, background);
    });
    // 从最小范围开始逐渐增大遍历
    for(let i = 1; i < children.length; i++) {
      for(let j = children.length - i; j >= 0; j--) {
        let idList = [];
        for(let k = j; k < j + i && k < children.length; k++) {
          let item = children[k];
          if(!item) {
            continue;
          }
          if(item.flag === flag.ELEMENT) {
            idList.push(item.id);
          }
          else {
            idList = idList.concat(item.idList);
          }
        }
        let list = getBgByIdList(idList, foreground, background);
        if(list.length) {
          let newChildren = children.splice(j, i);
          children.splice(j, 0, {
            flag: flag.GROUP,
            direction: json.direction,
            children: newChildren,
            bg: list,
          });
          list.forEach(item => {
            background.delete(item.id);
          });
        }
      }
    }
  }
  else if(json.flag === flag.LIST) {
    json.children.forEach(item => {
      unionGroupBackground(item, foreground, background);
    });
  }
}

// 标记每层dom的范围，包括background
function markRect(json) {
  if(!json) {
    return [0, 0, 0, 0];
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
      bg.forEach(item => {
        rect[0] = Math.min(rect[0], item.ys);
        rect[1] = Math.max(rect[1], item.xs + item.width);
        rect[2] = Math.max(rect[2], item.ys + item.height);
        rect[3] = Math.min(rect[3], item.xs);
      });
    }
    return json.rect = rect;
  }
  else {
    let { xs, ys, width, height, bg } = json;
    let x4 = xs + width;
    let y4 = ys + height;
    if(bg) {
      bg.forEach(item => {
        xs = Math.min(xs, item.xs);
        ys = Math.min(ys, item.ys);
        x4 = Math.max(x4, item.xs + item.width);
        y4 = Math.max(y4, item.ys + item.height);
      });
    }
    return json.rect = [ys, x4, y4, xs];
  }
}

// 根据元素id列表获取和它们完全重合的背景列表
function getBgByIdList(idList, foreground, background) {
  if(!idList.length || !background.size) {
    return [];
  }
  let idMap = new Map();
  idList.forEach(id => {
    idMap.set(id, true);
  });
  let list = [];
  background.forEach(item => {
    let fg = item.overlay.filter(id => foreground.has(id));
    // 反向统计背景所重合的元素是否全在组里，是就作为背景
    let count = 0;
    fg.forEach(id => {
      if(!idMap.has(id)) {
        count++;
      }
    });
    if(!count) {
      list.push(item);
    }
  });
  return list;
}

// 高阶组的成组性
function flexGroup(json) {
  if(!json) {
    return;
  }
  if(json.flag === flag.ELEMENT) {
    return;
  }
  if(json.flag === flag.GROUP) {
    let children = json.children;
    children.forEach(item => {
      flexGroup(item);
    });
    // 从最小数量开始，逐渐增大，比如若干个组中，每1个组成组、每2个组成组...每len/2个
    for(let i = 2; i <= children.length >> 1; i++) {
      // 从第几个开始，成组至少需要2个
      inner:
      for(let j = 1; j <= children.length - i * 2; j++) {
        let list = [];
        let first = [];
        // 首个标位
        for(let k = j; k < j + i; k++) {
          first.push(children[k]);
        }
        list.push(first);
        // 后续对比首标
        for(let k = j + i; k < children.length; k += i) {
          let temp = [];
          for(let l = k; l < k + i; l++) {
            temp.push(children[l]);
          }
          if(!likeGroup(temp, first)) {
            // 只有首位说明无相似，跳出
            if(list.length === 1) {
              continue inner;
            }
            // 按项尝试成组，不可成组记0，可成记成组率，平均>0.5则整体可成组
            // TODO: 中间部分成组
          }
          list.push(temp);
        }
        // 这里已经到末尾了，但仍有可能剩余，整体长度不整除以i
        let n = tryGroup(list, i);
        if(n >= 0.5) {
          let len = list.length * i;
          console.log(j, len);
          let newChildren = [];
          if(i === 1) {
            newChildren = list.map(item => {
              return item[0];
            });
          }
          else {
            newChildren = list.map(item => {
              return {
                flag: flag.GROUP,
                direction: json.direction,
                children: item,
              };
            });
          }
          let newList = {
            flag: flag.LIST,
            direction: json.direction,
            children: newChildren,
          };
          children.splice(j, len, newList);
          j += len;
        }
      }
    }
  }
  else if(json.flag === flag.LIST) {
    json.children.forEach(item => {
      flexGroup(item);
    });
  }
}

// 2组是否相似，每组包含若干组，每组递归必须完全相等
function likeGroup(a, b) {
  for(let i = 0; i < a.length; i++) {
    if(!recursionLike(a[i], b[i])) {
      return false;
    }
  }
  return true;
}
function recursionLike(a, b) {
  if(a === null && a !== b) {
    return false;
  }
  if(a.flag !== b.flag) {
    return false;
  }
  if(a.flag === flag.ELEMENT) {
    return true;
  }
  if(a.children.length !== b.children.length) {
    return false;
  }
  for(let i = 0; i < a.children.length; i++) {
    if(!recursionLike(a.children[i], b.children[i])) {
      return false;
    }
  }
  return true;
}

// 对一组的组尝试成组
function tryGroup(list, num) {
  let score = [];
  for(let i = 0; i < num; i++) {
    let nList = list.map(group => {
      return group[i];
    });
    recursionTry(nList, score);
  }
  let n = 0;
  score.forEach(i => {
    n += i;
  });
  return n / score.length;
}
function recursionTry(list, score) {
  let allNull = true;
  let hasNull = false;
  let allElement = true;
  let hasElement = false;
  for(let i = 0; i < list.length; i++) {
    let item = list[i];
    if(item === null) {
      hasNull = true;
      allElement = false;
    }
    else {
      if(item.flag === flag.ELEMENT) {
        hasElement = true;
      }
      else {
        allElement = false;
      }
      allNull = false;
    }
  }
  if(allNull) {
    score.push(1);
    return;
  }
  if(hasNull) {
    score.push(0);
    return;
  }
  if(allElement) {
    let data = transform(list);
    for(let i = 1; i < data.length; i++) {
      data[i].y = data[i-1].y + data[i-1].height + 1;
    }
    let res = modelBasic(data, 0);
    score.push(res.forecast);
    return;
  }
  if(hasElement) {
    score.push(0);
    return;
  }
  let length = list[0].children.length;
  for(let i = 0; i < length; i++) {
    let nList = list.map(item => {
      return item.children[i];
    });
    recursionTry(nList, score);
  }
}

// 设置flex的占比，TODO：占比模型
function flexRatio(json) {
  if(!json) {
    return;
  }
  let { direction, children } = json;
  if(json.flag === flag.GROUP) {
    children.forEach(item => flexRatio(item));
    // 横向的也需设置
    if(direction === 1) {
      let unFixed = [];
      children.forEach(item => {
        if(item.isImage) {
          item.flex = 0;
        }
        else {
          unFixed.push(item);
        }
      });
      if(unFixed.length === 1) {
        unFixed[0].flex = 1;
      }
      else if(unFixed.length > 1) {
        unFixed[0].flex = 1;
        unFixed[1].flex = 0;
      }
    }
  }
  else if(json.flag === flag.LIST) {
    children.forEach(item => flexRatio(item));
    // 往下的列表自然增长无需设置
    if(direction === 0) {
      children.forEach(item => {
        item.flex = 0;
      });
    }
    // 横向可以先忽略固定大小的图像，剩余的text判断比例，TODO: 递归复合情况
    else {
      let unFixed = [];
      children.forEach(item => {
        if(item.isImage) {
          item.flex = 0;
        }
        else {
          unFixed.push(item);
        }
      });
      if(unFixed.length === 1) {
        unFixed[0].flex = 1;
      }
      else if(unFixed.length > 1) {
        let width = unFixed.map(item => {
          if(item.flag === flag.ELEMENT) {
            return item.width;
          }
          else {
            return item.rect[1] - item.rect[3];
          }
        });
        let sum = 0;
        width.forEach(item => {
          sum += item;
        });
        unFixed[0].flex = 1;
        unFixed[1].flex = 0;
      }
    }
  }
}

export default function(json) {
  let { top, list } = json;
  let foreground = new Map();
  let background = new Map();
  let border = new Map();
  list.forEach(item => {
    if(item.isBackground) {
      background.set(item.id, item);
    }
    else if(item.isBorder) {
      border.set(item.id, item);
    }
    else {
      foreground.set(item.id, item);
    }
  });
  let layout = recursion(json);
  attachElementBackground(layout, foreground, background);
  mergeSameDirectionGroup(layout, foreground, background);
  markIdList(layout);
  unionGroupBackground(layout, foreground, background);
  removeIdList(layout);
  flexGroup(layout);
  markRect(layout);
  flexRatio(layout);
  return {
    top,
    list,
    layout,
  };
}
