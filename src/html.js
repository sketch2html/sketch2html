'use strict';

import type from './type';
import flag from './flag';
import render from './render';

function recursion(json, option) {
  switch(json.flag) {
    case flag.GROUP:
      return group(json, option);
    // case flag.LIST:
      // return list(json, option);
    case flag.ELEMENT:
      return element(json, option);
  }
}

function group(json, option) {
  let { direction, children, rect, bg } = json;
  let style = [];
  let margin = [0, 0, 0, 0];
  if(option.parentPadding) {}
  if(option.prevRect) {
    margin[0] = rect[0] - option.prevRect[0];
  }
  style.push(`margin:${margin.join('px ') + ' px'}`.replace(/0px/g, 0));
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
  if(bg) {
    cr[0] = Math.min(cr[0], bg.ys);
    cr[1] = Math.max(cr[1], bg.xs + bg.width);
    cr[2] = Math.max(cr[2], bg.ys + bg.height);
    cr[3] = Math.min(cr[3], bg.xs);
  }
  let padding = [
    cr[0] - rect[0],
    rect[1] - cr[1],
    rect[2] - cr[2],
    cr[3] - rect[3]
  ];
  style.push(`padding:${padding.join('px ') + 'px'}`.replace(/0px/g, 0));
  if(bg) {
    if(bg.type === type.SHAPE_PATH
      && bg.xs === rect[0]
      && bg.ys === rect[3]
      && bg.xs + bg.width === rect[1]
      && bg.ys + bg.height === rect[2]) {
      style.push(`background:${render.rgba(bg.backgroundColor)} no-repeat center`);
      style.push('background-size:contain');
    }
  }
  let c = children.map((item, i) => {
    let opt = {
      parentPadding: padding,
      prevRect: i ? children[i - 1].rect : null,
    };
    return recursion(item, opt);
  });
  return `<div style="${style.join(';')}">\n${c.join('\n')}\n</div>`;
}

function list(json, option) {
  let children = json.children.map(item => {
    return `<li style="flex:1;">\n${recursion(item, {
      localRoot: true,
    })}\n</li>`;
  });
  return `<ul style="display:flex;list-style:none">\n${children.join('\n')}\n</ul>`;
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
  let { direction, children, rect, bg } = json;
  let style = [];
  let margin = [0, 0, 0, 0];
  if(option.prevRect) {
    margin[0] = rect[0] - option.prevRect[2] + 'px';
  }
  style.push(`margin:${margin.join('px ') + ' px'}`.replace(/0px/g, 0));
  let padding = [
    json.ys - rect[0],
    rect[1] - json.xs - json.width,
    rect[2] - json.ys - json.height,
    json.xs - rect[3]
  ];
  style.push(`padding:${padding.join('px ') + 'px'}`.replace(/0px/g, 0));
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
  style.push(`color:${render.rgba(json.color)};`
    + `font-family:${json.fontFamily};`
    + `font-size:${json.fontSize}px;`
    + `line-height:${json.lineHeight}px`);
  return `<p style="${style.join(';')}">${json.text}</p>`;
}

function shape(json, option) {
  let style = `display:inline-block;`
    + `width:${json.width}px;`
    + `height:${json.height}px;`
    + `background:url(${json.id}.png) no-repeat center;`
    + `background-size:cover`;
  return `<b style="${style}" />`;
}

export default function(json) {
  let { top, layout } = json;
  // let parentRect = [top.y, top.width, top.height, top.x];
  return recursion(layout, {
    depth: 0,
  });
}
