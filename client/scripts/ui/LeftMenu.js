
function LeftMenu(bind,args) {
  bind(this);
  fs.mixAppend($('.high-menu',this.dom),'ui/MenuButton', {text: 'Library', imagepath: 'images/menu1.png'});
  fs.mixAppend($('.high-menu',this.dom),'ui/MenuButton', {text: 'Step 1 Schedule', imagepath: 'images/menu2.png'});
  fs.mixAppend($('.high-menu',this.dom),'ui/MenuButton', {text: 'Quiz Builder', imagepath: 'images/menu3.png'});
  fs.mixAppend($('.high-menu',this.dom),'ui/MenuButton', {text: 'Team WorkSpace', imagepath: 'images/menu4.png'});
  fs.mixAppend($('.low-menu',this.dom),'ui/MenuButton', {text: 'Tools', imagepath: 'images/menu5.png'});
  fs.mixAppend($('.low-menu',this.dom),'ui/MenuButton', {text: 'Help', imagepath: 'images/menu6.png'});
}

module.exports = LeftMenu;
