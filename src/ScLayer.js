'use strict';

import type from './type';

const CACHE = new Map();

class ScLayer {
  constructor(layer, level, top) {
    this._layer = layer;
    this._level = level;
    this._top = top;
    this._overlay = [];
  }

  get layer() {
    return this._layer;
  }
  get level() {
    return this._level;
  }
  get top() {
    return this._top;
  }
  get id() {
    return this.layer.id;
  }
  get name() {
    return this.layer.name;
  }
  get type() {
    return this.layer.type;
  }
  get isMeta() {
    return [type.IMAGE, type.SHAPE, type.SHAPE_PATH, type.TEXT].indexOf(this.type) > -1;
  }
  get hasParsed() {
    return !!this._hasParsed;
  }
  set hasParsed(v) {
    this._hasParsed = !!v;
  }
  get parent() {
    return this._parent || null;
  }
  set parent(v) {
    this._parent = v;
  }
  get children() {
    return this._children || null;
  }
  get isIgnore() {
    return !!this._isIgnore;
  }
  set isIgnore(v) {
    this._isIgnore = !!v;
  }
  get isImage() {
    return !!this._isImage;
  }
  set isImage(v) {
    this._isImage = !!v;
  }
  get overlay() {
    return this._overlay;
  }
  set overlay(v) {
    this._overlay = v;
  }
  get isBackground() {
    return !!this._isBackground;
  }
  set isBackground(v) {
    this._isBackground = !!v;
  }
  get isBorder() {
    return !!this._isBorder;
  }
  set isBorder(v) {
    this._isBorder = !!v;
  }
  get isAbsolute() {
    return !!this._isAbsolute;
  }
  set isAbsolute(v) {
    this._isAbsolute = !!v;
  }
  get isRelative() {
    return !!this._isRelative;
  }
  set isRelative(v) {
    this._isRelative = !!v;
  }
  get x() {
    return Math.round(this.layer.frame.x);
  }
  get y() {
    return Math.round(this.layer.frame.y);
  }
  get xs() {
    let x = this.x;
    if(this.type === type.GROUP && this.top.id === this.id) {
      return 0;
    }
    else if(this.parent) {
      x += this.parent.xs;
    }
    return x;
  }
  get ys() {
    let y = this.y;
    if(this.type === type.GROUP && this.top.id === this.id) {
      return 0;
    }
    else if(this.parent) {
      y += this.parent.ys;
    }
    return y;
  }
  get z() {
    return this._z || 0;
  }
  set z(v) {
    this._z = v;
  }
  get zs() {
    return this._zs || 0;
  }
  set zs(v) {
    this._zs = v;
  }
  get width() {
    return Math.round(this.layer.frame.width);
  }
  get height() {
    return Math.round(this.layer.frame.height);
  }

  addOverlay(v) {
    if(this.overlay.indexOf(v) > -1) {
      return;
    }
    this.overlay.push(v);
  }
  removeOverlay(v) {
    let i = this.overlay.indexOf(v);
    if(i > -1) {
      this.overlay.splice(i, 1);
    }
  }

  parse() {
    if(this.hasParsed) {
      return;
    }
    if(this.layer.hidden) {
      return;
    }
    if(this.layer.style.opacity === 0) {
      return;
    }
    this.hasParsed = true;
    // 递归遍历设置父子关系，以及过滤掉隐藏的、超出范围的和空的图层
    if(!this.isMeta) {
      let layers;
      if(this.type === type.SYMBOL_INSTANCE) {
        layers = this.layer.master.layers;
      }
      else {
        layers = this.layer.layers;
      }
      layers.forEach(layer => {
        if(layer.hidden) {
          return;
        }
        if(layer.style.opacity === 0) {
          return;
        }
        if(layer.frame.x < 0 && layer.frame.width < this.width) {
          return;
        }
        if(layer.frame.x > this.width) {
          return;
        }
        if(layer.frame.y < 0 && layer.frame.height < this.height) {
          return;
        }
        if(layer.frame.y > this.height) {
          return;
        }
        let scLayer = ScLayer.getInstance(layer, this.level + 1, this.top);
        scLayer.parse();
        if(scLayer.type === type.GROUP) {
          // 过滤空组
          if(!scLayer.children) {
            return;
          }
          // 纯图片组标识image
          let isImage = true;
          scLayer.children.forEach(item => {
            if(item.type === type.GROUP) {
              if(!item.isImage) {
                isImage = false;
              }
            }
            else if(item.type !== type.SHAPE && item.type !== item.IMAGE && item.type !== item.SHAPE_PATH) {
              isImage = false;
            }
          });
          if(isImage) {
            scLayer.isImage = true;
          }
        }
        else {
          scLayer.isImage = scLayer.type === type.SHAPE || scLayer.type === type.IMAGE;
        }
        scLayer.parent = this;
        this._children = this._children || [];
        this.children.push(scLayer);
      });
    }
  }

  toJSON() {
    if(this._json) {
      return this._json;
    }
    let childrenJson = null;
    if(this.children) {
      childrenJson = this.children.map(child => {
        return child.toJSON();
      });
    }
    let xs = this.xs;
    let ys = this.ys;
    return this._json = {
      id: this.id,
      name: this.name,
      type: this.type,
      isMeta: this.isMeta,
      isIgnore: this.isIgnore,
      isImage: this.isImage,
      overlay: this.overlay,
      isBackground: this.isBackground,
      isBorder: this.isBorder,
      isAbsolute: this.isAbsolute,
      isRelative: this.isRelative,
      x: this.x,
      y: this.y,
      z: this.z,
      xs: xs,
      ys: ys,
      zs: this.zs,
      width: this.width,
      height: this.height,
      children: childrenJson,
    };
  }
  toString() {
    return JSON.stringify(this.toJSON());
  }

  output(path) {
    if(!this.isMeta) {
      //
    }
  }

  static getInstance(layer, level, top) {
    let id = layer.id;
    if(CACHE.has(id)) {
      return CACHE.get(id);
    }
    let item = new ScLayer(layer, level, top);
    CACHE.set(id, item);
    return item;
  }
}

export default ScLayer;
