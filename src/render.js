'use strict';

export default {
  rgba(v) {
    if(v.startsWith('#')) {
      v = v.slice(1);
      if(v.length === 8) {
        let r = v.slice(0, 2);
        let g = v.slice(2, 4);
        let b = v.slice(4, 6);
        let a = v.slice(6);
        return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${parseInt(a, 16) / 255})`;
      }
    }
    if(v.startsWith('rgba(')) {
      for(let i = 0; i < 3; i++) {
        v = v.replace(/(\d+)%/, function($0, $1) {
          return Math.round($1 * 2.55);
        });
      }
      v = v.replace(/(\d+)%/g, function($0, $1) {
        return Math.round($1 * 0.01);
      });
      return v;
    }
  },
  joinMarginOrPadding(v) {
    if(Array.isArray(v)) {
      let s = '';
      for(let i = 0; i < v.length; i++) {
        let item = v[i];
        if(item === 0) {
          s += '0 ';
        }
        else if(item === 'auto') {
          s += 'auto ';
        }
        else {
          s += item + 'px ';
        }
      }
      return s.trim();
    }
    return v;
  },
};
