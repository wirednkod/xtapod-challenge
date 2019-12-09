
function PageComponent(bind,args) {
  bind(this);
  // Usage: fs.mix(parent, ComponentPath, Arguments)
  // fs.mix is the most basic way to nest components
  fs.mix(this,'ui/LeftMenu');
  fs.mix(this,'ui/MainScreen');

  // Usage: fs.mixAppend(domElementReference, ComponentPath, Arguments)
  // fs.mixAppend is similar to fs.mix except you can add component to a dom element
  // fs.mixAppend($('.appended-elements',this.dom),'ui/AppendedExample', {text: 'some text'});
  // fs.mixAppend($('.appended-elements',this.dom),'ui/AppendedExample');
  // fs.mixAppend($('.appended-elements',this.dom),'ui/AppendedExample');

  // Mixlists are essentially the same as mixAppend but they're more managed (allows for sorting, deleting, etc)
  // this.list = fs.mixList(this,'.mix-list');
  // this.add();
}

// PageComponent.prototype.add = function() {
//
//   this.list.push('ui/ListElement',{
//     title: 'Title example '+(this.list.items.length+1),
//     body: 'Here is an example body.',
//   });
// }

module.exports = PageComponent;
