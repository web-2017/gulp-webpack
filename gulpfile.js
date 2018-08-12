const gulp = require('gulp');
const pump = require('pump');
const del = require('del');
const gulpZip = require('gulp-zip');
const gulpUglify = require('gulp-uglify');
const gulpLiveReload = require('gulp-livereload');
const gulpConcat = require('gulp-concat');
const gulpAutoprefixer = require('gulp-autoprefixer');
const gulpPlumber = require('gulp-plumber');
const gulpSourcemaps = require('gulp-sourcemaps');
const gulpSass = require('gulp-sass');
const gulpBabel = require('gulp-babel');
const gulpImagemin = require('gulp-imagemin');
const imageminPngquant = require('imagemin-pngquant');
const imageminJpegRecompress = require('imagemin-jpeg-recompress');
const supportedBrowsers = require('./browsers');

const autoprefixConfig = { browsers: supportedBrowsers, cascade: false };
const babelConfig = { targets: { browsers: supportedBrowsers } };

const exportPath = './public/**/*';
const srcPath = (file, watch = false) => {
  if (file === 'scss' && watch === false) return './src/scss/styles.scss';
  if (file === 'scss' && watch === true) return './src/scss/**/*.scss';
  if (file === 'js' && watch === false) return './src/js/scripts.js';
  if (file === 'js' && watch === true) return './src/js/**/*.js';
  if (file === 'img') return './src/img/**/*.{png,jpeg,jpg,svg,gif}';
  console.error('Unsupported file type entered into Gulp Task Runner for Source Path');
};

const distPath = (file) => {
  if (['css', 'js', 'img'].includes(file)) return `./public/dist/${file}`;
  console.error('Unsupported file type entered into Gulp Task Runner for Dist Path');
};

// Images
gulp.task('images', (done) => {
  pump([
    gulp.src(srcPath('img')),
    gulpImagemin([
      gulpImagemin.gifsicle(),
      gulpImagemin.jpegtran(),
      gulpImagemin.optipng(),
      gulpImagemin.svgo(),
      imageminPngquant(),
      imageminJpegRecompress(),
    ]),
    gulp.dest(distPath('img')),
  ], done);
});

// Styles (SCSS)
gulp.task('styles', (done) => {
  pump([
    gulp.src(srcPath('scss')),
    gulpPlumber(function (err) {
      console.error('Styles Task Error', err);
      this.emit('end');
    }),
    gulpSourcemaps.init({ loadMaps: true }),
    gulpAutoprefixer(autoprefixConfig),
    gulpSass({ outputStyle: 'compressed' }),
    gulpSourcemaps.write('./'),
    gulp.dest(distPath('css')),
    gulpLiveReload(),
  ], done);
});

// Scripts (JS)
gulp.task('scripts', (done) => {
  pump([
    gulp.src(srcPath('js')),
    gulpPlumber(function (err) {
      console.error('Scripts Task Error', err);
      this.emit('end');
    }),
    gulpSourcemaps.init({ loadMaps: true }),
    gulpBabel({ presets: [['env', babelConfig]] }),
    gulpConcat('scripts.js'),
    gulpUglify(),
    gulpSourcemaps.write('./'),
    gulp.dest(distPath('js')),
    gulpLiveReload(),
  ], done);
});

// Clean Images
gulp.task('cleanImages', () => {
  return del([
    distPath('img'),
  ]);
});

// Clean Styles
gulp.task('cleanStyles', () => {
  return del([
    distPath('css'),
  ]);
});

// Clean
gulp.task('cleanScripts', () => {
  return del([
    distPath('js'),
  ]);
});

// Default
gulp.task('default', gulp.series('cleanImages', 'images', 'cleanStyles', 'styles', 'cleanScripts', 'scripts', (done) => {
  done();
}));

// Watch
gulp.task('watch', gulp.series('default', (done) => {
  require('./server');
  gulpLiveReload.listen();
  gulp.watch(srcPath('img', true), gulp.series('cleanImages', 'images'));
  gulp.watch(srcPath('scss', true), gulp.series('cleanStyles', 'styles'));
  gulp.watch(srcPath('js', true), gulp.series('cleanScripts', 'scripts'));
  done();
}));

// Delete the exported zip file
gulp.task('cleanExport', () => {
  return del([
    './website.zip',
  ]);
});

// Export to a zip file
gulp.task('export', gulp.series('cleanExport', 'default', (done) => {
  pump([
    gulp.src(exportPath),
    gulpZip('./website.zip'),
    gulp.dest('./'),
  ], done);
}));
