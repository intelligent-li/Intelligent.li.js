
(function(root) {
    "use strict";
  //
  // Import external dependencies, using node, metoer or direct to 
  // client
  function ili_importPackage(root, name, packageName) {
    if (typeof Meteor === 'undefined') {
      return require(packageName);
    } else {
      if (Meteor.isServer) {
        return Npm.require(packageName);
      }
    }
    return root[name];
  }
  root.ili_importPackage = ili_importPackage;

  function ili_import(root, name) {
    if (typeof Meteor === 'undefined') {
      return require("./" + name + ".js");
    } 
    return root["ili_" + name];
  }
  root.ili_import = ili_import;
})(this);

