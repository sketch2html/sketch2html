'use strict';

import { export as expt, Document } from 'sketch/dom';
import UI from 'sketch/ui';

import preCheck from './preCheck';
import format from './format';
import flatten from './flatten';
import overlay from './overlay';
import edge from './edge';
import html from './html';
import layout from './layout';
import util from './util';
import template from './template';

export function overall() {
  let list = [formats, flattens, overlays, edges, layouts, htmls];
  for(let i = 0; i < list.length; i++) {
    let res = list[i](true);
    if(!res) {
      return;
    }
  }
  UI.alert('Message', `JSON data have been outputing to:\n${NSHomeDirectory()}/Documents/sketch2html`);
}

export function formats(noAlert) {
  let list = format();
  if(!list) {
    return false;
  }
  let message = [];
  list.forEach(item => {
    let directory = `${NSHomeDirectory()}/Documents/sketch2html/format`;
    let fileManager = NSFileManager.defaultManager();
    if(!fileManager.fileExistsAtPath(NSString.stringWithString(directory))) {
      fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(NSString.stringWithString(directory), true, null, null);
    }
    let dir = `${directory}/${item.id}.json`;
    message.push(dir);
    let json = item.toJSON();
    let s = JSON.stringify(json, null, 2);
    NSString.stringWithString(s).writeToFile_atomically_encoding_error(NSString.stringWithString(dir), false, NSUTF8StringEncoding, null);
  });
  if(noAlert !== true) {
    UI.alert('Message', `JSON format have been outputing to:\n${message.join('\n')}`);
  }
  return true;
}

export function flattens(noAlert) {
  let selection = preCheck();
  if(!selection) {
    return false;
  }
  let check = [];
  selection.forEach(item => {
    let dir = `${NSHomeDirectory()}/Documents/sketch2html/format/${item.id}.json`;
    let fileManager = NSFileManager.defaultManager();
    if(!fileManager.fileExistsAtPath(NSString.stringWithString(dir))) {
      check.push(dir);
    }
  });
  if(check.length) {
    UI.alert('Warn', `JSON data must be prepared by format command:\n${check.join('\n')}`);
    return false;
  }
  let list = [];
  selection.forEach(item => {
    let dir = `${NSHomeDirectory()}/Documents/sketch2html/format/${item.id}.json`;
    let fileHandler = NSFileHandle.fileHandleForReadingAtPath(dir);
    let data = fileHandler.readDataToEndOfFile();
    let s = NSString.alloc().initWithData_encoding(data, NSUTF8StringEncoding);
    let json = JSON.parse(s);
    list.push(json);
  });
  let arr = list.map(item => {
    return flatten(item);
  });
  let message = [];
  arr.forEach((item, i) => {
    let directory = `${NSHomeDirectory()}/Documents/sketch2html/flatten`;
    let fileManager = NSFileManager.defaultManager();
    if(!fileManager.fileExistsAtPath(NSString.stringWithString(directory))) {
      fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(NSString.stringWithString(directory), true, null, null);
    }
    let id = list[i].id;
    let dir = `${directory}/${id}.json`;
    message.push(dir);
    let s = JSON.stringify(item, null, 2);
    NSString.stringWithString(s).writeToFile_atomically_encoding_error(NSString.stringWithString(dir), false, NSUTF8StringEncoding, null);
    dir = `${directory}/${id}.html`;
    let document = Document.getSelectedDocument();
    let layer = document.getLayerWithID(id);
    let top = util.getTop(layer);
    let pageWidth = top.frame.width;
    let pageHeight = top.frame.height;
    item.list.forEach(data => {
      let layer = document.getLayerWithID(data.id);
      expt(layer, {
        output: `${directory}`,
        'use-id-for-name': true,
        overwriting: true,
        'save-for-web': true,
      });
    });
    s = template.flatten({
      title: 'flatten',
      pageWidth,
      pageHeight,
      item,
    });
    NSString.stringWithString(s).writeToFile_atomically_encoding_error(NSString.stringWithString(dir), false, NSUTF8StringEncoding, null);
  });
  if(noAlert !== true) {
    UI.alert('Message', `JSON flatten have been outputing to:\n${message.join('\n')}`);
  }
  return true;
}

