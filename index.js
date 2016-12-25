var through2 = require("through2");
var path = require("path");

function RequireJsRely() {
    this.length = 0;
    this.map = {};
    this.array = [];
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

module.exports = RequireJsRely;