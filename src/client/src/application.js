goog.provide('__bootstrap');
goog.provide('closure_boilerplate.Application');

goog.require('closure_boilerplate.ServiceProvider');
goog.require('closure_boilerplate.urls');

goog.require('goog.dom');
goog.require('goog.net.XhrIo');
goog.require('goog.structs.Map');

goog.require('relief.auth.PublicAuthManager');
goog.require('relief.cache.Cache');
goog.require('relief.nav.NavManager');
goog.require('relief.rpc.RPCService');
goog.require('relief.utils');



/**
 * Main class for the application
 *
 * @constructor
 */
closure_boilerplate.Application = function() {

  var eventBus = new goog.events.EventTarget();

  var cache;
  /**
   * The application's cache.
   *
   * @type {relief.cache.Cache}
   * @private
   */
  this.cache_ = cache = new relief.cache.Cache();

  /**
   * Headers to be used for all RPC requests.
   */
  var headers = new goog.structs.Map({
    'Content-Type': 'application/json'
  });

  var rpc;
  /**
   * The app's RPC Service, which is given our Cache instance and the
   * headers map.
   *
   * @type {relief.rpc.RPCService}
   * @private
   */
  this.rpc_ = rpc = new relief.rpc.RPCService(cache, headers);

  var auth;
  /**
   * Basic dummy authentication manager.
   *
   * @type {relief.auth.PublicAuthManager}
   * @private
   */
  this.auth_ = auth = new relief.auth.PublicAuthManager();
  auth.setParentEventTarget(eventBus);

  // Get our required DOM elements...
  var iframe = /** @type {!HTMLIFrameElement} */
               (goog.dom.getElementByClass(goog.getCssName('history_frame'))),
      input = /** @type {!HTMLInputElement} */
              (goog.dom.getElementByClass(goog.getCssName('history_input'))),
      content = /** @type {!Element} */
                (goog.dom.getElementByClass(goog.getCssName('content_root')));


  var sp = new closure_boilerplate.ServiceProvider(eventBus,
                                    closure_boilerplate.urls,
                                    cache, rpc, auth,
                                    iframe, input, content);

  var nav;
  /**
   * @type {relief.nav.NavManager}
   * @private
   */
  this.nav_ = nav = new relief.nav.NavManager(sp);
  nav.setParentEventTarget(eventBus);

};


/**
 * Entry point for the application
 */
closure_boilerplate.start = function() {
  new closure_boilerplate.Application();
};


// Export the __bootstrap symbol so we have a way of starting the application.
goog.exportSymbol('__bootstrap', closure_boilerplate.start);
