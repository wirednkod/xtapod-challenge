
function MainScreen(bind,args) {
  this.badgeFiles = args.badgeFiles;
  this.badgeTime = args.badgeTime;
  bind(this);
  fs.mix(this, 'ui/Breadcrumbs', {title: 'ECG Basics', path: ["Cardiovascular", "Physiology: Cardiovascular Physiology", "Electrocardiography"]});
  fs.mix(this, 'ui/Videoarea');
  fs.mix(this, 'ui/NextVideoarea', {
    nextVideoTitle: 'Blood presure, blood flow and resistance',
    nextVideoFrom: 'Osmosis',
    nextVideoTime: '9:43',
    historyVideo: [
      {image: '/images/2.jpg', title: 'Electrocardiography Handwritten', channel: ['/images/youtube.png', 'Youtube']},
      {image: '/images/3.jpg', title: 'Electrocardiography Khan Academy', channel: ['/images/youtube.png', 'Youtube']},
      {image: '/images/4.jpg', title: '12 Lead Contiguous Leads - Lateral Wall MI', channel: ['/images/5.png', 'PicMonic']},
      {image: '/images/2.jpg', title: 'Electrocardiography Handwritten', channel: ['/images/youtube.png', 'Youtube']},
      {image: '/images/3.jpg', title: 'Electrocardiography Khan Academy', channel: ['/images/youtube.png', 'Youtube']},
      {image: '/images/4.jpg', title: '12 Lead Contiguous Leads - Lateral Wall MI', channel: ['/images/5.png', 'PicMonic']}
    ]});
}

module.exports = MainScreen;
