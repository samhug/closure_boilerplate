goog.provide('closure_boilerplate.navbar.Navbar');



/**
 * Main navigation bar.
 *
 * @constructor
 */
closure_boilerplate.navbar.Navbar = function() {

  this.headerEl = goog.dom.getElementByClass(goog.getCssName('site-header'));
  this.navEl = goog.dom.getElementByClass(goog.getCssName('site-nav'));

  this.navBarHeight = 60 * goog.dom.getElementsByTagNameAndClass('li', null,
      this.nav).length + 'px';

  this.open = false;

  this.menuToggleEl = goog.dom.getElementByClass(
      goog.getCssName('menu-toggle'));

  goog.events.listen(this.menuToggleEl,
      'click', this.onMenuToggle_, true, this);
};


/**
 * Callback function for the menu toggle button.
 *
 * @private
 */
closure_boilerplate.navbar.Navbar.prototype.onMenuToggle_ = function() {

  if (this.open) {
    this.navEl.style.height = 0;
  } else {
    this.navEl.style.height = this.navBarHeight;
  }

  this.open = !this.open;
};
