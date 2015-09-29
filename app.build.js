({
    name: '../almond',
    baseUrl: 'app/',
    mainConfigFile: 'app/main.js',
    include: ['boot', 'dicts/de'],
    out: 'build/app/app.min.js',
    optimize: 'uglify2'
});
