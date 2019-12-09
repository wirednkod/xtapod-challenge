
var fs = require('fs');
var CronJob = require('cron').CronJob;
var Fiber = require('fibers');
var path = require('fusion/path');

function CronObject(script,count) {
  this.script = script;
  this.count = count;
}

CronObject.prototype.checkIn = function() {
  this.script.checkedIn = +(new Date());
}

function createCronJob(script,name) {
  if (script.schedule) {
    // Set a 1 min timeout for exclusive scripts
    if (script.exclusive)
      script.timeout = script.timeout || 60000;

    var count = 0;
    var job = new CronJob(script.schedule, function(){
      var fiber = Fiber(function() {
        try {
          var $C = new CronObject(script,count);

          // Determine if the script can run at this time
          if (!script.exclusive || !script.checkedIn || script.checkedIn+script.timeout < (new Date()).getTime()) {
            // Log the fact that we're running this cron job
            console.log('Running cron job `'+path.basename(name,'.js')+'`: '+count);

            // Set the script.running flag
            script.checkedIn = +(new Date());

            // Increment the counter
            count++;

            // Fire the method defined by cron
            script.main($C);

            // Unset the script.running flag
            script.checkedIn = null;
          } else console.log('Skipping cron job `'+path.basename(name,'.js')+' (Already running)');
        } catch(e) {
          // Unset the script.running flag
          script.checkedIn = null;

          console.error('ERROR: '+e.message);
          console.error(e.stack);

          if (e.details) console.error(e.details);
        }
      });

      fiber.run();
    }, function () {
        // This function is executed when the job stops
    },true /* starts the job immediately */);
  }
}

exports.createJob = createCronJob;

exports.configure = function(cronDir,nonBlocking) {
  var dir = fs.readdirSync(rootDir+cronDir);
  for (var j in dir) {
    // Load the script from the directory
    var script = require(rootDir+cronDir+'/'+dir[j]);

    // Create a cron job wrapped by a fiber
    if ((nonBlocking && !script.blocking) || (!nonBlocking && script.blocking)) {
      var jobType = script.blocking ? 'blocking ' : '';
      if (script.schedule) {
        console.log('Creating '+jobType+'cron job `'+path.basename(dir[j],'.js')+'`');
        createCronJob(script,dir[j]);
      }
    }
  }
}

