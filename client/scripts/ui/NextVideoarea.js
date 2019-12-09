
function NextVideoarea(bind,args) {
  bind(this);
  var youtube = ['/images/youtube.png', 'Youtube']
  var picmonic = ['/images/5.png', 'PicMonic']

  fs.mixAppend($('.videos',this.dom),'ui/ListElement', {image: '/images/2.jpg', title: 'Electrocardiography Handwritten', channel: youtube});
  fs.mixAppend($('.videos',this.dom),'ui/ListElement', {image: '/images/3.jpg', title: 'Electrocardiography Khan Academy', channel: youtube});
  fs.mixAppend($('.videos',this.dom),'ui/ListElement', {image: '/images/4.jpg', title: '12 Lead Contiguous Leads - Lateral Wall MI', channel: picmonic});
  fs.mixAppend($('.videos',this.dom),'ui/ListElement', {image: '/images/2.jpg', title: 'Electrocardiography Handwritten', channel: youtube});
  fs.mixAppend($('.videos',this.dom),'ui/ListElement', {image: '/images/3.jpg', title: 'Electrocardiography Khan Academy', channel: youtube});
  fs.mixAppend($('.videos',this.dom),'ui/ListElement', {image: '/images/4.jpg', title: '12 Lead Contiguous Leads - Lateral Wall MI', channel: picmonic});
  fs.mixAppend($('.videos',this.dom),'ui/ListElement', {image: '/images/2.jpg', title: 'Electrocardiography Handwritten', channel: youtube});
  fs.mixAppend($('.videos',this.dom),'ui/ListElement', {image: '/images/3.jpg', title: 'Electrocardiography Khan Academy', channel: youtube});
  fs.mixAppend($('.videos',this.dom),'ui/ListElement', {image: '/images/4.jpg', title: '12 Lead Contiguous Leads - Lateral Wall MI', channel: picmonic});
}

module.exports = NextVideoarea;
