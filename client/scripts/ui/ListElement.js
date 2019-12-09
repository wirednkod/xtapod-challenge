
function ListElement(bind,args) {
  this.image = args.image;
  this.title = args.title;
  this.channel = args.channel;
  bind(this);
}

module.exports = ListElement;
