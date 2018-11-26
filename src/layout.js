'use strict';

import modelRow from './ml/row';
import modelCol from './ml/col';
import modelJunior from './ml/junior';
import flag from './flag';

function getInSquare(top, right, bottom, left, list) {
  for(let i = 0; i < list.length; i++) {
    let item = list[i];
    if(item.x >= left && item.x <= right && item.y >= top && item.y <= bottom) {
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

function analyzeArea(json) {
  let { list, finalHorizontal, finalVertical, finalSquare } = json;
  let row = finalHorizontal.length - 1;
  let col = finalVertical.length - 1;
  let data = [];
  finalSquare.forEach(item => {
    let o = getInSquare(item.y1, item.x4, item.y4, item.x1, list);
    data.push({
      x: o.x,
      y: o.y,
      width: o.width,
      height: o.height,
      type: o.isImage ? 0 : 1,
      fontSize: o.fontSize,
      lineHeight: o.lineHeight,
    });
  });
  let rRow = modelRow(data, row, col);
  let rCol = modelCol(data, row, col);
  let forecast = Math.max(rRow.forecast, rCol.forecast);
  let direction = rRow.forecast >= rCol.forecast ? 0 : 1;
  let res = {
    forecast,
    row: rRow.forecast,
    col: rCol.forecast,
    direction,
  };
  let split = [];
  if(row > 2) {}
  if(col > 2) {
    for(let i = 1; i < col; i++) {
      // start部分
      if(i > 1) {
        let nData = [];
        for(let j = 0; j < row; j++) {
          for(let k = 0; k < i; k++) {
            nData.push(data[j * col + k]);
          }
        }
        let rRow = modelRow(nData, row, i);
        let rCol = modelCol(nData, row, i);
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
      if(i < col - 1) {
        let nData = [];
        for(let j = 0; j < row; j++) {
          for(let k = i; k < col; k++) {
            nData.push(data[j * col + k]);
          }
        }
        let rRow = modelRow(nData, row, col - i);
        let rCol = modelCol(nData, row, col - i);
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
  if(split.length === 1) {
    split = split[0]; console.log(split);
    let children = [];
    if(split.direction === 0) {}
    else {
      if(split.area === 0) {}
      else {
        let left = {
          flag: flag.GROUP,
          direction: 0,
          children: [],
        };
        for(let i = 0; i < split.v; i++) {
          for(let j = 0; j < row; j++) {
            let item = Object.assign({
              flag: flag.ELEMENT,
            }, list[j * col + i]);
            left.children.push(item);
          }
        }
        children.push(left);
        let right = {
          flag: flag.LIST,
          direction: 1,
          children: [],
        };
        for(let i = split.v; i < col; i++) {
          let temp = {
            flag: flag.GROUP,
            direction: 0,
            children: [],
          };
          for(let j = 0; j < row; j++) {
            let item = Object.assign({
              flag: flag.ELEMENT,
            }, list[j * col + i]);
            temp.children.push(item);
          }
          right.children.push(temp);
        }
        children.push(right);
      }
    }
    return {
      flag: flag.GROUP,
      direction: split.direction,
      children,
    };
  }
  else if(split.length > 1) {}
  else if(res.forecast >= 0.5){
    if(res.row >= res.col) {}
    else {
      let children = [];
      for(let i = 0; i < col; i++) {
        let temp = {
          flag: flag.GROUP,
          direction: 0,
          children: [],
        };
        for(let j = 0; j < row; j++) {
          let item = Object.assign({
            flag: flag.ELEMENT,
          }, list[j * col + i]);
          temp.children.push(item);
        }
        children.push(temp);
      }
      return {
        flag: flag.LIST,
        direction: res.direction,
        children,
      };
    }
  }
  return res;
}

export default function(json) {
  let { list, finalHorizontal, finalVertical, finalSquare } = json;
  let row = finalHorizontal.length - 1;
  let col = finalVertical.length - 1;
  // 单行
  if(row === 1) {}
  // 单列
  else if(col === 1) {}
  // 多行列，先按最大分割线检测区块，其中不相交为独立，相交可能为行列组
  let absH = [];
  let absV = [];
  let h = [];
  let v = [];
  let first = finalHorizontal[0];
  outer:
  for(let i = 1; i < finalHorizontal.length - 1; i++) {
    let item = finalHorizontal[i];
    if(item.x[0] === first.x[0] && item.x[1] === first.x[1]) {
      for(let j = 1; j < finalVertical.length - 1; j++) {
        if(isCross(item, finalVertical[j])) {
          h.push(i);
          continue outer;
        }
      }
      absH.push(i);
    }
  }
  first = finalVertical[0];
  outer:
  for(let i = 1; i < finalVertical.length - 1; i++) {
    let item = finalVertical[i];
    if(item.y[0] === first.y[0] && item.y[1] === first.y[1]) {
      for(let j = 1; j < finalHorizontal.length - 1; j++) {
        if(isCross(finalHorizontal[j], item)) {
          v.push(i);
          continue outer;
        }
      }
      absV.push(i);
    }
  }
  console.log(absH, absV, h, v);
  // 独立横竖分割只可能存在一种，都没有的话整个区域不独立
  if(absH.length) {}
  else if(absV.length) {}
  return analyzeArea({
    list,
    finalHorizontal,
    finalVertical,
    finalSquare,
  });
}
