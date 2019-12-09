
function PageComponent(bind,args) {
  bind(this);
  fs.mix(this,'ui/LeftMenu');
  fs.mix(this,'ui/MainScreen', {badgeFiles: '73', badgeTime: '97'});
}

module.exports = PageComponent;
