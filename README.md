Express OAuth
=============

A client server in a OAuth environment, using ExpressJS. 

Its implemented to work with the [OpenConextApps](https://github.com/OpenConextApps/apis) OAuth 2.0 Authorization Server, but it can be extended.

To run, you must:

* Set your application properties (key, secret, etc). To do so, edit the `client_propeties.js`.
* Set your authorization server properties. To do so, edit the `oauth_properties.js`.
* Start your JS application server calling: `node server.js`.
    
For implementation details, read the comments on the source code.
