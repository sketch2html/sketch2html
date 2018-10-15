'use strict';

import { export as expt, Document } from 'sketch/dom';
import UI from 'sketch/ui';

import preCheck from './preCheck';
import format from './format';
import flatten from './flatten';
import overlay from './overlay';
import edge from './edge';
import combine from './combine';
import util from './util';
import template from './template';

export function overall() {
  let list = [formats, flattens, overlays, edges, combines];
  for(let i = 0; i < list.length; i++) {
    let res = list[i]();
    if(!res) {
      return;
    }
  }
}

export function formats() {
  let list = format();
  if(!list) {
    return false;
  }
  let message = [];
  list.forEach(item => {
    let directory = `${NSHomeDirectory()}/Documents/sketch2code/format`;
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
  UI.alert('Message', `JSON format have been outputing to:\n${message.join('\n')}`);
  return true;
}

export function flattens() {
  let selection = preCheck();
  if(!selection) {
    return false;
  }
  let check = [];
  selection.forEach(item => {
    let dir = `${NSHomeDirectory()}/Documents/sketch2code/format/${item.id}.json`;
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
    let dir = `${NSHomeDirectory()}/Documents/sketch2code/format/${item.id}.json`;
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
    let directory = `${NSHomeDirectory()}/Documents/sketch2code/flatten`;
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
    item.forEach(data => {
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
  UI.alert('Message', `JSON flatten have been outputing to:\n${message.join('\n')}`);
  return true;
}

export function overlays() {
  let selection = preCheck();
  if(!selection) {
    return false;
  }
  let check = [];
  selection.forEach(item => {
    let dir = `${NSHomeDirectory()}/Documents/sketch2code/flatten/${item.id}.json`;
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
    let dir = `${NSHomeDirectory()}/Documents/sketch2code/flatten/${item.id}.json`;
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
    let directory = `${NSHomeDirectory()}/Documents/sketch2code/overlay`;
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
    item.forEach(data => {
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
  UI.alert('Message', `JSON overlay have been outputing to:\n${message.join('\n')}`);
  return true;
}

export function edges() {
  let selection = preCheck();
  if(!selection) {
    return false;
  }
  let check = [];
  selection.forEach(item => {
    let dir = `${NSHomeDirectory()}/Documents/sketch2code/overlay/${item.id}.json`;
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
    let dir = `${NSHomeDirectory()}/Documents/sketch2code/overlay/${item.id}.json`;
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
    let directory = `${NSHomeDirectory()}/Documents/sketch2code/edge`;
    let fileManager = NSFileManager.defaultManager();
    if(!fileManager.fileExistsAtPath(NSString.stringWithString(directory))) {
      fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(NSString.stringWithString(directory), true, null, null);
    }
    let id = ids[i];
    let dir = `${directory}/${id}.json`;
    message.push(dir);
    let s = JSON.stringify({
      center: item.center,
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
  UI.alert('Message', `JSON edge have been outputing to:\n${message.join('\n')}`);
  return true;
}

export function combines() {
  let selection = preCheck();
  if(!selection) {
    return false;
  }
  let check = [];
  selection.forEach(item => {
    let dir = `${NSHomeDirectory()}/Documents/sketch2code/edge/${item.id}.json`;
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
    let dir = `${NSHomeDirectory()}/Documents/sketch2code/edge/${item.id}.json`;
    let fileHandler = NSFileHandle.fileHandleForReadingAtPath(dir);
    let data = fileHandler.readDataToEndOfFile();
    let s = NSString.alloc().initWithData_encoding(data, NSUTF8StringEncoding);
    let json = JSON.parse(s);
    list.push(json);
  });
  let arr = list.map(item => {
    return combine(item);
  });
  let message = [];
  arr.forEach((item, i) => {
    let directory = `${NSHomeDirectory()}/Documents/sketch2code/combine`;
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
    s = template.combine({
      title: 'combine',
      pageWidth,
      pageHeight,
      item,
    });
    NSString.stringWithString(s).writeToFile_atomically_encoding_error(NSString.stringWithString(dir), false, NSUTF8StringEncoding, null);
  });
  UI.alert('Message', `JSON edge have been outputing to:\n${message.join('\n')}`);
  return true;
}
