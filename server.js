"use strict"

/*
 * @author Derik Evangelista - derik@simepar.br
 * @date 13 feb 2014
 */

/**
 * Provides the main server
 *
 * How this server works?
 * +--------+                               +---------+                               +---------------+ 
 * |        |--(A)- Authorization Request ->|         |--(B)- Authorization Request ->|   Resource    |
 * |        |                               |         |                               |     Owner     |
 * |        |                               |         |<-(C)-- Authorization Grant ---|               |
 * |        |                               |         |                               +---------------+
 * |        |                               |         |
 * |        |                               |         |                               +---------------+
 * |        |                               | Express |--(D)-- Authorization Grant -->| Authorization |
 * | Client |                               | Server  |                               |     Server    |
 * |        |<-(F)--- Token (user) Info ----| (this)  |<-(E)----- Access Token -------|               |
 * |        |                               |         |                               +---------------+
 * |        |                               |         |
 * |        |--(G)-- Request to Resource -->|         |                               +---------------+
 * |        |                               |         |--(H)----- Access Token ------>|    Resource   |
 * |        |                               |         |                               |     Server    |
 * |        |<-(J)--- Protected Resource ---|         |<-(I)--- Protected Resource ---|               |
 * +--------+                               +---------+                               +---------------+
 *
 * Note: For illustration purpose the Resource Owner and the Authorization Server are different entities.
 *       In our implementation, they are the same entity.
 * (A) The client app redirect the request to the Express Oauth Server (a.k.a. this server).
 *       The Client credentials are obtained from the client_properties.js file.
 *     See client_properties.js for details.
 * (B) The Express Server redirect the request to the authorization grant endpoint. A login form is showed
 *       to the client. The request contains, as query parameters, the client_id and a redirect_uri.
 * (C) The user succeeds on login. The authorization grant is returned to the Express Server, redirecting
 *       to the redirect_uri passed in B. The response contains, as query parameter, an authorization code.
 * (D) The Express Server sends a POST request to the Authorization Server. The request body contains the
 *       code acquired in C.
 * (E) The Authorization Server answers with the access_token. The Express Server sets a access_token pro-
 *       perty. It will be used on future requests to the Resource Server.
 * (F) The Express Server do another request to the Resource Owner, to get the token (user) info. The
 *       request contains, as query param, the access_token obtained in  E. The token info is returned to
 *       the client.
 * ---------------------
 * In (F), the authentication phase ends. G-I illustrate a call to the Resource Server.
 * (G) The client request the resource to the Express Server.
 * (H) The Express Server send a request to the Resource Server, passing the stored access_token in the
 *        request header. Note that this request is send based on the resource server name defined on A.
 * (I) The Resource Server validates the access_token and send the resource back to the Express Server.
 * (J) The Express Server answers G with the protected data.
 *
 * @module express_oauth_client
 */


var express = require('express');
var app = express();
var auth = require("./auth");
var path = require('path');

var app = express();
app.use(express.cookieParser());
app.use(express.cookieSession({key: 'auth', secret: " i like potatoes "}));
app.use("/app", express.static(path.join(__dirname, 'app'))); //  Does not parse /app 

//CORS middleware
var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  next();
}

app.use(allowCrossDomain);

/* Route for logging */
app.all("*", function(request, response, next) {
  console.log("------------------")
  console.log("[",  request.method, "]", request.url);
  next();
});

/* Use the routes defined on auth module */
app.use(auth);

/* Port where the server will listen */
var port = 9898;

app.listen(port);
console.log('Listening on port', port);
