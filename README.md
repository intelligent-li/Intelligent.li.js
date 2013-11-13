#Intelligent.li.js

Intelligent.li.js is Javascript library that makes working with Intelligent.li in Javascript simple. The library is intended to be used as a [NodeJs](http://nodejs.org/) package, a [Meteor](http://www.meteor.com/) smart package or within the browser via an Intelligent.li proxy server such as the [flask-quickstart](https://github.com/intelligent-li/flask-quickstart).

*Note current version is only tested as a Meteor smart package, we are working on node and browser versions*

The library takes care of interfacing with the Intelligent.li API by providing a reactive wrapper library for the Intelligent.li resources. 

##Installation

Before we are able to start using the API we'll need to install it with a package manager. On node we use `npm` on meteor we use `mrt` (meteorite)

**NodeJs**

    $ npm install --save git+ssh://git@github.com:intelligent-li/Intelligent.li.js.git
    
**Meteor** 

Add the npm and Intelligent.li.js packages to your smart.json
    
    {
      "packages": {
        "npm": {},
        "intelligent.li": {
          "git": "git@github.com:intelligent-li/Intelligent.li.js.git"
        }
      }
    }
    
Then run the following to download and install the packages. 

    $ mrt list
    
##Usage    
 
The Intelligent.li.js library maintains a 'cache' of a resource's attributes, tags, location and samples (for feeds) etc. A single instance of the cache is created for each unique resource and shared across the application. Changes to the cached resource are notified via event emitters registered on the resource. 

Let's walk though an example, first thing to do is get a reference to the Inteligent.li library:

**NodeJs**

    var ili_api = require('intelligent.li.js').instance;
    var ili_feedCache = ??
    var ili_Feed = ??
    var ili_deviceCache = ??
    var ili_Device = ??
    
**Meteor** 

In meteor the api variables are available already as:

    ili_api 
    ili_feedCache
    ili_Feed
    ili_deviceCache
    ili_Device    
        
Now, you'll need to setup your certificates so that you can access your scope:

**NodeJs**

Put your key, certificates in the root of your NodeJs application and then:
    
    ili_api.certs = { 
        cert: fs.readFileSync('client.pem'), 
        key: fs.readFileSync('key.pem'), 
        ca: fs.readFileSync('intelligent.li-ca.crt')
    };
  
**Meteor**

Put your key, certificate and `intelligent.li-ca.crt` into the `private` folder.

    ili_api.certs = { 
        cert: Assets.getText('client.pem'), 
        key: Assets.getText('key.pem'), 
        ca: Assets.getText('intelligent.li-ca.crt')
    };
       
you can now grab a feed:
    
    var myFeed = ili_feedCache.get("639bae9ac6b3e1a84cebb7b403297b79");
    
This returns a singleton instance of the feed resource, i.e. the instance is shared across your application. We can now get the tags on the feed by:

    myFeed.loadTags(function(result) { 
        if (result) {
            console.log(myFeed.tags);
        } else {
            console.log("error loading tags for feed" + myFeed.id);
        } 
    });

or get the feed's attributes by:
    
     myFeed.loadAttributes(function(result) { 
        if (result) {
            console.log(myFeed.attributes);
        } else {
            console.log("error loading attributes for feed" + myFeed.id);
        } 
    });
    
or its location by:
    
     myFeed.loadLocation(function(result) { 
        if (result) {
            console.log(myFeed.location);
        } else {
            console.log("error loading location for feed" + myFeed.id);
        } 
    });
    
    
or if you want to load everything:

    myFeed.load(function(result) { 
        if (result) {
            console.log(myFeed.tags);
            console.log(myFeed.attributes);
            console.log(myFeed.location);
        } else {
            console.log("error loading meta data for feed" + myFeed.id);
        } 
    });

other resources are also accessed in the same way, just get them from the appropriate cache:

    var myDevice = ili_deviceCache.get("4d51dc7e53d9289cbe396e6fced57f4e");

if you want your own instance for some reason, create it with `new`

    var myPrivateFeed = new ili_Feed("4d51dc7e53d9289cbe396e6fced57f4e");
    
you can then load the meta data without effecting the global instance,
         
    myPrivateFeed.load();

### Using the ObservableMap

Data is stored on resources in an ObservableMap, this is an associative array that has convenience methods for adding and removing elements, and also emits events when it is changed (see [emitters][emitters]). 

To get a tag from a feed:
    
    myFeed.tags.get("tag name");
        
to get all tag names for a feed:
        
    for (var k in myFeed.tags.keys() {
        console.log(k + "=" + myFeed.tags.get(key));
    }

to get all tag values for a feed:
            
    for (var v in myFeed.tags.value() {
        console.log(v);
    }
        
or if you want to iterate over each element you could:

    myFeed.tags.each(function(k ,v) { 
        console.log(k + "=" + v);
    });        
        
You can clear the tags:

    myFeed.tags.clear();
    
and reload them:
    
    myFeed.loadTags();
    
or remove a specific tag:

    myFeed.tags.remove("tag name");
    
*however, in the current version you can save the changes back to Intelligent.li, this is planned for the future.*    
    
To determine if the map has a particular key:

    myFeed.tags.has("tag name");
         
Of course this works on all ObservableMaps, such as tags, location and attributes on all resources, feeds, devices etc.
        
[emitters]: 
### Using Emitters
The Intelligent.li library uses NodeJs style event emitters to notify the application about changes to a resource. Simply register an observer function to the `onchanged` event on the resource you want to watch:

    var observer = function() {
        console.log("tags have changed");
    };
    
    myFeed.tags.onchanged(observer); 
    
and then each time the member changes you'll get told about it:
    
    myFeed.loadTags();

this can be used for the `tags`, `location` and `attributes` members of a resource. If you prefer more descriptive function names you can also use
    
    myFeed.tags.addChangedObser(observer); 

which behaves identically to the `onchanged` function. You can remove an observer by

    myFeed.tags.removeChangedObserver(observer);
    
### Querying

Use the `query` function on the resource's cache to find the resources that match your criteria. Onbce the query is complete the supplied handler function is called passing a `result` object which is an instance of an `ObservableMap`. The following example finds all feeds in the scope:

    var resultHandler = function(result) {
       result.each(function(k, v) {
           console.log("key: " + k + " value: " + v);
       });
    }
    ili_feedCache.query("*", resultHandler);
    
*TODO more query examples*

### Getting samples

To access samples for a feed, you'll need to setup the webSocket connection to Intelligent.li. To do this call `start` passing a factory function the returns the web socket instance you want intelligent.li to use. 

    WebSocket = require('ws');
    var clientPem = Assets.getText('client.pem');
    var keyPem = Assets.getText('key.pem');
    var caPem = Assets.getText('ca.crt');
    
    ili_api.start(function(uri) {
        return new WebSocket(uri, ili_api.certs);
    });

this example uses the nodejs package `ws` web socket class and adds the certificates for accessing Intelligent.li. This will connect the web socket to Intelligent.li and maintain it ongoing, i.e. it reconnects on failures etc. To stop the web socket, without restart:

    ili_api.stop(false);
    
The api maintains all feed subscriptions for you automatically. All feeds that have observers on the samples map will be subscribed to; so to subscribe to samples for a feed simply register an `onchanged` observer to the samples map.
    
    var observer = function(){
        console.log("new sample: " + myFeed.samples.lastValue);
    };
    myFeed.samples.onchanged(observer);   

the sample store is a special `ObservableMap` that maintains some additional information about the set of samples that are loaded in the members `lastValue`, `lastTime`, `firstValue`, `firstTime`, `max` and `min`. Remember that these members represent the state of the feed in the cache, not its overall state, e.g. `min` is the minimum sample value in the cache, not in Intelligent.li. There are also helper functions for getting samples using index and alignment:    
    
    var index = 1234, alignment = 5;
    myFeed.samples.get(index, alignment);
    
*not implemented yet*

to stop the subscription to a feed, remove your observer:

    myFeed.samples.removeChangedObserver(observer);


    
