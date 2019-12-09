
function MenuButton(bind,args) {
  this.imagepath = args.imagepath;
  this.text = args.text;
}

MenuButton.prototype.action = function(which) {
  alert('Button ' + which + ' was pressed!');
}

module.exports = MenuButton;
