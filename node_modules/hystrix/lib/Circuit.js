import EventEmitter from 'events';
import crypto from 'crypto';
import Circuits from './Circuits';
import ExecutorPool from './pool';
import Metrics from 'metrics';

export default class CircuitBreaker extends EventEmitter {
 constructor(opts){
  super();
  this.setDefaults(opts);
 }


 setDefaults(opts = {}){
   this.name = opts.name || crypto.randomBytes(256);
   this.open = opts.open || false;
   this.forceOpen = opts.forceOpen || false;
   this.executorPool = opts.executorPool || new ExecutorPool(this.name);
   this.metrics = opts.metrics || new Metrics(this.name);
   this.openOrLastTimeTested = 0;
 }

 /**
  * @description Finds a circuit in the Circuits Map{}.
  * If its not found it will create a new one and return it.
  * @param{String} The key name of the circuit
  * @returns {Object} The circuit instance. 
  */
 getCircuit(name) {
   const circuit = Circuits.findOne(name);
   if(!circuit) {
     return Circuits.append(name);
   }
   return circuit;
 }

 /**
  * @description The Flush method will clear out all metrics information
  * for all circuits
  * @returns{Object}
  */
 flush(){
   const circuits = Circuits.get();
   const newCircuits = _.reduce(circuits,(acc,val,idx) => {
     val.metrics.reset();
     val.executorPool.metrics.reset();
     acc[idx] = val;
     return acc;
   },{});
   Circuits.set(newCircuits);
   return Circuits.get();
 }


}


//function CircuitBreaker(opts) {

  //return this;
//};

//CircuitBreaker.OPEN = 0;
//CircuitBreaker.HALF_OPEN = 1;
//CircuitBreaker.CLOSED = 2;

//// Public API
//// ----------

//this.windowDuration = opts.windowDuration|| 10000; // milliseconds
//this.numBuckets = opts.numBuckets || 10;    // number
//this.timeoutDuration = opts.timeoutDuration || 3000;  // milliseconds
//this.errorThreshold = opts.errorThreshold || 50;    // percentage
//this.volumeThreshold = opts.volumeThreshold || 5;     // number

//// BUCKETS = { failures: 0, successes: 0, timeouts: 0, shortCircuits: 0 };
//this._buckets = [this._createBucket()]; 
//this._state = CircuitBreaker.CLOSED;
//CircuitBreaker.prototype.run = function run(command, fallback) {
  //if (this.isOpen()) {
    //this._executeFallback(fallback || function() {});
    //return this;
  //} else {
    //this._executeCommand(command);
    //return this;
  //}
//};

//CircuitBreaker.prototype.forceClose = function forceClose() {
  //this._forced = this._state;
  //this._state = CircuitBreaker.CLOSED;
  //return this;
//};

//CircuitBreaker.prototype.forceOpen = function forceOpen() {
  //this._forced = this._state;
  //this._state = CircuitBreaker.OPEN;
  //return this;
//};

//CircuitBreaker.prototype.unforce = function unforce() {
  //this._state = this._forced;
  //this._forced = null;
  //return this;
//};

//CircuitBreaker.prototype.isOpen = function isOpen() {
  //return this._state == CircuitBreaker.OPEN;
//};

//// Private API
//// -----------

//CircuitBreaker.prototype._startTicker = function _startTicker() {
  //var self = this;
  //var bucketIndex = 0;
  //var bucketDuration = this.windowDuration / this.numBuckets;

  //var tick = function() {
    //if (self._buckets.length > self.numBuckets) {
      //self._buckets.shift();
    //}

    //bucketIndex++;

    //if (bucketIndex > self.numBuckets) {
      //bucketIndex = 0;

      //if (self.isOpen()) {
        //self._state = CircuitBreaker.HALF_OPEN;
      //}
    //}

    //self._buckets.push(self._createBucket());
  //};

  //setInterval(tick, bucketDuration);
//};

//CircuitBreaker.prototype._createBucket = function _createBucket() {
  //return { failures: 0, successes: 0, timeouts: 0, shortCircuits: 0 };
//};

//CircuitBreaker.prototype._lastBucket = function _lastBucket() {
  //return this._buckets[this._buckets.length - 1];
//};

//CircuitBreaker.prototype._executeCommand = function _executeCommand(command) {
  //var self = this;
  //var timeout;

  //var increment = function(prop) {
    //return function incrementFn() {
      //if (!timeout) { return; }

      //var bucket = self._lastBucket();
      //bucket[prop]++;

      //if (self._forced == null) {
        //self._updateState();
      //}

      //clearTimeout(timeout);
      //timeout = null;
    //};
  //};

  //timeout = setTimeout(increment('timeouts'), this.timeoutDuration);

  //command(increment('successes'), increment('failures'));
//};

//CircuitBreaker.prototype._executeFallback = function _executeFallback(fallback) {
  //var bucket = this._lastBucket();
  //bucket.shortCircuits++;
  //return fallback();
//};

//CircuitBreaker.prototype._calculateMetrics = function _calculateMetrics() {
  //var totalCount = 0, errorCount = 0, errorPercentage = 0;

  //for (var i = 0, l = this._buckets.length; i < l; i++) {
    //var bucket = this._buckets[i];
    //var errors = (bucket.failures + bucket.timeouts);

    //errorCount += errors;
    //totalCount += (errors + bucket.successes);
  //}

  //errorPercentage = (errorCount / (totalCount > 0 ? totalCount : 1)) * 100;

  //return { totalCount: totalCount, errorCount: errorCount, errorPercentage: errorPercentage };
//};

//CircuitBreaker.prototype._updateState = function _updateState() {
  //var metrics = this._calculateMetrics();

  //if (this._state == CircuitBreaker.HALF_OPEN) {
    //var lastCommandFailed = !this._lastBucket().successes && metrics.errorCount > 0;

    //if (lastCommandFailed) {
      //this._state = CircuitBreaker.OPEN;
    //} else {
      //this._state = CircuitBreaker.CLOSED;
      //this.emit("hystrix:circuit:closed",metrics);
    //}
  //} else {
    //var overErrorThreshold = metrics.errorPercentage > this.errorThreshold;
    //var overVolumeThreshold = metrics.totalCount > this.volumeThreshold;
    //var overThreshold = overVolumeThreshold && overErrorThreshold;

    //if (overThreshold) {
      //this._state = CircuitBreaker.OPEN;
      //this.emit("hystrix:circuit:open",metrics);
    //}
  //}
//};

//console.log(new CircuitBreaker());
//process.exit(0)
//module.exports = CircuitBreaker;
