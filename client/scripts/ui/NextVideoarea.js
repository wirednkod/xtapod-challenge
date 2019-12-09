
function NextVideoarea(bind,args) {
  this.nextVideoTitle = args.nextVideoTitle;
  this.nextVideoFrom = args.nextVideoFrom;
  this.nextVideoTime = args.nextVideoTime;
  bind(this);

  args.historyVideo.forEach(i => {
    fs.mixAppend($('.videos',this.dom),'ui/ListElement', {
      image: i.image,
      title: i.title,
      channel: i.channel
    });
  })
}

module.exports = NextVideoarea;
