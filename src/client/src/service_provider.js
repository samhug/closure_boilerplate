goog.provide('closure_boilerplate.ServiceProvider');

goog.require('relief.handlers.CommonServiceProvider');



/**
 * A Service Provider implementation that extends CommonServiceProvider to also
 * include an event bus.
 *
 * @param {goog.events.EventTarget} eventBus The app's event bus.
 * @param {relief.nav.URLMap} urlMap The mapping from URL hash codes to Handler
 *    constructors.
 * @param {relief.cache.Cache} cache The app's cache.
 * @param {relief.rpc.RPCService} rpc The app's RPC Service.
 * @param {relief.auth.AuthManager} auth The app's auth manager instance.
 * @param {!HTMLIFrameElement} iframe The iframe to be used by the goog.History
 *    object.
 * @param {!HTMLInputElement} input The hidden input field to be used by the
 *    goog.History object.
 * @param {!Element} content The root element into which handlers should inject
 *    content.
 *
 * @constructor
 * @extends {relief.handlers.CommonServiceProvider}
 */
closure_boilerplate.ServiceProvider = function(eventBus, urlMap, cache, rpc,
                                      auth, iframe, input, content) {
  goog.base(this, urlMap, cache, rpc, auth, iframe, input, content);

  /**
   * @type {goog.events.EventTarget}
   * @private
   */
  this.eventBus_ = eventBus;
};
goog.inherits(closure_boilerplate.ServiceProvider,
    relief.handlers.CommonServiceProvider);


/**
 * @return {goog.events.EventTarget} The app's event bus.
 */
closure_boilerplate.ServiceProvider.prototype.getEventBus = function() {
  return this.eventBus_;
};


/**
 * @inheritDoc
 */
closure_boilerplate.ServiceProvider.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');

  this.eventBus_.dispose();
  this.eventBus_ = null;
};
