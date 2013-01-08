goog.provide('closure_boilerplate.navbar.Navbar');



/**
 * Main navigation bar.
 *
 * @constructor
 */
closure_boilerplate.navbar.Navbar = function() {

  this.NAV_ITEM_HEIGHT = 60;

  // Header & Nav Elements
  this.headerEl = goog.dom.getElementByClass(goog.getCssName('site-header'));
  this.navEl = goog.dom.getElementByClass(goog.getCssName('site-nav'));

  // Toggle button
  this.menuToggleEl = goog.dom.getElementByClass(
      goog.getCssName('menu-toggle'));

  // item count
  var nNavItems = goog.dom.getElementsByTagNameAndClass('a', null, this.headerEl).length;

  // animate height
  this.navBarHeight = this.NAV_ITEM_HEIGHT * nNavItems;

  this.isOpen = false;

  // navbar links
  this.menuItems = goog.dom.getElementsByTagNameAndClass('a', null,
      this.navEl);

  // Button click event
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
    this.headerEl.style.height = this.navBarHeight + 'px';
  } else {
    this.headerEl.style.height = this.NAV_ITEM_HEIGHT + 'px';
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
