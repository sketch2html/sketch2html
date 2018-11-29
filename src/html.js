'use strict';

import type from './type';
import flag from './flag';

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

function group(json, option = {}) {
  if(json.children.length === 1) {
    return recursion(json.children[0]);
  }
  let children = json.children.map(item => {
    return recursion(item);
  });
  if(option.localRoot) {
    return children.join('\n');
  }
  if(json.direction === 1) {
    return `<div style="display:flex">\n${children.join('\n')}\n</div>`;
  }
  return `<div>\n${children.join('\n')}\n</div>`;
}

function list(json, option = {}) {
  let children = json.children.map(item => {
    return `<li style="flex:1;">\n${recursion(item, {
      localRoot: true,
    })}\n</li>`;
  });
  return `<ul style="display:flex;list-style:none">\n${children.join('\n')}\n</ul>`;
}

function element(json, option = {}) {
  switch(json.type) {
    case type.TEXT:
      return text(json);
    case type.SHAPE_PATH:
      return shape(json);
  }
}

function text(json, option = {}) {
  let style = `color:${json.color};`
    + `font-family:${json.fontFamily};`
    + `font-size:${json.fontSize}px;`
    + `line-height:${json.lineHeight}px`;
  return `<p style="${style}">${json.text}</p>`;
}

function shape(json, option = {}) {
  let style = `display:inline-block;`
    + `width:${json.width}px;`
    + `height:${json.height}px;`
    + `background:url(${json.id}.png) no-repeat center;`
    + `background-size:cover`;
  return `<b style="${style}" />`;
}

export default function(json) {
  let { parent, list, layout } = json;
  return recursion(layout);
}
