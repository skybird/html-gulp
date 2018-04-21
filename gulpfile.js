
var gulp = require('gulp'),
    os = require('os'),
    gutil = require('gulp-util'),
    less = require('gulp-less'),  // 处理less文件
    concat = require('gulp-concat'),  // 多个文件合并为一个
    gulpOpen = require('gulp-open'),
    uglify = require('gulp-uglify'),
    cssmin = require('gulp-cssmin'),
    md5 = require('gulp-md5-plus'),
    fileInclude = require('gulp-file-include'),
    clean = require('gulp-clean'),
    spriter = require('gulp-css-spriter'),
    base64 = require('gulp-css-base64'),
    connect = require('gulp-connect'),
    del = require('del'),
    browserSync = require('browser-sync').create(); // 浏览器实时刷新

var host = {
    path: 'dist/',
    port: 3000,
    html: 'index.html'
};

//mac chrome: "Google chrome",
var browser = os.platform() === 'linux' ? 'Google chrome' : (
  os.platform() === 'darwin' ? 'Google chrome' : (
  os.platform() === 'win32' ? 'chrome' : 'firefox'));
var pkg = require('./package.json');

//拷贝js到指定目录
gulp.task('copy:js', function() {
  gulp.src('src/js/**/*.js')
    .pipe(uglify({mangle:false}))  // 压缩文件
    .pipe(gulp.dest('dist/js'))
})

// 拷贝图片到指定目录
gulp.task('copy:images', function (done) {
  gulp.src(['src/images/**/*'])
    .pipe(gulp.dest('dist/images'))
    .on('end', done);
});

// 压缩合并css, css中既有自己写的.less, 也有引入第三方库的.css
gulp.task('lessmin', function (done) {
    gulp.src(['src/css/main.less', 'src/css/*.css'])
        .pipe(less())
        //这里可以加css sprite 让每一个css合并为一个雪碧图
        //.pipe(spriter({}))
        .pipe(concat('style.min.css'))
        .pipe(gulp.dest('dist/css/'))
        .on('end', done);
});

// 将js加上10位md5,并修改html中的引用路径，该动作依赖build-js
gulp.task('md5:js', ['build-js'], function (done) {
    gulp.src('dist/js/*.js')
        .pipe(md5(10, 'dist/app/*.html'))
        .pipe(gulp.dest('dist/js'))
        .on('end', done);
});

// 将css加上10位md5，并修改html中的引用路径，该动作依赖sprite
gulp.task('md5:css', ['sprite'], function (done) {
    gulp.src('dist/css/*.css')
        .pipe(md5(10, 'dist/app/*.html'))
        .pipe(gulp.dest('dist/css'))
        .on('end', done);
});

// 用于在html文件中直接include文件
gulp.task('file-include', function (done) {
    gulp.src(['src/app/*.html'])
        .pipe(fileInclude({
          prefix: '@@',
          basepath: '@file'
        }))
        .pipe(gulp.dest('dist/app'))
        .on('end', done);
        // .pipe(connect.reload())
});

// 雪碧图操作，应该先拷贝图片并压缩合并css
gulp.task('sprite', ['copy:images', 'lessmin'], function (done) {
    var timestamp = +new Date();
    gulp.src('dist/css/style.min.css')
        .pipe(spriter({
            spriteSheet: 'dist/images/spritesheet' + timestamp + '.png',
            pathToSpriteSheetFromCSS: '../images/spritesheet' + timestamp + '.png',
            spritesmithOptions: {
                padding: 10
            }
        }))
        .pipe(base64())
        .pipe(cssmin())
        .pipe(gulp.dest('dist/css'))
        .on('end', done);
});

// 删除dist目录
gulp.task('clean', function (done) {
    gulp.src(['dist'])
        .pipe(clean())
        .on('end', done);
});

// 监控指定任务
gulp.task('watch', function (done) {
    gulp.watch('src/**/*', ['lessmin', 'file-include'])
        .on('end', done);
});

// 建立服务器
gulp.task('connect', function () {
    console.log('connect------------');
    connect.server({
        root: host.path,
        port: host.port,
        livereload: true
    });
});

// 打开服务器
gulp.task('open', function (done) {
    gulp.src('')
        .pipe(gulpOpen({
            app: browser,
            uri: 'http://localhost:3000/app'
        }))
        .on('end', done);
});

// 删除dist下的所有文件
gulp.task('delete',function(cb){
    return del(['dist/*','!dist/images'],cb);
})

// 启动热更新
gulp.task('serve', ['delete'], function() {
    gulp.start('copy:images', 'copy:js', 'file-include', 'lessmin');
    browserSync.init({
        port: 2017,
        server: {
            baseDir: ['dist/app']
        }
    });
    // 监控文件变化，自动更新
    gulp.watch('src/images/**/*.*', ['copy:images']);
    gulp.watch('src/js/*.js', ['copy:js']);
    gulp.watch('src/css/*.*', ['lessmin']);
    gulp.watch('src/app/**/*.html', ['file-include']);
});

gulp.task('default',['serve']);

// 发布
// gulp.task('default', ['connect', 'file-include', 'md5:css', 'md5:js', 'open']);

// 开发
gulp.task('dev', ['connect', 'copy:images', 'copy:js', 'file-include', 'lessmin', 'watch', 'open']);

// 测试
gulp.task('test', ['clean']);