export function overlays(noAlert) {
  let selection = preCheck();
  if(!selection) {
    return false;
  }
  let check = [];
  selection.forEach(item => {
    let dir = `${NSHomeDirectory()}/Documents/sketch2html/flatten/${item.id}.json`;
    let fileManager = NSFileManager.defaultManager();
    if(!fileManager.fileExistsAtPath(NSString.stringWithString(dir))) {
      check.push(dir);
    }
  });
  if(check.length) {
    UI.alert('Warn', `JSON data must be prepared by flatten command:\n${check.join('\n')}`);
    return false;
  }
  let list = [];
  let ids = [];
  selection.forEach(item => {
    ids.push(item.id);
    let dir = `${NSHomeDirectory()}/Documents/sketch2html/flatten/${item.id}.json`;
    let fileHandler = NSFileHandle.fileHandleForReadingAtPath(dir);
    let data = fileHandler.readDataToEndOfFile();
    let s = NSString.alloc().initWithData_encoding(data, NSUTF8StringEncoding);
    let json = JSON.parse(s);
    list.push(json);
  });
  let arr = list.map(item => {
    return overlay(item);
  });
  let message = [];
  arr.forEach((item, i) => {
    let directory = `${NSHomeDirectory()}/Documents/sketch2html/overlay`;
    let fileManager = NSFileManager.defaultManager();
    if(!fileManager.fileExistsAtPath(NSString.stringWithString(directory))) {
      fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(NSString.stringWithString(directory), true, null, null);
    }
    let id = ids[i];
    let dir = `${directory}/${id}.json`;
    message.push(dir);
    let s = JSON.stringify(item, null, 2);
    NSString.stringWithString(s).writeToFile_atomically_encoding_error(NSString.stringWithString(dir), false, NSUTF8StringEncoding, null);
    dir = `${directory}/${id}.html`;
    let document = Document.getSelectedDocument();
    let layer = document.getLayerWithID(id);
    let top = util.getTop(layer);
    let pageWidth = top.frame.width;
    let pageHeight = top.frame.height;
    item.list.forEach(data => {
      let layer = document.getLayerWithID(data.id);
      expt(layer, {
        output: `${directory}`,
        'use-id-for-name': true,
        overwriting: true,
        'save-for-web': true,
      });
    });
    s = template.flatten({
      title: 'overlay',
      pageWidth,
      pageHeight,
      item,
    });
    NSString.stringWithString(s).writeToFile_atomically_encoding_error(NSString.stringWithString(dir), false, NSUTF8StringEncoding, null);
  });
  if(noAlert !== true) {
    UI.alert('Message', `JSON overlay have been outputing to:\n${message.join('\n')}`);
  }
  return true;
}

export function edges(noAlert) {
  let selection = preCheck();
  if(!selection) {
    return false;
  }
  let check = [];
  selection.forEach(item => {
    let dir = `${NSHomeDirectory()}/Documents/sketch2html/overlay/${item.id}.json`;
    let fileManager = NSFileManager.defaultManager();
    if(!fileManager.fileExistsAtPath(NSString.stringWithString(dir))) {
      check.push(dir);
    }
  });
  if(check.length) {
    UI.alert('Warn', `JSON data must be prepared by overlay command:\n${check.join('\n')}`);
    return false;
  }
  let list = [];
  let ids = [];
  selection.forEach(item => {
    ids.push(item.id);
    let dir = `${NSHomeDirectory()}/Documents/sketch2html/overlay/${item.id}.json`;
    let fileHandler = NSFileHandle.fileHandleForReadingAtPath(dir);
    let data = fileHandler.readDataToEndOfFile();
    let s = NSString.alloc().initWithData_encoding(data, NSUTF8StringEncoding);
    let json = JSON.parse(s);
    list.push(json);
  });
  let arr = list.map(item => {
    return edge(item);
  });
  let message = [];
  arr.forEach((item, i) => {
    let directory = `${NSHomeDirectory()}/Documents/sketch2html/edge`;
    let fileManager = NSFileManager.defaultManager();
    if(!fileManager.fileExistsAtPath(NSString.stringWithString(directory))) {
      fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(NSString.stringWithString(directory), true, null, null);
    }
    let id = ids[i];
    let dir = `${directory}/${id}.json`;
    message.push(dir);
    let s = JSON.stringify({
      parent: item.parent,
      list: item.list,
      finalHorizontal: item.finalHorizontal.map(h => {
        return {
          x: h.x,
          y: h.y,
        };
      }),
      finalVertical: item.finalVertical.map(v => {
        return {
          x: v.x,
          y: v.y,
        };
      }),
    }, null, 2);
    NSString.stringWithString(s).writeToFile_atomically_encoding_error(NSString.stringWithString(dir), false, NSUTF8StringEncoding, null);
    dir = `${directory}/${id}.html`;
    let document = Document.getSelectedDocument();
    let layer = document.getLayerWithID(id);
    let top = util.getTop(layer);
    let pageWidth = top.frame.width;
    let pageHeight = top.frame.height;
    s = template.edge({
      title: 'edge',
      pageWidth,
      pageHeight,
      item,
    });
    NSString.stringWithString(s).writeToFile_atomically_encoding_error(NSString.stringWithString(dir), false, NSUTF8StringEncoding, null);
  });
  if(noAlert !== true) {
    UI.alert('Message', `JSON edge have been outputing to:\n${message.join('\n')}`);
  }
  return true;
}

