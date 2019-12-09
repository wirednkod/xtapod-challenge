
function MainScreen(bind,args) {
  bind(this);
  // fs.mixAppend($('.breadcrumbs', this.dom), 'ui/Breadcrumbs')
  fs.mix(this, 'ui/Breadcrumbs');
  fs.mix(this, 'ui/Videoarea');
  fs.mix(this, 'ui/NextVideoarea');
}

module.exports = MainScreen;
