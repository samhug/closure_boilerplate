goog.provide('closure_boilerplate.urls');

goog.require('closure_boilerplate.pages.landing.LandingHandler');
goog.require('closure_boilerplate.pages.test.TestHandler');
goog.require('relief.handlers.errors');


/**
 * @type {!relief.nav.URLMap}
 */
closure_boilerplate.urls = {
  '': closure_boilerplate.pages.landing.LandingHandler,
  '/': closure_boilerplate.pages.landing.LandingHandler,
  '/test': closure_boilerplate.pages.test.TestHandler,

  ':401': relief.handlers.errors.Error401,
  ':404': relief.handlers.errors.Error404,
  ':501': relief.handlers.errors.Error501
};
