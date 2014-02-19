"use strict"

/** 
 * @author Derik Evangelista - derik@simepar.br
 * @date 13 fev 2014                              
 */

/**
 * Provides the resource server list
 * 
 * @module resource
 */

var base64 = require("./base64");

/**
 * A Resource Server.
 *
 * @class Resource
 * @constructur
 */
var Resource = function(r) {
  return {
    /**
     * The Resource Server Key. Obtained from Oauth Server
     *
     * @attribute key
     * @required
     * @type String
     */
    key: r.key
    /**
     * The Resource Server Secret. Obtained from Oauth Server
     *
     * @attribute secret
     * @required
     * @type String
     */
    , secret: r.secret
    /**
     * The base url from the server.
     *
     * @attribute url
     * @required
     * @type String
     */
    , uri: r.uri
    /**
     * The Server credentials. Base64 encoded version of 
     * `key:secret` 
     *
     * @attribute credentials
     * @required
     * @type Bas64 Encoded String
     */
    , credentials: (function(r){
      return "Basic " + base64.encode(r.key + ":" + r.secret);
    })(r)
  }
}

/* Server list */
var servers = {
  'sinalmet-server': new Resource({
    key: "eeca2776-e603-4bec-9e1a-e6fb5f5a5b4d"
    , secret: "3922f4bc-1df6-406d-af27-66b5055d1b95"
    , uri: "http://localhost:9091"
  })
};

/**
 * Returns the respective resource server
 * 
 * @method getByName
 * @param {String} name The resource sever name
 * @return The Resource Server
 */
exports.getByName = function(name) {
  return servers[name];
}