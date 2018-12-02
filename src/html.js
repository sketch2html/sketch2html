'use strict';

import type from './type';
import flag from './flag';
import render from './render';

function recursion(json, option) {
  switch(json.flag) {
    case flag.GROUP:
      return group(json, option);
    case flag.LIST:
      return list(json, option);
    case flag.ELEMENT:
      return element(json, option);
  }
}

function group(json, option) {
  let { direction, children, rect, bg, flex } = json;
  let style = [];
  if(option.list && flex) {
    style.push(`flex:${flex}`);
  }
  let margin = [0, 0, 0, 0];
  if(option.parentPadding) {}
  if(option.prevRect) {
    margin[0] = rect[0] - option.prevRect[0];
  }
  style.push(`margin:${render.joinMarginOrPadding(margin)}`);
  let cr = Object.assign([], children[0].rect);
  for(let i = 1; i < children.length; i++) {
    let item = children[i];
    if(item) {
      cr[0] = Math.min(cr[0], item.rect[0]);
      cr[1] = Math.max(cr[1], item.rect[1]);
      cr[2] = Math.max(cr[2], item.rect[2]);
      cr[3] = Math.min(cr[3], item.rect[3]);
    }
  }
  let padding = [0, 0, 0, 0];
  if(option.list && flex) {}
  else {
    padding = [
      cr[0] - rect[0],
      rect[1] - cr[1],
      rect[2] - cr[2],
      cr[3] - rect[3]
    ];
    style.push(`padding:${render.joinMarginOrPadding(padding)}`);
  }
  if(bg) {
    if(bg.type === type.SHAPE_PATH
      && bg.ys === rect[0]
      && bg.xs + bg.width === rect[1]
      && bg.ys + bg.height === rect[2]
      && bg.xs === rect[3]) {
      style.push(`background:${render.rgba(bg.backgroundColor)} no-repeat center`);
      style.push('background-size:contain');
    }
  }
  let c = children.map((item, i) => {
    let opt = {
      parentRect: rect,
      parentPadding: padding,
      prevRect: i ? children[i - 1].rect : null,
    };
    if(option.list && flex) {
      opt.parentFlex = flex;
    }
    return recursion(item, opt);
  });
  if(option.list) {
    return `<li style="${style.join(';')}">\n${c.join('\n')}\n</li>`;
  }
  return `<div style="${style.join(';')}">\n${c.join('\n')}\n</div>`;
}

function list(json, option) {
  let { direction, children, rect, bg } = json;
  let { parentRect, parentPadding, parentFlex } = option;
  let style = [`display:flex;list-style:none`];
  if(direction === 0) {
    style.push(`flex-direction:column`);
  }
  let margin = [0, 0, 0, 0];
  if(option.prevRect) {
    margin[0] = rect[0] - option.prevRect[2];
  }
  let marginLeft = rect[3] - parentRect[3] - parentPadding[3];
  let marginRight = parentRect[1] - parentPadding[1] - rect[1];
  if(marginLeft > 2 && Math.abs(marginLeft - marginRight) < 3) {
    margin[1] = margin[3] = 'auto';
  }
  else {
    if(marginLeft > 2) {
      margin[3] = marginLeft;
    }
    if(marginRight > 2) {
      margin[1] = marginLeft;
    }
  }
  style.push(`margin:${render.joinMarginOrPadding(margin)}`);
  let cr = Object.assign([], children[0].rect);
  for(let i = 1; i < children.length; i++) {
    let item = children[i];
    if(item) {
      cr[0] = Math.min(cr[0], item.rect[0]);
      cr[1] = Math.max(cr[1], item.rect[1]);
      cr[2] = Math.max(cr[2], item.rect[2]);
      cr[3] = Math.min(cr[3], item.rect[3]);
    }
  }
  let padding = [
    cr[0] - rect[0],
    rect[1] - cr[1],
    rect[2] - cr[2],
    cr[3] - rect[3]
  ];
  style.push(`padding:${render.joinMarginOrPadding(padding)}`);
  let c = children.map(item => {
    return recursion(item, {
      list: true,
      parentRect: rect,
      parentPadding: padding,
    });
  });
  return `<ul style="${style.join(';')}">\n${c.join('\n')}\n</ul>`;
}

function element(json, option) {
  switch(json.type) {
    case type.TEXT:
      return text(json, option);
    case type.SHAPE_PATH:
      return shape(json, option);
  }
}

function text(json, option) {
  let { direction, rect, bg } = json;
  let { parentRect, parentPadding } = option;
  let style = [];
  let margin = [0, 0, 0, 0];
  let padding = [0, 0, 0, 0];
  if(option.prevRect) {
    margin[0] = rect[0] - option.prevRect[2];
  }
  if(bg) {
    padding = [
      json.ys - rect[0],
      rect[1] - json.xs - json.width,
      rect[2] - json.ys - json.height,
      json.xs - rect[3]
    ];
    style.push(`padding:${render.joinMarginOrPadding(padding)}`);
    if(bg.type === type.SHAPE_PATH
      && bg.ys === rect[0]
      && bg.xs + bg.width === rect[1]
      && bg.ys + bg.height === rect[2]
      && bg.xs === rect[3]) {
      style.push(`background:${render.rgba(bg.backgroundColor)} no-repeat center`);
      style.push('background-size:contain');
    }
  }
  let marginLeft = rect[3] - parentRect[3] - parentPadding[3];
  let marginRight = parentRect[1] - parentPadding[1] - rect[1];
  if(marginLeft > 2 && marginRight > 2 && Math.abs(marginLeft - marginRight) / (marginLeft + marginRight) < 0.2) {
    style.push(`text-align:center`);
  }
  else {
    if(marginLeft > 2 && marginRight / marginLeft > 2) {
      margin[3] = marginLeft;
    }
    else if(marginRight <= 2 && marginLeft > 10) {
      style.push(`text-align:right`);
    }
  }
  style.push(`margin:${render.joinMarginOrPadding(margin)}`);
  style.push(`color:${render.rgba(json.color)};`
    + `font-family:${json.fontFamily};`
    + `font-size:${json.fontSize}px;`
    + `line-height:${json.lineHeight}px`);
  return `<p style="${style.join(';')}">${json.text}</p>`;
}

function shape(json, option) {
  let { direction, rect } = json;
  let { parentRect, parentPadding } = option;
  let margin = [0, 0, 0, 0];
  if(option.prevRect) {
    margin[0] = rect[0] - option.prevRect[2];
  }
  let marginLeft = rect[3] - parentRect[3] - parentPadding[3];
  let marginRight = parentRect[1] - parentPadding[1] - rect[1];
  if(marginLeft > 2 && marginRight > 2 && Math.abs(marginLeft - marginRight) / (marginLeft + marginRight) < 0.2) {
    margin[1] = margin[3] = 'auto';
  }
  let style = `display:block;`
    + `margin:${render.joinMarginOrPadding(margin)};`
    + `width:${json.width}px;`
    + `height:${json.height}px;`
    + `background:url(${json.id}.png) no-repeat center;`
    + `background-size:contain`;
  return `<b style="${style}"></b>`;
}

export default function(json) {
  let { list, layout } = json;
  let html = recursion(layout, {});
  return {
    html,
    list,
  };
}
