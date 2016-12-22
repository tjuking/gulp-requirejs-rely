# gulp-requirejs-rely

gulp插件——requirejs依赖关系的解析编译

###使用示例

```javascript
    
    var gulp = require("gulp");
    var runSequence = require("run-sequence");
    var RequireJsRely = require("gulp-requirejs-rely");
    
    var widgetJsRely = new RequireJsRely({
        taskName: "widgetScript",
        source: "client/widget/**/**.js",
        callback: function (dependenceArray) {
            //console.log(dependenceArray);
            var taskArray = [];
            for (var i = 0; i < dependenceArray.length; i++) {
                gulp.task("widgetScript" + i, function () {
                    return gulp.src(getRelySource(dependenceArray[i]))
                        .pipe(...);
                });
                taskArray.push(["widgetScript" + i]);
            }
            gulp.task("widgetScript", function (cb) {
                taskArray.push(cb);
                runSequence.apply(undefined, taskArray);
            });
    
            function getRelySource(sourceArray) {
                var result = [];
                for (var i = 0; i < sourceArray.length; i++) {
                    result.push("client/widget/**/" + sourceArray[i] + ".js");
                }
                return result;
            }
        }
    });
    widgetJsRely.init();
    
    gulp("script", function (cb) {
        runSequence(
            ["baseScript"],
            [widgetJsRely.getTaskName()], //解析完widgetScript的依赖关系后，然后再运行widgetScript的任务
            ["pageScript"],
            cb
        );
    });
    
```
