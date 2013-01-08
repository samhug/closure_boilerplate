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
      this.navEl).length + 'px';

  this.isOpen = false;

  this.menuToggleEl = goog.dom.getElementByClass(
      goog.getCssName('menu-toggle'));

  this.menuItems = goog.dom.getElementsByTagNameAndClass('a', null,
      this.headerEl);

  // Add click event listener to the toggle button
  goog.events.listen(this.menuToggleEl,
      'click', this.onMenuToggleClicked_, true, this);

  // Add click event listener to the toggle button
  goog.array.forEach(this.menuItems, function(el) {
    goog.events.listen(el, 'click', this.onMenuItemClicked_, true, this);
  }, this);

};


/**
 * Sets the state of the drop down menu. If no state is provided then it
 * toggles the state.
 *
 * @param {boolean=} opt_state The state to activate.
 */
closure_boilerplate.navbar.Navbar.prototype.setState = function(opt_state) {

  this.isOpen = opt_state != null ? opt_state : !this.isOpen;

  if (this.isOpen) {
    this.navEl.style.height = this.navBarHeight;
  } else {
    this.navEl.style.height = 0;
  }
};


/**
 * Callback function for the menu toggle button.
 *
 * @private
 */
closure_boilerplate.navbar.Navbar.prototype.onMenuToggleClicked_ = function() {

  // Toggle the open state of the menu.
  this.setState();
};


/**
 * Called when a menu item is clicked.
 *
 * @private
 */
closure_boilerplate.navbar.Navbar.prototype.onMenuItemClicked_ = function() {

  // Close the menu
  this.setState(false);
};
