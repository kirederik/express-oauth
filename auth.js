/** 
 * @author Derik Evangelista - derik@simepar.br
 * @date 13 fev 2014                              
 */

/**
 * Provides the base Auth class
 * 
 * @module oauth
 * @main oauth
 */

"use strict"
var client = require('./client_properties');
var oauth = require('./oauth_properties');
var request = require('request');
var express = require('express');

var app = module.exports = express();
app.use(express.json());
app.use(express.urlencoded());
app.use(express.cookieParser());
app.use(express.cookieSession({key: 'auth', secret: " i like potatoes "}));

/**
 * Returns a response with all the headers extended
 *
 * @method setHeaders
 * @param {Object} origin The response where the headers must be setted
 * @param {Object} toExtend The response where the headers must be copied
 * @return {Object} A copy of origin plus the headers of toExtend
 */
var setHeaders = function(origin, toExtend) {
  var key;
  var response = origin;
  for (key in toExtend.headers) {
    response.setHeader(key, toExtend.headers[key]);
  }
  return response;
}

/**
 * Returns true in case of user already auth
 */
var authUser = function(req) {
  return req.hasOwnProperty("session") && req.session.hasOwnProperty("access_token");
}

/*
 * Authentication endpoint
 * Redirects the user to the oauthURL that will redirect again to
 *   /authComplete
 */
app.get("/auth", function(req, res) {
  if (!authUser(req)) {
    req.session.client = new client.Client(client.client);
    var url = oauth.oauthURL(req.session.client.client_id, req.session.client.redirect_uri);
    res.setHeader('Location', url);
    console.log("Redirecting to", url);
    res.redirect(url);
  } else {
    res.redirect(req.session.client.success_redirect);
  }
});

app.post("/auth", function(req, res) {
  if (!req.session.client) {
    req.session.client = new client.Client(req.body);
    res.setHeader('Location', oauth.oauthURL(req.session.client.client_id));
    res.send(oauth.oauthURL(req.session.client.client_id, req.session.client.redirect_uri));
  } else {
    res.redirect(req.session.client.success_redirect);
  }
});

/*
 * Authentication complete endpoint.
 * When the auth complete, it will redirect to this url, 
 *   where we will get the access_token
 */
app.get("/authComplete", function(req, res) {
  /* If, in this current session, no user has been authenticated */
  if (!authUser(req)) {
    
    // Get the code from query
    var code = req.query.code;

    /* 
     * Set the post body
     * The body must contain:
     *   - The grant_type (defaut "authorization_code")
     *   - The code sent by the server on the previous request
     *   - The redirect_uri, where the oauth server should redirect with the
     *       access_token. In fact it will not be used, as we will 
     *       do a request to the ouath server and will not follow the redirect.
     *       If the request succeeds, it will redirect to /auth/token
     */
    console.log(req.session.client.redirect_uri);
    var formData = {
      grant_type: "authorization_code"
      , code: code
      , redirect_uri: req.session.client.redirect_uri
    };

    /* 
     * The request headers
     * The header must contain:
     *   - 'Authorization: Basic {credentials}'. The credentials have the form
     *        'client_id:client_secret', encoded in Base64.
     */
    var headers = {
      'Authorization': "Basic " + req.session.client.credentials
    };

    /* 
     * The request options
     * The url used is the url that retrieve the token info
     */
    var options = {
      url: oauth.token_url
      , method: 'POST'
      , headers: headers
      , form: formData
    };

    /* Do the request */
    request(options, function(error, response, body) {

      // Extend the res headers to match the response headers
      res = setHeaders(res, response);
      
      console.log(body, response.statusCode);
      
      if (response.statusCode == 200) {
        // Everything is fine! Continue

        /*
         * Enable the auth variable, to avoid send another request
         *   in case of revisiting this url
         */
        app.enable("auth");

        /* 
         * Parse the oauth server response body, that contains the
         *   access_token and store it in the session 
         */
        var jbody = JSON.parse(body);
        req.session.access_token = jbody.access_token;

        // Redirect to /auth/token
        // res.redirect("/auth/token");
        res.setHeader('Location', req.session.client.success_redirect);
        res.send(301, body)
      } else {
        // Something fails. Oh noes :(

        // Clean session cookies
        req.session = null;
        // Send the oauth server response
        res.setHeader('Reason', body);
        res.setHeader('Location', req.session.client.fail_redirect)
        res.send(body);
      }
    });
  } else {
    // User already authenticated, just response with the user info
    // res.send(req.session.access_token);
    res.setHeader('Location', req.session.client.success_redirect);
    res.send(301);
    // res.redirect("/auth/token")
  }
});

/*
 * Token Info endpoint
 * Returns the user informations
 */
app.get("/auth/token", function(req, res) {
  if (!authUser(req)) { res.redirect("/auth"); }
  else {
    var headers = {}, key;
    for (key in req.headers) {
      headers[key] = req.headers[key];
    };

    /*
     * Authorization Header.
     * The access_token are setted on /authComplete
     */
    headers['Authorization'] = "Bearer " + req.session.access_token;

    var options = {
      url: req.session.client.resource_server + "/auth?access_token=" + req.session.access_token ,
      method: req.method,
      headers: headers
    };

    /* Do the request and send back the response */
    request(options, function(error, response, body) {
      res = setHeaders(res, response);
      res.send(body);
    });
  }
});

/* Logout Endpoint */
app.get("/auth/logout", function(req, res) {
  // req.session.client = null;
  // req.session.access_token = null;
  req.session = null;
  // console.log(req.session);
  res.send({message: "Logged out"});
});

/*
 * Intercepts all the requests and resend it with proper headers 
 *   to the proper resource server.
 */
app.all("*", function(req, res) {
    // Logging purpouse
  if (!authUser(req)) { res.send(401) }
  else {
    console.log("%s URL %s intercepted.", req.method, req.url);

    /* 
     * Create a header object, that contains all the headers from the original
     *  request, plus the Authroziation.
     */
    var headers = {}, key;
    for (key in req.headers) {
      headers[key] = req.headers[key];
    };

    /*
     * Authorization Header.
     * The access_token are setted on /authComplete
     */
    if (req.session.hasOwnProperty("access_token")) 
      headers['Authorization'] = "Bearer " + req.session.access_token;

    /*
     * The request options
     * The url base is changed to the proper resource server, 
     *   followed by the request url.
     * Ex: Original request to http://this.server.com/users
     *     Resource server: http://other.server.com
     *     Resulted URL: http://other.server.com/users
     */
    var options = {
      url: req.session.client.resource_server + req.url,
      method: req.method,
      headers: headers
    };
    // console.log(req.body);
    if (req.hasOwnProperty("body")) {
      options.json = req.body;
    }

    /* Do the request and send back the response */
    request(options, function(error, response, body) {
      res = setHeaders(res, response);
      res.send(body);
    });
  }
});

