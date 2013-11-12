Package.describe({
    summary: "Intelligent.li API Meteor Package"
});

Npm.depends({
    "winston": "~0.7.2",
    "jquery": "~1.8.3",
    "wolfy87-eventemitter": "~4.2.5",
    "heir": "~2.0.0",
    "ws": "~0.4.31"
});

Package.on_use(function (api) {
    api.add_files([
        'lib/Api.js',
        'lib/Feed.js',
        'lib/ObservableMap.js', 
        'lib/ResourceCache.js',
        'lib/Device.js',
        'lib/Logger.js',
        'lib/Resource.js',
        'lib/SampleStore.js'
        ],
        'server'); 

    if (typeof api.export !== 'undefined') {
        api.export(['iliApi'], 'server'); 
    }
});
