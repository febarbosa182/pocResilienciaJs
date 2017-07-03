const _ = require('lodash');

// DefaultTimeout is how long to wait for command to complete, in milliseconds
// DefaultMaxConcurrent is how many commands of the same type can run at the same time
// DefaultVolumeThreshold is the minimum number of requests needed before a circuit can be tripped due to health
// DefaultSleepWindow is how long, in milliseconds, to wait after a circuit opens before testing for recovery
// DefaultErrorPercentThreshold causes circuits to open once the rolling measure of errors exceeds this percent of requests
function Settings(){
  this.circuitSettings = {};
  return this;
}

Settings.prototype.defaults = function defaults(){
 return {
  DefaultTimeout               : 1000,
  DefaultMaxConcurrent         : 10,
  DefaultVolumeThreshold       : 20,
  DefaultSleepWindow           : 5000,
  DefaultErrorPercentThreshold : 50,
 }
}
// Configure applies settings for a set of circuits
Settings.prototype.configure = function configure(cmds) {
    _.each(cmds,function configureEach(key,val) {
        this.configureCommand(key, val);
    },this);
}

// ConfigureCommand applies settings for a circuit
Settings.prototype.configureCommand = function configureCommand(commandName,config){
  this.circuitSettings[commandName] = _.merge({}, this.defaults, config);
  return this.circuitSettings[commandName];
}

Settings.prototype.getSettings = function getSettings(commandName){
  let settings = this.circuitSettings[commandName];

  if (!settings) {
    this.configureCommand(commandName,this.defaults);
    settings = this.getSettings(commandName);
  }

  return settings;
}

module.exports = Settings;

