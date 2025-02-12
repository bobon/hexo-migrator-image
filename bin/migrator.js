// Generated by CoffeeScript 1.6.3
var Downloader, Path, Source, async, colorfulLog, colors, downloadImages, extend, file, fs, imageFolder, initialize, loadSourceFile, openSourceFolder, request, sourceDir, updateSourceFile;

extend = hexo.extend;

file = require('hexo-fs');

sourceDir = hexo.source_dir;

imageFolder = "images";

request = require('request');

async = require('async');

colors = require('colors');

fs = require('fs');

Path = require('path');

Source = require('./MarkdownSource');

Downloader = require('./Downloader');

colorfulLog = function(verb, count, msg) {
  var format;
  format = "" + verb.green;
  format += count != null ? ("\t" + count + "\t").cyan : "";
  format += msg;
  return console.log(format);
};

initialize = function(next) {
  /**var exists, imageDir;
  imageDir = Path.resolve(sourceDir, imageFolder);
  colorfulLog("Check ", null, imageDir);
  exists = fs.existsSync(imageDir);
  if (!exists) {
    colorfulLog("Make ", null, imageDir);
    fs.mkdirSync(imageDir);
  }**/
  return typeof next === "function" ? next(null, null) : void 0;
};

openSourceFolder = function(nothing, next) {
  colorfulLog("Open", 1, sourceDir);
  return file.listDir(sourceDir, null, function(err, files) {
    files = files.filter(function(f) {
      return f.match(".*?\.md$");
    });
    colorfulLog("Found", files.length, "posts");
    return typeof next === "function" ? next(null, files) : void 0;
  });
};

loadSourceFile = function(files, next) {
  var makeTask, tasks;
  tasks = [];
  makeTask = function(path) {
    return function(callback) {
      var src;
      src = new Source(path);
      return src.load(callback);
    };
  };
  files.forEach(function(f) {
    var fullPath;
    fullPath = sourceDir + f;
    return tasks.push(makeTask(fullPath));
  });
  return async.parallel(tasks, function(err, results) {
    var src, sum, _i, _len;
    colorfulLog("Load", results.length, "source files");
    sum = 0;
    for (_i = 0, _len = results.length; _i < _len; _i++) {
      src = results[_i];
      sum += src.images.length;
    }
    colorfulLog("Found", sum, "images");
    return typeof next === "function" ? next(null, results) : void 0;
  });
};

downloadImages = function(srcs, next) {
  var tasks;
  tasks = [];
  //downloader = new Downloader(Path.resolve(sourceDir, imageFolder));  
  srcs.forEach(function(src) {
    var path = Path.parse(src.path);
    var downloader = new Downloader(Path.join(path.dir, path.name));
    return src.images.forEach(function(img) {
      return tasks.push(function(callback) {
        return img.download(downloader, callback);
      });
    });
  });
  colorfulLog("Save", tasks.length, "images");
  return async.parallel(tasks, function(err, results) {
    if (err != null) {
      console.log(err);
      colorfulLog("Failed ", err.length, " images");
    }
    return typeof next === "function" ? next(null, srcs) : void 0;
  });
};

updateSourceFile = function(srcs, next) {
  var tasks;
  tasks = [];
  srcs.forEach(function(src) {
    return tasks.push(function(callback) {
      return src.update(callback);
    });
  });
  return async.parallel(tasks, function(err, results) {
    var img, skipped, src, sum, _i, _j, _len, _len1, _ref;
    colorfulLog("Update", results.length, "source files");
    sum = 0;
    skipped = 0;
    for (_i = 0, _len = results.length; _i < _len; _i++) {
      src = results[_i];
      if (src.images == null) {
        continue;
      }
      _ref = src.images;
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        img = _ref[_j];
        if (img.skipped) {
          skipped++;
        } else {
          sum++;
        }
      }
    }
    colorfulLog("Update", sum, "images");
    colorfulLog("Skipped", skipped, "images");
    return typeof next === "function" ? next(null, results) : void 0;
  });
};

extend.migrator.register('image', function(args) {
  return async.waterfall([initialize, openSourceFolder, loadSourceFile, downloadImages, updateSourceFile], function(err, result) {
    console.log("Summary");
    colorfulLog("Error", (err != null ? err.length : 0), "");
    return colorfulLog("Success", (result != null ? result.length : 0), "");
  });
});
