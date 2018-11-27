'use strict';

import modelRow from './ml/row';
import modelCol from './ml/col';
import modelJunior from './ml/junior';
import flag from './flag';
import sort from './sort';

function getInSquare(top, right, bottom, left, list) {
  for(let i = 0; i < list.length; i++) {
    let item = list[i];
    if(item.xc >= left && item.xc <= right && item.yc >= top && item.yc <= bottom) {
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

function col() {}

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
  // 先检测去除空白格，获取完整的行列
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
  return null;
  // let { list, finalHorizontal, finalVertical, finalSquare } = json;
  // let row = finalHorizontal.length - 1;
  // let col = finalVertical.length - 1;
  // let data = [];
  // finalSquare.forEach(item => {
  //   let o = getInSquare(item.y1, item.x4, item.y4, item.x1, list);
  //   data.push({
  //     x: o.x,
  //     y: o.y,
  //     width: o.width,
  //     height: o.height,
  //     type: o.isImage ? 0 : 1,
  //     fontSize: o.fontSize,
  //     lineHeight: o.lineHeight,
  //   });
  // });
  // let rRow = modelRow(data, row, col);
  // let rCol = modelCol(data, row, col);
  // let forecast = Math.max(rRow.forecast, rCol.forecast);
  // let direction = rRow.forecast >= rCol.forecast ? 0 : 1;
  // let res = {
  //   forecast,
  //   row: rRow.forecast,
  //   col: rCol.forecast,
  //   direction,
  // };
  // let split = [];
  // if(row > 2) {}
  // if(col > 2) {
  //   for(let i = 1; i < col; i++) {
  //     // start部分
  //     if(i > 1) {
  //       let nData = [];
  //       for(let j = 0; j < row; j++) {
  //         for(let k = 0; k < i; k++) {
  //           nData.push(data[j * col + k]);
  //         }
  //       }
  //       let rRow = modelRow(nData, row, i);
  //       let rCol = modelCol(nData, row, i);
  //       if(rRow.forecast >= 0.5) {
  //         let temp = modelJunior(forecast, rRow.forecast);
  //         if(temp.forecast >= 0.5) {
  //           split.push({
  //             h: 0,
  //             v: i,
  //             direction: 0,
  //             area: 0,
  //             forecast: temp.forecast,
  //           });
  //         }
  //       }
  //       if(rCol.forecast >= 0.5) {
  //         let temp = modelJunior(forecast, rCol.forecast);
  //         if(temp.forecast >= 0.5) {
  //           split.push({
  //             h: 0,
  //             v: i,
  //             direction: 1,
  //             area: 0,
  //             forecast: temp.forecast,
  //           });
  //         }
  //       }
  //     }
  //     // end部分
  //     if(i < col - 1) {
  //       let nData = [];
  //       for(let j = 0; j < row; j++) {
  //         for(let k = i; k < col; k++) {
  //           nData.push(data[j * col + k]);
  //         }
  //       }
  //       let rRow = modelRow(nData, row, col - i);
  //       let rCol = modelCol(nData, row, col - i);
  //       if(rRow.forecast >= 0.5) {
  //         let temp = modelJunior(forecast, rRow.forecast);
  //         if(temp.forecast >= 0.5) {
  //           split.push({
  //             h: 0,
  //             v: i,
  //             direction: 0,
  //             area: 1,
  //             forecast: temp.forecast,
  //           });
  //         }
  //       }
  //       if(rCol.forecast >= 0.5) {
  //         let temp = modelJunior(forecast, rCol.forecast);
  //         if(temp.forecast >= 0.5) {
  //           split.push({
  //             h: 0,
  //             v: i,
  //             direction: 1,
  //             area: 1,
  //             forecast: temp.forecast,
  //           });
  //         }
  //       }
  //     }
  //   }
  // }
  // if(split.length === 1) {
  //   split = split[0];
  //   let children = [];
  //   if(split.direction === 0) {}
  //   else {
  //     if(split.area === 0) {}
  //     else {
  //       let left = {
  //         flag: flag.GROUP,
  //         direction: 0,
  //         children: [],
  //       };
  //       for(let i = 0; i < split.v; i++) {
  //         for(let j = 0; j < row; j++) {
  //           let item = Object.assign({
  //             flag: flag.ELEMENT,
  //           }, list[j * col + i]);
  //           left.children.push(item);
  //         }
  //       }
  //       children.push(left);
  //       let right = {
  //         flag: flag.LIST,
  //         direction: 1,
  //         children: [],
  //       };
  //       for(let i = split.v; i < col; i++) {
  //         let temp = {
  //           flag: flag.GROUP,
  //           direction: 0,
  //           children: [],
  //         };
  //         for(let j = 0; j < row; j++) {
  //           let item = Object.assign({
  //             flag: flag.ELEMENT,
  //           }, list[j * col + i]);
  //           temp.children.push(item);
  //         }
  //         right.children.push(temp);
  //       }
  //       children.push(right);
  //     }
  //   }
  //   return {
  //     flag: flag.GROUP,
  //     direction: split.direction,
  //     children,
  //   };
  // }
  // else if(split.length > 1) {}
  // else if(res.forecast >= 0.5){
  //   if(res.row >= res.col) {}
  //   else {
  //     let children = [];
  //     for(let i = 0; i < col; i++) {
  //       let temp = {
  //         flag: flag.GROUP,
  //         direction: 0,
  //         children: [],
  //       };
  //       for(let j = 0; j < row; j++) {
  //         let item = Object.assign({
  //           flag: flag.ELEMENT,
  //         }, list[j * col + i]);
  //         temp.children.push(item);
  //       }
  //       children.push(temp);
  //     }
  //     return {
  //       flag: flag.LIST,
  //       direction: res.direction,
  //       children,
  //     };
  //   }
  // }
  // return res;
}

export default function(json) {
  return recursion(json);
}
