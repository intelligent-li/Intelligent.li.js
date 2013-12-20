Package.describe({
    summary: "Intelligent.li API Meteor Package"
});

Npm.depends({
  "keep-alive-agent" : "0.0.1",
  "winston": "0.7.2",
  "wolfy87-eventemitter": "4.2.5",
  "heir": "2.0.0",
  "ws": "0.4.31",
  "json2csv": "2.2.1"
});

Package.on_use(function (api) {
  api.add_files('lib/Utils.js', ['client', 'server']);

  api.add_files([
    '.npm/package/node_modules/wolfy87-eventemitter/EventEmitter.js',
    '.npm/package/node_modules/heir/heir.js',
    ],
    ['client']); 

  api.add_files([
    'lib/Logger.js',
    'lib/ObservableMap.js', 
    'lib/SampleStore.js',
    'lib/ApiBase.js'
    ],
    ['client', 'server']); 

  api.add_files('lib/Api.js', 'server');
  api.add_files('lib/ApiMeteorClient.js', 'client');

  api.add_files([
    'lib/Resource.js',
    'lib/ResourceCache.js',
    'lib/Feed.js',
    'lib/Device.js',
    'lib/Collection.js',
    'lib/Source.js',
    ],
    ['client', 'server']); 

  api.add_files('lib/MeteorConnector.js', 'server');

  api.export(['ili'], ['client','server']); 
});
