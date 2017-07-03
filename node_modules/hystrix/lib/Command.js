import _ from 'lodash';
import debug from 'debug';
import EventEmitter from 'events';
import { CircuitError } from './errors'

/** @module Command **/

debug('hystrix:command');
/**
 * @description ErrMaxConcurrency occurs when too many of the same named command are executed at the same time.
 * @constant
 * @type {string}
 * @default
*/ 
const ErrMaxConcurrency = new CircuitError("Max_Concurrency");
/**
 * @description ErrCircuitOpen returns when an execution attempt "short circuits". This happens due to the circuit being measured as unhealthy.
 * 
 * @constant
 * @type {string}
 * @default
*/ 
const ErrCircuitOpen = new CircuitError("Circuit_Open");
/* 
 * @description ErrTimeout occurs when the provided function takes too long to execute.
 * @constant
 * @type {string}
 * @default
*/ 
const ErrTimeout = new CircuitError("Timeout");

/**
 * @description command models the state used for a single execution on a circuit. "hystrix command" is commonly
 * used to describe the pairing of your run/fallback functions with a circuit.
 * @extends EventEmitter
 */
export default class Command extends EventEmitter {
    /**
     * Create a Command.
     * @param {Object} Options Hash to override any default properties.
     */
  constructor(opts){
    super()
    this.setDefaults(opts);
    debug("Creating New Command",this);
  }

  /**
   * @description Sets all specified options for this command
   * @param{Object} A configuration object
   * @returns{void}
   */
  setDefaults(opts){
    this.commandName = opts.commandName || null;
    this.ticket = opts.ticket || {};
    this.start = opts.start || null;
    this.circuit = opts.circuit || null;
    this.run = opts.run || null;
    this.fallback = opts.fallback || null;
    this.runDuration = opts.runDuration || null;
    this.events = opts.events || [];
    this.timedOut = opts.timedOut || false;
  }

  /**
   * @description records all events triggered for this command
   * @param{String} The event type that is being triggered 
   * @returns{Void}
   */
  reportEvent(eventType){
    this.emit("hystrix:command:new:event",eventType);
    debug("new:event",eventType);
    return this.events.push(eventType);
  }

  /**
   * @description A convenience function to allow users to query if there command has timedout
   * @returns{Boolean}
   */
  isTimedOut(){
    return this.timedOut;
  }

  /**
   * @description errorWithFallback triggers the fallback while reporting the appropriate metric events.
   * If called multiple times for a single command, only the first will execute to insure
   * accurate metrics and prevent the fallback from executing more than once.
   * @param{Error} The error that cased the command to fail
   */
  errorWithFallback(error) {
    debug("Calling The Fallback with Error", error);
    return _.once(function onceCB() {
      let eventType = "failure";
      if (error.message.includes('Circuit_Open')) {
        eventType = "short-circuit";
      } else if (error.message.includes('Max_Concurrency')) {
        eventType = "rejected";
      } else if (error.message.includes('Timeout')) {
        eventType = "timeout";
      }

      this.reportEvent(eventType);
      this.tryFallback(error, function tryFallbackCb (fallbackErr) {
        if (fallbackErr) {
          return this.emit("hystrix:command:error",fallbackErr);
        }
      }.bind(this));
    }.bind(this))();
  }

  /**
   * @description This method will make an attempt to call the pre-defined fallback in the case that the original command fails
   *@param{Error} The error from the commmand
   *@param{Function} A callback function used to notify if the fallback succeded or failed
   *@returns{Null|CircuitError} A Node style err-back
   */
  tryFallback(error,cb) {
    if (!this.fallback){
      // If we don't have a fallback return the original error.
      return cb(error);
    }

    this.fallback(error, function fallbackCB(fallbackErr) {
      if (fallbackErr) {
        this.reportEvent("fallback-failure");
        cb(new CircuitError("fallback failed", {fallback: fallbackErr, original: error }));
      } else {
        this.reportEvent("fallback-success");
        cb(null);
      }
    }.bind(this));
  }
}
