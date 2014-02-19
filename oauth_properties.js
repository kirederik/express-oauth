/*
 * @author Derik Evangelista - derik@simepar.br
 * @date 13 feb 2014
 */

"use strict"

/*
 * Provides the OAUTH server information
 *
 * @module oauth.properties
 */

/*
 * Authorization Grant URL Endpoint. Where the user do the login (the formn)
 *   and where the authorization grant is provided.
 * 
 * @final
 * @property authorizationUrl
 * @type String
 * @default http://localhost:8080/oauth2/authorize
 */
var authorizationUrl = "http://localhost:8080/oauth2/authorize";

/*
 * Redirect URL endpoint. Used when the user
 *  has succeed on login.
 * 
 * @property redirectUrl
 * @type String
 * @default http://localhost:9898/authComplete
 */
var redirectUrl = "http://localhost:9898/authComplete";
exports.redirect_url = redirectUrl;

/*
 * Token URL endpoint. Used to retrieve the access_token
 * 
 * @property tokenUrl
 * @type String
 * @default http://localhost:8080/oauth2/token
 */
var tokenUrl = "http://localhost:8080/oauth2/token";
exports.token_url = tokenUrl;

/*
 * Token Info URL endpoint. Used to retrieve the user information
 * 
 * @property token_info_url
 * @type String
 * @default http://localhost:8080/v1/tokeninfo
 */
 // Not used!
// var tokenInfoUrl = "http://localhost:8080/v1/tokeninfo";
// exports.token_info_url = tokenInfoUrl;


/*
 * Returns the url used to login
 *
 * @method oauthURL
 * @static
 * @param {String} client_id The client ID
 * @return The authorizationURL plus the login parameters.
 */
exports.oauthURL = function(client_id, url) {
  return authorizationUrl + "?" +
    "response_type=code&" +
    "client_id=" + client_id + "&" +
    "redirect_uri=" + url + "&" +
    "scope=read";
};

