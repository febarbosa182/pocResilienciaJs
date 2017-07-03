import _ from 'lodash';
import Settings from './settings';
import EventEmitter from 'events';

// ErrMaxConcurrency occurs when too many of the same named command are executed at the same time.
const ErrMaxConcurrency = CircuitError("max concurrency");
// ErrCircuitOpen returns when an execution attempt "short circuits". This happens due to the circuit being measured as unhealthy.
const ErrCircuitOpen = CircuitError("circuit open");
// ErrTimeout occurs when the provided function takes too long to execute.
const ErrTimeout = CircuitError("timeout");

export default class Hystrix extends EventEmitter {

  constructor(config){
    super();
    this.config = _.merge({},Settings,config);
  }

  run(success,fallback) {
    if (!_.isFunction(success)) {
      throw new Error('Hystrix needs a proper fn type');
    }
    cmd = new Command({
      run:          success,
      fallback,
      start:        Date.now(),
      fallbackOnce: _.noop,
    });
    success(this.__trackSuccess,fallback);
    return this;
  }

  __trackSuccess (err,fallback){
    // Add the metrics tracking for this circuit
    if (err) {
      fallback(this.__trackFallback);
    }
    return this;
  }

  __trackFallback(err){
    // Add the metrics tracking for this circuit

  }

}


