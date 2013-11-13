Package.describe({
    summary: "Intelligent.li API Meteor Package"
});

Npm.depends({
    "winston": "0.7.2",
    "jquery": "1.8.3",
    "wolfy87-eventemitter": "4.2.5",
    "heir": "2.0.0",
    "ws": "0.4.31"
});

Package.on_use(function (api) {
    api.add_files([
        'lib/Logger.js',
        'lib/ObservableMap.js', 
        'lib/SampleStore.js',
        'lib/Api.js',
        'lib/Resource.js',
        'lib/ResourceCache.js',
        'lib/Feed.js',
        'lib/Device.js',
        ],
        'server'); 

    api.export([
        'ili_logger',
        'ili_Resource',
        'ili_ObservableMap',
        'ili_SampleStore', 
        'ili_api',
        'ili_Resource', 
        'ili_ResourceCache', 
        'ili_Feed', 
        'ili_feedCache', 
        'ili_Device', 
        'ili_deviceCache'], 'server'); 
});
