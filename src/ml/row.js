'use strict';

const tf = require('@tensorflow/tfjs');

function parse(data, row, col) {
  let allText = 1;
  // 行类型平均一致性，每行的话算平均性，再算绝对差，再除以最大权值（假设全部为1），范围为[0, 0.5]
  let types = [];
  for(let i = 0; i < col; i++) {
    let total = 0;
    for(let j = 0; j < row; j++) {
      let item = data[j * col + i];
      total += item.type;
      if(item.type === 0) {
        allText = 0;
      }
    }
    let average = total / row;
    let sum = 0;
    for(let j = 0; j < row; j++) {
      let item = data[j * col + i];
      sum += Math.abs(average - item.type);
    }
    sum /= row;
    types.push(sum);
  }
  let type = 0;
  types.forEach(item => {
    type += item;
  });
  type /= types.length;
  // 间距比
  let ht = 0;
  let distance = 0;
  for(let i = 1; i < row; i++) {
    let max = 0;
    for(let j = 0; j < col; j++) {
      let a = data[(i - 1) * col + j];
      let b = data[i * col + j];
      max = Math.max(max, b.y - a.y - a.height);
    }
    distance += max;
    if(i === row - 1) {
      for(let j = 0; j < col; j++) {
        let item = data[i * col + j];
        ht = Math.max(ht, item.y + item.height);
      }
    }
  }
  // 水平对齐一致性
  let alignHs = [];
  for(let i = 0; i < row; i++) {
    let startH = 0;
    let centerH = 0;
    let endH = 0;
    for(let j = 0; j < col; j++) {
      let item = data[i * col + j];
      startH += item.y;
      centerH += item.y + item.height * 0.5;
      endH += item.y + item.height;
    }
    startH /= col;
    centerH /= col;
    endH /= col;
    let count = 0;
    for(let j = 0; j < col; j++) {
      let item = data[i * col + j];
      let res = 0;
      if(Math.abs(startH - item.y) < 2) {
        res++;
      }
      if(Math.abs(centerH - item.y - item.height * 0.5) < 2) {
        res++;
      }
      if(Math.abs(endH - item.y - item.height) < 2) {
        res++;
      }
      // 全对齐
      if(res === 3) {
        count += 2;
      }
      // 单对齐
      else if(res) {
        count++;
      }
    }
    count /= col * 3;
    alignHs.push(count);
  }
  let alignH = 0;
  alignHs.forEach(item => {
    alignH += item;
  });
  alignH /= alignHs.length;
  // 垂直对齐一致性
  let alignVs = [];
  for(let i = 0; i < col; i++) {
    let startV = 0;
    let centerV = 0;
    let endV = 0;
    for(let j = 0; j < row; j++) {
      let item = data[j * col + i];
      startV += item.x;
      centerV += item.x + item.width * 0.5;
      endV += item.x + item.width;
    }
    startV /= row;
    centerV /= row;
    endV /= row;
    let count = 0;
    for(let j = 0; j < row; j++) {
      let item = data[j * col + i];
      let res = 0;
      if(Math.abs(startV - item.x) < 2) {
        res++;
      }
      if(Math.abs(centerV - item.x - item.width * 0.5) < 2) {
        res++;
      }
      if(Math.abs(endV - item.x - item.width) < 2) {
        res++;
      }
      // 全对齐
      if(res === 3) {
        count += 2;
      }
      else if(res) {
        count++;
      }
    }
    count /= row * 3;
    alignVs.push(count);
  }
  let alignV = 0;
  alignVs.forEach(item => {
    alignV += item;
  });
  alignV /= alignVs.length;
  // 水平对齐出格性，防止某一格完全不对齐且差距大，但其它格对齐
  let alignDiffHs = [];
  for(let i = 0; i < row; i++) {
    let startH = 0;
    let centerH = 0;
    let endH = 0;
    for(let j = 0; j < col; j++) {
      let item = data[i * col + j];
      startH += item.y;
      centerH += item.y + item.height * 0.5;
      endH += item.y + item.height;
    }
    startH /= col;
    centerH /= col;
    endH /= col;
    let count = 0;
    let sum = 0;
    for(let j = 0; j < col; j++) {
      let item = data[i * col + j];
      if(Math.abs(startH - item.y) < 2) {
      }
      else if(Math.abs(centerH - item.y - item.height * 0.5) < 2) {
      }
      else if(Math.abs(endH - item.y - item.height) < 2) {
      }
      else {
        let diff = Math.max(Math.abs(startH - item.y), Math.abs(endH - item.y - item.height));
        sum += diff;
        count++;
      }
    }
    sum /= count;
    if(isNaN(sum)) {
      sum = 0;
    }
    alignDiffHs.push(sum);
  }
  let alignHDiff = 0;
  alignDiffHs.forEach(item => {
    alignHDiff += item;
  });
  alignHDiff /= alignDiffHs.length;
  // 垂直对齐出格性，防止某一格完全不对齐且差距大，但其它格对齐
  let alignDiffVs = [];
  for(let i = 0; i < col; i++) {
    let startV = 0;
    let centerV = 0;
    let endV = 0;
    for(let j = 0; j < row; j++) {
      let item = data[j * col + i];
      startV += item.x;
      centerV += item.x + item.width * 0.5;
      endV += item.x + item.width;
    }
    startV /= row;
    centerV /= row;
    endV /= row;
    let count = 0;
    let sum = 0;
    for(let j = 0; j < row; j++) {
      let item = data[j * col + i];
      if(Math.abs(startV - item.x) < 2) {
      }
      else if(Math.abs(centerV - item.x - item.width * 0.5) < 2) {
      }
      else if(Math.abs(endV - item.x - item.width) < 2) {
      }
      else {
        let diff = Math.max(Math.abs(startV - item.x), Math.abs(endV - item.x - item.width));
        sum += diff;
        count++;
      }
    }
    sum /= count;
    if(isNaN(sum)) {
      sum = 0;
    }
    alignDiffVs.push(sum);
  }
  let alignVDiff = 0;
  alignDiffVs.forEach(item => {
    alignVDiff += item;
  });
  alignVDiff /= alignDiffVs.length;
  // 对齐提升
  let alignDiff = alignH - alignV;
  // 宽列一致性，宽列一致出格性，单个宽出格性
  let widths = [];
  let widthCol = 0;
  let widthColDiff = 0;
  for(let i = 0; i < col; i++) {
    let total = 0;
    for(let j = 0; j < row; j++) {
      let item = data[j * col + i];
      total += item.width;
    }
    let average = total / row;
    let sum = 0;
    for(let j = 0; j < row; j++) {
      let item = data[j * col + i];
      let n = Math.abs(average - item.width);
      sum += n;
      widthColDiff = Math.max(widthColDiff, n / average || 0);
    }
    sum /= total;
    widths.push(sum);
  }
  let width = 0;
  widths.forEach(item => {
    width += item;
    widthCol = Math.max(widthCol, item);
  });
  width /= widths.length;
  // 高列一致性，高列一致出格性，单个高出格性
  let heights = [];
  let heightCol = 0;
  let heightColDiff = 0;
  for(let i = 0; i < col; i++) {
    let total = 0;
    for(let j = 0; j < row; j++) {
      let item = data[j * col + i];
      total += item.height;
    }
    let average = total / row;
    let sum = 0;
    for(let j = 0; j < row; j++) {
      let item = data[j * col + i];
      let n = Math.abs(average - item.height);
      sum += n;
      heightColDiff = Math.max(heightColDiff, n / average || 0);
    }
    sum /= total;
    heights.push(sum);
  }
  let height = 0;
  heights.forEach(item => {
    height += item;
    heightCol = Math.max(heightCol, item);
  });
  height /= heights.length;
  // 字体列一致性，列一致出格性，单个出格性
  let fontSizes = [];
  let fontSizeCol = 0;
  let fontSizeColDiff = 0;
  for(let i = 0; i < col; i++) {
    let total = 0;
    for(let j = 0; j < row; j++) {
      let item = data[j * col + i];
      total += item.fontSize;
    }
    let average = total / row;
    let sum = 0;
    for(let j = 0; j < row; j++) {
      let item = data[j * col + i];
      let n = Math.abs(average - item.fontSize);
      sum += n;
      fontSizeColDiff = Math.max(fontSizeColDiff, n / average || 0);
    }
    sum /= total;
    if(total === 0) {
      sum = 0;
    }
    fontSizes.push(sum);
  }
  let fontSize = 0;
  fontSizes.forEach(item => {
    fontSize += item;
    fontSizeCol = Math.max(fontSizeCol, item);
  });
  fontSize /= fontSizes.length;
  // 行高列一致性，行高一致出格性，单个出格性
  let lineHeights = [];
  let lineHeightCol = 0;
  let lineHeightColDiff = 0;
  for(let i = 0; i < col; i++) {
    let total = 0;
    for(let j = 0; j < row; j++) {
      let item = data[j * col + i];
      total += item.lineHeight;
    }
    let average = total / row;
    let sum = 0;
    for(let j = 0; j < row; j++) {
      let item = data[j * col + i];
      let n = Math.abs(average - item.lineHeight);
      sum += n;
      lineHeightColDiff = Math.max(lineHeightColDiff, n / average || 0);
    }
    sum /= total;
    if(total === 0) {
      sum = 0;
    }
    lineHeights.push(sum);
  }
  let lineHeight = 0;
  lineHeights.forEach(item => {
    lineHeight += item;
    lineHeightCol = Math.max(lineHeightCol, item);
  });
  lineHeight /= lineHeights.length;
  // 垂直间距一致性
  let marginV = 0;
  for(let i = 0; i < col; i++) {
    let max = 0;
    let min = 0;
    for(let j = 1; j < row; j++) {
      let item = data[j * col + i];
      let prev = data[j * col + i - 1];
      if(j > 1) {
        max = Math.max(max, Math.abs(item.y - prev.y - prev.height));
        min = Math.min(min, Math.abs(item.y - prev.y - prev.height));
      }
      else {
        max = min = Math.abs(item.y - prev.y - prev.height);
      }
    }
    let diff = max - min;
    diff /= max;
    if(isNaN(diff)) {
      diff = 0;
    }
    marginV = Math.max(marginV, diff);
  }

  return [row, col, allText, type, alignH, alignV, alignDiff, alignHDiff, alignVDiff, distance / ht, width, widthCol, widthColDiff, height, heightCol, heightColDiff, fontSize, fontSizeCol, fontSizeColDiff, lineHeight, lineHeightCol, lineHeightColDiff, marginV];
}

const f = (x, w, b) => {
  const h = tf.matMul(x, w).add(b);
  return tf.sigmoid(h);
};

const w = tf.variable(tf.tensor2d([
  2.0083255767822266,
  -0.31791117787361145,
  4.045642852783203,
  -1.289065957069397,
  1.1820979118347168,
  4.138618469238281,
  -9.261831283569336,
  -2.3883020877838135,
  -0.2694131135940552,
  -10.655627250671387,
  -12.047514915466309,
  -4.3455939292907715,
  -5.0233917236328125,
  -3.6735353469848633,
  -1.5828726291656494,
  -0.293669730424881,
  -12.498136520385742,
  -12.861517906188965,
  -11.180801391601562,
  -5.988503932952881,
  -6.46907901763916,
  -6.544981002807617,
  -13.467001914978027 ], [23, 1]));
const b = tf.variable(tf.scalar(-3.7541027069091797));

module.exports = function(data, row, col) {
  let param = parse(data, row, col);
  let res = f([param], w, b);
  return {
    param,
    forecast: res.get(0, 0),
  };
};
