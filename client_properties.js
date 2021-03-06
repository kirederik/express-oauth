"use strict"

/** 
 * @author Derik Evangelista - derik@simepar.br
 * @date 13 fev 2014                              
 */

/**
 * Provides the Client class
 * 
 * @module client
 * @main client
 */

var base64 = require("./base64");
var client = {
    client_id: "sinalmet-app"
  , secret: "27c1f3d9-4454-4681-9e85-9602eb0f5794"
  , resource_server: "http://localhost:9091"
  , redirect_uri: "http://localhost:9898/authComplete"
  , success_redirect: "http://localhost:9898/app/#/logged"
  , fail_redirect: "http://localhost:9898/app/#/login"
};

exports.client = client;

/** 
 * An OAUTH Client
 * 
 * @class Client
 * @constructor
 */
var Client = function(client) {
  return {
    /**
     * The client id, generated by the oauth server
     *
     * @attribute client_id
     * @required
     * @type String
     */
    client_id: client.client_id
    /**
     * The client credentials. This attribute can be the client secret -- that, together
     *   with the client id, will be encoded in Base64 in the form `id:secret` --
     *   or the client credentials already encoded.
     *
     * @attribute credentials
     * @required
     * @type String | Base64 Encoded String
     */
    , credentials: (function(cl) {
      var credentials = null;
      if (typeof cl.credentials !== 'undefined') {
        // The credentials are already passed as parameter to the constructor
        credentials = cl.credentials;
      } else if (typeof cl.secret !== 'undefined') {
        // The secret was passed as param. Encode the credentials.
        credentials = base64.encode(cl.client_id + ":" + cl.secret);
      }
      return credentials;
    })(client)
    /**
     * The Resource Server name. Can be an array of names.
     *
     * @attribute resource_server
     * @type String | Array[String]
     */
    , resource_server: client.resource_server
    /**
     * Redirect URL on user app
     *
     * @attribute redirect_uri
     * @type String
     */
    , redirect_uri: client.redirect_uri
    , success_redirect: client.success_redirect
    , fail_redirect: client.fail_redirect
  }
};

exports.Client = Client;
