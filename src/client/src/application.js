goog.provide('__bootstrap');
goog.provide('closure_boilerplate.Application');

goog.require('closure_boilerplate.urls');

goog.require('goog.dom');
goog.require('goog.net.XhrIo');
goog.require('goog.structs.Map');

goog.require('relief.auth.PublicAuthManager');
goog.require('relief.cache.Cache');
goog.require('relief.handlers.CommonServiceProvider');
goog.require('relief.nav.NavManager');
goog.require('relief.rpc.RPCService');
goog.require('relief.utils');



/**
 * Main class for the application
 *
 * @constructor
 */
closure_boilerplate.Application = function() {


  /**
   * The application's cache.
   *
   * @type {relief.cache.Cache}
   * @private
   */
  this.cache_ = new relief.cache.Cache();

  /**
   * Headers to be used for all RPC requests.
   */
  var headers = new goog.structs.Map({
    'Content-Type': 'application/json'
  });

  /**
   * The app's RPC Service, which is given our Cache instance and the
   * headers map.
   *
   * @type {relief.rpc.RPCService}
   * @private
   */
  this.rpc_ = new relief.rpc.RPCService(this.cache_, headers);

  /**
   * Basic dummy authentication manager.
   *
   * @type {relief.auth.PublicAuthManager}
   * @private
   */
  this.auth_ = new relief.auth.PublicAuthManager();

  // Get our required DOM elements...
  var iframe = /** @type {!HTMLIFrameElement} */
               (goog.dom.getElement('history_frame')),
      input = /** @type {!HTMLInputElement} */
              (goog.dom.getElement('history_input')),
      content = /** @type {!Element} */ (goog.dom.getElement('content-root'));


  var sp = new relief.handlers.CommonServiceProvider(closure_boilerplate.urls,
                                    this.cache_, this.rpc_, this.auth_,
                                    iframe, input, content);

  /**
   * @type {relief.nav.NavManager}
   * @private
   */
  var nav_ = new relief.nav.NavManager(sp);
};


/**
 * Entry point for the application
 */
closure_boilerplate.start = function() {
  new closure_boilerplate.Application();
};


// Export the __bootstrap symbol so we have a way of starting the application.
goog.exportSymbol('__bootstrap', closure_boilerplate.start);
