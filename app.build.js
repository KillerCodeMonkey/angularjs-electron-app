({
    name: '../almond',
    baseUrl: 'app/',
    mainConfigFile: 'app/main.js',
    include: ['boot'],
    out: 'build/app/app.min.js',
    optimize: 'uglify2'
});
