# gulp-requirejs-rely

gulp插件 —— requirejs依赖关系的解析编译

如果脚本文件有添加md戳，直接编译会导致引用失败，因此可以通过引入gulp-requirejs-rely插件来完成解析脚本的依赖关系，并实现分步编译。

###使用示例

以下为目录结构示例：

```

    -- client
    ---- static
    ------ page
    -------- index
    ---------- index.js (依赖log.js、util.js、dialog.js)
    ------ base
    -------- js
    ---------- require.js (无依赖)
    ---------- jquery.js (无依赖)
    ---- widget
    ------ log
    -------- log.js (无依赖)
    ------ util
    -------- util.js (依赖log.js)
    ------ dialog
    -------- dialog.js (依赖util.js)
    
```

gulpfile.js中的代码处理：

```javascript
    
    var gulp = require("gulp");
    var runSequence = require("run-sequence");
    var RequireJsRely = require("gulp-requirejs-rely");

    var jsRely = new RequireJsRely();

    gulp.task("_script", function () {
        return gulp.src("client/**/**.js")
            .pipe(jsRely.collect())
            /* 将生成依赖关系表jsRelay.map
             {
                 "index": ["log", "util", "dialog"],
                 "require": [],
                 "jquery": [],
                 "log": []
                 "util": ["log"]
                 "dialog": ["util"]
             }
             */
            .on("end", function () {
                var taskArray = [];
                var dependenceArray;
                var i;
                jsRely.analysis();
                /* 将生成依赖层次关系jsRelay.array
                 [
                     ["require", "jquery", "log"],
                     ["util"],
                     ["dialog"],
                     ["index"]
                 ]
                 */
                dependenceArray = jsRely.array;
                for (i = 0; i < dependenceArray.length; i++) {
                    gulp.task("script" + i, function () {
                        return gulp.src(getRelySource(dependenceArray[i]))
                            .pipe();
                    });
                    taskArray.push(["script" + i]);
                }
                gulp.task("relyScript", function (cb) {
                    taskArray.push(cb);
                    runSequence.apply(undefined, taskArray);
                });

                function getRelySource(sourceArray) {
                    var result = [];
                    for (var i = 0; i < sourceArray.length; i++) {
                        result.push("client/**/" + sourceArray[i] + ".js");
                    }
                    return result;
                }
            });
    });

    gulp("script", ["_script"], function (cb) {
        runSequence(
            ["relyScript"],
            cb
        );
    });
    
```
