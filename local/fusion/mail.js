

var nodemailer = require('nodemailer')
var Fiber = require('fibers');
var S = require('string');

var transport = nodemailer.createTransport("SES", {
  AWSAccessKeyID: Const.AWSAccessKeyID,
  AWSSecretKey: Const.AWSSecretAccessKey,
});

exports.send = function(msg) {
  var fiber = Fiber.current;

  var E = null;
  // send mail with defined transport object
  transport.sendMail(msg, function(error, response){

    if (error) E = error;

    fiber.resume();
  });

  Fiber.yield();

  // Throw an error if the sendmail failed
  if (E) throw new Error(E);
}

exports.warn = function(subject,msg,options) {
  options = options || {};
  exports.send({
    from: options.from || Const.adminSenderAddress,
    to: options.to || Const.admin,
    subject: subject,
    html: msg
  });
}

exports.notify = function(args) {
  try {
    exports.send({
      from: args.from, // sender address
      to: args.to, // list of receivers
      subject: args.subject, // Subject line
      text: S(args.msg).stripTags().s,
      html: args.msg // html body
    });
  } catch(e) {
    // Fails silently... some users won't get a confirmation email b/c amazon
    // fails to send it, but we don't want that to interfere with the
    // message that comes back to the user in the store
  }
}

