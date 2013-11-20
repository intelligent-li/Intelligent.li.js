/*
 * Utils.js Copyright Percepscion Pty. Ltd.
 */
(function(root) {
  "use strict";
  
  (typeof root.ili === 'undefined') && (root.ili = new Object());
  
  //
  // Import external dependencies, using node, meteor or direct to
  // client
  function iliImportPackage(root, name, packageName) {
    if (typeof Meteor === 'undefined') {
      return require(packageName);
    } else {
      if (Meteor.isServer) {
        return Npm.require(packageName);
      }
    }
    return root[name];
  }
  root.ili.importPackage = iliImportPackage;

  function iliImport(root, name) {
    if (typeof Meteor === 'undefined') {
      var tmp = require("./" + name + ".js").ili;
    } 
    return root.ili[name];
  }
  root.ili.import = iliImport;

  // in node, require exists and does it's job, in Meteor or raw javascript
  // clients we create a fake require function that simply returns the root,
  // which should in turn contain everything we need. Fortunately in Meteor and
  // raw javascript we can ensure that utils is loaded before any other library
  // class allowing the other classes to use 'require' to get the import
  // functions
  function fakeRequire(name) {
    return root;
  }
  (typeof require === 'undefined') && (root.require = fakeRequire);

  if (typeof Meteor === 'undefined') {
  } else {
    ili = root.ili;
  }
})(this);
