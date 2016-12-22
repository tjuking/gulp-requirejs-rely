var gulp = require("gulp");
var runSequence = require('run-sequence');
var through2 = require("through2");
var path = require("path");

function RequireJsRely(options) {
    options = options || {};
    this.prefixTaskName = "requireJsRely"; //内部的taskName标识
    this.taskName = options.taskName || "widgetScript"; //解析完成后需要执行的任务，也可以作为实例的标识
    this.source = options.source || ["/client/widget/**/**.js"];
    this.length = 0;
    this.map = {};
    this.array = [];
    this.callback = options.callback || function (array) { //解析完成需要执行的回调
        //console.log(array)
    };
}

//收集
RequireJsRely.prototype.collect = function () {
    var _this = this;
    return through2.obj(function (file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }
        var fileStr = file.contents.toString(enc);
        var filePath = file.path;
        var ext = path.extname(filePath);
        var basename = path.basename(filePath, ext);
        _this.map[basename] = {
            analysis: false,
            dependence: []
        };
        _this.length++;
        fileStr.replace(/\b(define|require)\s*\(\s*\[([^\]]+)\]/g, function (matched, $1, $2) {
            var relyArr;
            if ($2) {
                relyArr = $2.split(/\s+|,/);
                for (var i = 0; i < relyArr.length; i++) {
                    if (relyArr[i]) {
                        relyArr[i] = relyArr[i].replace(/'|"/g, "");
                        _this.map[basename].dependence.push(path.basename(relyArr[i], path.extname(relyArr[i])));
                    }
                }
            }
        });
        return cb(null, file);
    });
};

//分析
RequireJsRely.prototype.analysis = function () {
    var analysisLength = 0;
    var _this = this;
    var loopCount = 0;
    var currentArr;
    var canAdded;
    var keyItem;
    var dependenceKey;
    var dependenceItem;
    while (analysisLength < _this.length && loopCount < _this.length) {
        currentArr = [];
        for (var key in _this.map) {
            if (_this.map.hasOwnProperty(key) && !_this.map[key].analysis) {
                keyItem = _this.map[key];
                canAdded = true;
                for (var i = 0; i < keyItem.dependence.length; i++) {
                    dependenceKey = keyItem.dependence[i];
                    dependenceItem = _this.map[dependenceKey];
                    if (dependenceItem && (!dependenceItem.analysis || currentArr.indexOf(dependenceKey) >= 0)) {
                        canAdded = false;
                        break;
                    }
                }
                if (canAdded) {
                    currentArr.push(key);
                    keyItem.analysis = true;
                    analysisLength++;
                }
            }
        }
        if (currentArr.length) {
            _this.array.push(currentArr);
        }
        loopCount++;
    }
};

//获取外部可调用的taskName
RequireJsRely.prototype.getTaskName = function (isPrivate) {
    return (isPrivate ? "_" : "") + this.prefixTaskName + "_" + this.taskName;
};

//初始化函数
RequireJsRely.prototype.init = function () {
    var _this = this;

    //解析js的依赖关系
    gulp.task(_this.getTaskName(true), function () {
        return gulp.src(_this.source)
            .pipe(_this.collect())
            .on("end", function () {
                _this.analysis();
                _this.callback.call(_this, _this.array);
            });
    });

    //执行传入的task
    gulp.task(_this.getTaskName(), [_this.getTaskName(true)], function (cb) {
        runSequence(
            [_this.taskName],
            cb
        );
    });
};

module.exports = RequireJsRely;