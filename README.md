# sketch2html

[![NPM version](https://badge.fury.io/js/sketch2html.png)](https://npmjs.org/package/sketch2html)
[![Build Status](https://travis-ci.org/sketch2html/sketch2html.svg?branch=master)](https://travis-ci.org/sketch2html/sketch2html)
[![Dependency Status](https://david-dm.org/sketch2html/sketch2html.png)](https://david-dm.org/sketch2html/sketch2html)

[![logo](https://raw.githubusercontent.com/sketch2html/sketch2html/master/assets/icon.png)](https://github.com/sketch2html/sketch2html)

## reference
* Sketch api: https://developer.sketchapp.com/reference/api
* Sketch plugin: https://developer.sketchapp.com/guides
* Sketch headers: https://github.com/abynim/Sketch-Headers
* TensorFlow.js: https://js.tensorflow.org/api/0.13.3

## 开发说明
* `npm i`安装依赖
* `npm run postinstall`安装关联插件源码
* `npm run dev`自动侦听构建并同时输出`console`日志

## 步骤说明
* `format`解析源文件数据，分析图层数据形成树形结构数据
* `flatten`一维化树形结构，将图层元素平铺在平面上
* `overlay`根据层叠、z轴过滤出背景元素、边框元素
* `edge`分析主要图层元素矩形边，形成布局网格
* `layout`ai判断网格划分排列组合，形成类DOM的树形结构数据
* `html`css和图像工程，拼合html最终结果