export function layouts(noAlert) {
  let selection = preCheck();
  if(!selection) {
    return false;
  }
  let check = [];
  selection.forEach(item => {
    let dir = `${NSHomeDirectory()}/Documents/sketch2html/edge/${item.id}.json`;
    let fileManager = NSFileManager.defaultManager();
    if(!fileManager.fileExistsAtPath(NSString.stringWithString(dir))) {
      check.push(dir);
    }
  });
  if(check.length) {
    UI.alert('Warn', `JSON data must be prepared by edge command:\n${check.join('\n')}`);
    return false;
  }
  let list = [];
  let ids = [];
  selection.forEach(item => {
    ids.push(item.id);
    let dir = `${NSHomeDirectory()}/Documents/sketch2html/edge/${item.id}.json`;
    let fileHandler = NSFileHandle.fileHandleForReadingAtPath(dir);
    let data = fileHandler.readDataToEndOfFile();
    let s = NSString.alloc().initWithData_encoding(data, NSUTF8StringEncoding);
    let json = JSON.parse(s);
    list.push(json);
  });
  let arr = list.map(item => {
    return layout(item);
  });
  let message = [];
  arr.forEach((item, i) => {
    let directory = `${NSHomeDirectory()}/Documents/sketch2html/layout`;
    let fileManager = NSFileManager.defaultManager();
    if(!fileManager.fileExistsAtPath(NSString.stringWithString(directory))) {
      fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(NSString.stringWithString(directory), true, null, null);
    }
    let id = ids[i];
    let dir = `${directory}/${id}.json`;
    message.push(dir);
    let s = JSON.stringify(item, null, 2);
    NSString.stringWithString(s).writeToFile_atomically_encoding_error(NSString.stringWithString(dir), false, NSUTF8StringEncoding, null);
  });
  if(noAlert !== true) {
    UI.alert('Message', `JSON layout have been outputing to:\n${message.join('\n')}`);
  }
  return true;
}

export function htmls(noAlert) {
  let selection = preCheck();
  if(!selection) {
    return false;
  }
  let check = [];
  selection.forEach(item => {
    let dir = `${NSHomeDirectory()}/Documents/sketch2html/layout/${item.id}.json`;
    let fileManager = NSFileManager.defaultManager();
    if(!fileManager.fileExistsAtPath(NSString.stringWithString(dir))) {
      check.push(dir);
    }
  });
  if(check.length) {
    UI.alert('Warn', `JSON data must be prepared by layout command:\n${check.join('\n')}`);
    return false;
  }
  let list = [];
  let ids = [];
  selection.forEach(item => {
    ids.push(item.id);
    let dir = `${NSHomeDirectory()}/Documents/sketch2html/layout/${item.id}.json`;
    let fileHandler = NSFileHandle.fileHandleForReadingAtPath(dir);
    let data = fileHandler.readDataToEndOfFile();
    let s = NSString.alloc().initWithData_encoding(data, NSUTF8StringEncoding);
    let json = JSON.parse(s);
    list.push(json);
  });
  let arr = list.map(item => {
    return html(item);
  });
  let message = [];
  arr.forEach((item, i) => {
    let directory = `${NSHomeDirectory()}/Documents/sketch2html/html`;
    let fileManager = NSFileManager.defaultManager();
    if(!fileManager.fileExistsAtPath(NSString.stringWithString(directory))) {
      fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(NSString.stringWithString(directory), true, null, null);
    }
    let id = ids[i];
    let dir = `${directory}/${id}.html`;
    message.push(dir);
    NSString.stringWithString(item).writeToFile_atomically_encoding_error(NSString.stringWithString(dir), false, NSUTF8StringEncoding, null);
  });
  if(noAlert !== true) {
    UI.alert('Message', `JSON html have been outputing to:\n${message.join('\n')}`);
  }
  return true;
}
