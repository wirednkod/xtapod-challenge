
function Breadcrumbs(bind,args) {
  this.path = args.path.join(" > ");
  this.title = args.title
}

module.exports = Breadcrumbs;
