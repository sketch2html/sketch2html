'use strict';

const tf = require('@tensorflow/tfjs');

function parse(classify, nClassify) {
  return [classify >= 0.5 ? 1 : 0, nClassify >= 0.5 ? 1 : 0, classify, nClassify];
}

const f = (x, w, b) => {
  const h = tf.matMul(x, w).add(b);
  return tf.sigmoid(h);
};

const w = tf.variable(tf.tensor2d([
  -2.0379836559295654,
  4.21529483795166,
  -15.983718872070312,
  4.755427837371826 ], [4, 1]));
const b = tf.variable(tf.scalar(4.21529483795166));

module.exports = function(classify, nClassify) {
  let param = parse(classify, nClassify);
  let res = f([param], w, b);
  return {
    param,
    forecast: res.get(0, 0),
  };
};
