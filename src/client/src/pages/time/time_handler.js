goog.provide('closure_boilerplate.pages.time.TimeHandler');

goog.require('closure_boilerplate.pages.time.GetServerTimeCommand');

goog.require('goog.Timer');
goog.require('goog.events');

goog.require('relief.nav.Handler');



/**
 * An implementation of relief.nav.Handler which shows the current list of
 * guestbook messages.
 *
 * @param {relief.handlers.CommonServiceProvider} sp The app's service provider.
 * @constructor
 * @implements {relief.nav.Handler}
 */
closure_boilerplate.pages.time.TimeHandler = function(sp) {
  /**
   * Store the Service Provider for later.
   *
   * @type {relief.handlers.CommonServiceProvider}
   * @private
   */
  this.sp_ = sp;


  /**
   * @private
   */
  this.timer_ = new goog.Timer(1000);
  goog.events.listen(this.timer_, goog.Timer.TICK, function() {

    var cmd = new closure_boilerplate.pages.time.GetServerTimeCommand(
        goog.bind(this.onTimeUpdate_, this));

    this.sp_.getRPCService().execute(cmd);
  }, true, this);
};


/**
 * Called when we recieve a new time from the server.
 *
 * @param {goog.date.DateTime} time The new time recieved for the server.
 * @private
 */
closure_boilerplate.pages.time.TimeHandler.prototype.onTimeUpdate_ =
    function(time) {

  this.sp_.getContentRoot().innerHTML = time.toIsoString(true);
};


/**
 * The handle method is called when a navigation event is mapped to a handler
 * class that is not already active.  When handle is called, the handler can
 * be sure that the root element is clear and ready for use.
 *
 * @param {relief.nav.Path} path An object with request-specific parameters.
 * @override
 */
closure_boilerplate.pages.time.TimeHandler.prototype.handle = function(path) {
  this.sp_.getContentRoot().innerHTML = 'Howdy';

  this.timer_.start();
};


/**
 * When an instance of this handler class is already handling a request,
 * transition will be called if the new navigation event is mapped to this
 * same class.  The handler can then query the user if they want to navigate to
 * the new page or not.  onTransition should be called after handling the event,
 * passing true if navigation succeeded, or false if the user opted not to leave
 * the current page.  If onTransition is called with false, the navigation will
 * be rolled back.
 *
 * @param {relief.nav.Path} path An object with request-specific parameters.
 * @param {function(boolean)} onTransition Callback to be invoked either after
 *    the handler has completed (called with "true"), or if the user decides
 *    not to navigate away (called with "false").
 * @override
 */
closure_boilerplate.pages.time.TimeHandler.prototype.transition =
    function(path, onTransition) {
  this.handle(path);
  onTransition(true);
};


/**
 * Save state and clear the user-interface so the next handler can use the
 * screen.
 * @param {function(boolean)} onExit Callback once exit is either
 *    complete or cancelled by the user.  Passing true to the callback means
 *    that the handler has relinquished control of the page; false means
 *    the user opted not to navigate away.
 * @param {boolean=} opt_force If for some reason the navigation is
 *    unconditional (eg., the page is unloading or the user is no longer
 *    authorized to execute this handler), force will be true and the handler
 *    must exit immediately.
 * @override
 */
closure_boilerplate.pages.time.TimeHandler.prototype.exit =
    function(onExit, opt_force) {

  this.sp_.getContentRoot().innerHTML = '';

  this.timer_.stop();

  onExit(true);
};


/**
 * @inheritDoc
 */
closure_boilerplate.pages.time.TimeHandler.prototype.dispose = function() {
  this.sp_ = null;
};


/**
 * @inheritDoc
 */
closure_boilerplate.pages.time.TimeHandler.prototype.isDisposed = function() {
  return this.sp_ === null;
};
