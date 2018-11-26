'use strict';

const tf = require('@tensorflow/tfjs');

function parse(data, row, col) {
  let allText = 1;
  // 列类型平均一致性，每行的话算平均性，再算绝对差，再除以最大权值（假设全部为1），范围为[0, 0.5]
  let types = [];
  for(let i = 0; i < row; i++) {
    let total = 0;
    for(let j = 0; j < col; j++) {
      let item = data[i * col + j];
      total += item.type;
      if(item.type === 0) {
        allText = 0;
      }
    }
    let average = total / col;
    let sum = 0;
    for(let j = 0; j < col; j++) {
      let item = data[i * col + j];
      sum += Math.abs(average - item.type);
    }
    sum /= col;
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
      if(Math.abs(startH - item.y) < 2) {
        count++;
      }
      if(Math.abs(centerH - item.y - item.height * 0.5) < 2) {
        count++;
      }
      if(Math.abs(endH - item.y - item.height) < 2) {
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
      if(Math.abs(startV - item.x) < 2) {
        count++;
      }
      if(Math.abs(centerV - item.x - item.width * 0.5) < 2) {
        count++;
      }
      if(Math.abs(endV - item.x - item.width) < 2) {
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
  // 宽行一致性，宽行一致出格性，单个宽出格性
  let widths = [];
  let widthRow = 0;
  let widthRowDiff = 0;
  for(let i = 0; i < row; i++) {
    let total = 0;
    for(let j = 0; j < col; j++) {
      let item = data[i * col + j];
      total += item.width;
    }
    let average = total / col;
    let sum = 0;
    for(let j = 0; j < col; j++) {
      let item = data[i * col + j];
      let n = Math.abs(average - item.width);
      sum += n;
      widthRowDiff = Math.max(widthRowDiff, n / average || 0);
    }
    sum /= total;
    widths.push(sum);
  }
  let width = 0;
  widths.forEach(item => {
    width += item;
    widthRow = Math.max(widthRow, item);
  });
  width /= widths.length;
  // 高行一致性，高行一致出格性，单个高出格性
  let heights = [];
  let heightRow = 0;
  let heightRowDiff = 0;
  for(let i = 0; i < row; i++) {
    let total = 0;
    for(let j = 0; j < col; j++) {
      let item = data[i * col + j];
      total += item.height;
    }
    let average = total / col;
    let sum = 0;
    for(let j = 0; j < col; j++) {
      let item = data[i * col + j];
      let n = Math.abs(average - item.height);
      sum += n;
      heightRowDiff = Math.max(heightRowDiff, n / average || 0);
    }
    sum /= total;
    heights.push(sum);
  }
  let height = 0;
  heights.forEach(item => {
    height += item;
    heightRow = Math.max(heightRow, item);
  });
  height /= heights.length;
  // 字体行一致性，行一致出格性，单个出格性
  let fontSizes = [];
  let fontSizeRow = 0;
  let fontSizeRowDiff = 0;
  for(let i = 0; i < row; i++) {
    let total = 0;
    for(let j = 0; j < col; j++) {
      let item = data[i * col + j];
      total += item.fontSize;
    }
    let average = total / col;
    let sum = 0;
    for(let j = 0; j < col; j++) {
      let item = data[i * col + j];
      let n = Math.abs(average - item.fontSize);
      sum += n;
      fontSizeRowDiff = Math.max(fontSizeRowDiff, n / average || 0);
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
    fontSizeRow = Math.max(fontSizeRow, item);
  });
  fontSize /= fontSizes.length;
  // 行高行一致性，行高一致出格性，单个出格性
  let lineHeights = [];
  let lineHeightRow = 0;
  let lineHeightRowDiff = 0;
  for(let i = 0; i < row; i++) {
    let total = 0;
    for(let j = 0; j < col; j++) {
      let item = data[i * col + j];
      total += item.lineHeight;
    }
    let average = total / col;
    let sum = 0;
    for(let j = 0; j < col; j++) {
      let item = data[i * col + j];
      let n = Math.abs(average - item.lineHeight);
      sum += n;
      lineHeightRowDiff = Math.max(lineHeightRowDiff, n / average || 0);
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
    lineHeightRow = Math.max(lineHeightRow, item);
  });
  lineHeight /= lineHeights.length;
  // 水平间距一致性
  let marginH = 0;
  for(let i = 0; i < row; i++) {
    let max = 0;
    let min = 0;
    for(let j = 1; j < col; j++) {
      let item = data[i * col + j];
      let prev = data[i * col + j - 1];
      if(j > 1) {
        max = Math.max(max, Math.abs(item.x - prev.x - prev.width));
        min = Math.min(min, Math.abs(item.x - prev.x - prev.width));
      }
      else {
        max = min = Math.abs(item.x - prev.x - prev.width);
      }
    }
    let diff = max - min;
    diff /= max;
    if(isNaN(diff)) {
      diff = 0;
    }
    marginH = Math.max(marginH, diff);
  }

  return [row, col, allText, type, alignH, alignV, alignDiff, alignHDiff, alignVDiff, distance / ht, width, widthRow, widthRowDiff, height, heightRow, heightRowDiff, fontSize, fontSizeRow, fontSizeRowDiff, lineHeight, lineHeightRow, lineHeightRowDiff, marginH];
}

const f = (x, w, b) => {
  const h = tf.matMul(x, w).add(b);
  return tf.sigmoid(h);
};

const w = tf.variable(tf.tensor2d([
  1.4430301189422607,
  0.6951603293418884,
  -0.20091697573661804,
  -1.3960137367248535,
  0.9645492434501648,
  0.6312721967697144,
  0.9975471496582031,
  -2.8683295249938965,
  -1.6589916944503784,
  -7.5311279296875,
  -3.8714444637298584,
  1.513302206993103,
  1.7055970430374146,
  -8.049519538879395,
  -7.765089988708496,
  -7.484204292297363,
  -10.79858684539795,
  -10.414084434509277,
  -10.290769577026367,
  -6.17625093460083,
  -6.636294841766357,
  -7.162513256072998,
  -11.630932807922363 ], [23, 1]));
const b = tf.variable(tf.scalar(-1.4506675004959106));

module.exports = function(data, row, col) {
  let param = parse(data, row, col);
  let res = f([param], w, b);
  return {
    param,
    forecast: res.get(0, 0),
  };
};
