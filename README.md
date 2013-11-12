#Intelligent.li.js

Intelligent.li.js is Javascript library that makes working with Intelligent.li in Javascript simple. The library is intended to be used as a [NodeJs](http://nodejs.org/) package or within the browser using an Intelligent.li proxy server such as the [flask-quickstart](https://github.com/intelligent-li/flask-quickstart).

**Note current version only works as a NodeJs package, we are working on a browser version **

The library takes care of interfacing with the Intelligent.li API by providing a reactive wrapper library for the Intelligent.li resources. 


##Usage 

The Intelligent.li.js library maintains a 'cache' of a resource's meta data, tags and samples (for feeds) etc. A single instance of the cache is created for each unique resource and shared across the application. Changes to the cached resource are notified via event emitters registered on the resource. 

Let's walk though an example. First thing to do is get a reference to the Inteligent.li library:

    var ili = require('intelligent.li.js');
    
then you'll need to setup the certificates so that you can access your scope:

    var clientPem = Assets.getText('client.pem');
    var keyPem = Assets.getText('key.pem');
    var caPem = Assets.getText('ca.crt');

    ili.api.httpOptions = { key: keyPem, cert: clientPem, ca: caPem };
       
*TODO: This is how to do it in Meteor not native nodejs*

now grab a feed:
    
    var myFeed = ili.feedCache.get("639bae9ac6b3e1a84cebb7b403297b79");
    
This returns a singleton instance of the feed resource, i.e. the instance is shared across the application. We can now get the tags on the feed by:

    myFeed.loadTags(function() { 
        if (result) {
            console.log(myFeed.tags);
        } else {
            console.log("error loading tags for feed" + myFeed.id);
        } 
    });

or get the feed's attributes by:
    
     myFeed.loadAttributes(function() { 
        if (result) {
            console.log(myFeed.attributes);
        } else {
            console.log("error loading attributes for feed" + myFeed.id);
        } 
    });
    
or its location by:
    
     myFeed.loadLocation(function() { 
        if (result) {
            console.log(myFeed.location);
        } else {
            console.log("error loading location for feed" + myFeed.id);
        } 
    });
    
    
or if you want to load everything:

    myFeed.load(function() { 
        if (result) {
            console.log(myFeed.tags);
            console.log(myFeed.attributes);
            console.log(myFeed.location);
        } else {
            console.log("error loading meta data for feed" + myFeed.id);
        } 
    });

other resources are also accessed in the same way, just get them from the appropriate cache:

    var myDevice = ili.deviceCache.get("4d51dc7e53d9289cbe396e6fced57f4e");

if you want your own instance for some reason, create it with new

    var myPrivateFeed = new ili.Feed("4d51dc7e53d9289cbe396e6fced57f4e");
    
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

    myFeed.tags.onchanged(function() {
        console.log("tags have changed");
    }); 
    
and then each time the member changes you'll get told about it:
    
    myFeed.loadTags();

this can be used for the `tags`, `location` and `attributes` members of a resource. If you prefer more descriptive function names you can also use

    myFeed.tags.addChangedObserver(function() {
        console.log("tags have changed");
    }); 

which behaves identically to the `unchanged` function. 

### Getting samples

To access samples for a feed, you'll need to setup the webSocket connection to Intelligent.li. First thing we need to do is override the `createWs` factory function on the API to include your certificates and control the web socket class that is used. 

    WebSocket = require(ws);
    var clientPem = Assets.getText('client.pem');
    var keyPem = Assets.getText('key.pem');
    var caPem = Assets.getText('ca.crt');
    
    ili.api.createWs = function(url){
        return new WebSocket(url, { key: keyPem, cert: clientPem, ca: caPem });
    })

This example uses the nodejs package `ws` web socket class and adds the certificates for accessing Intelligent.li. Once the api is configured you'll need to start the web socket connection.

    ili.api.start();
    
This will connect the web socket to Intelligent.li and then maintain it ongoing, i.e. it reconnects on failures etc. To stop the web socket, without restart:

    ili.api.stop(false);
    
Whilst the web socket is connected, the api maintains all feed subscriptions for you automatically. All feeds that have observers on the samples map will be subscribed to, so to subscribe to samples for a feed simply register an `onchanged` observer to the samples map.
    
    myFeed.samples.onchanged(function(){
        console.log("new sample: " + myFeed.samples.lastValue);
    };   

the sample store is a special ObservableMap that maintains some additional information about the set of samples that are loaded in the members `lastValue`, `lastTime`, `firstValue`, `firstTime`, `max` and `min`. There are also helper functions for getting samples using index and alignment:    
    
    var index = 1234, alignment = 5;
    myFeed.samples.get(index, alignment);
    
*not implemented yet*

to stop the subscription to a feed, remove all of the observers from it:

    myFeed.samples.removeChangedObservers();
*not implemented yet*

### Searching for resources
coming soon…

    
