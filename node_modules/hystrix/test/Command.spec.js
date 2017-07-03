import { expect } from 'chai';
import sinon from 'sinon';
import _ from 'lodash';
import Command from '../lib/Command';
import { CircuitError } from '../lib/errors';
const context = describe;

describe('Command: ', () => {
 let command;
 let sandbox;
  beforeEach( () => {
    command = new Command({commandName:'google.oauth'});
    sandbox = sinon.sandbox.create(); 
  });

  afterEach(() => {
    command = null;
    sandbox.restore();
  });

  context('Basic Assertions: ',() => {
    it('should be an object', () => {
      expect(command).to.be.an('object');
    });
    it('should be an instance of the Command Constructor', () => {
      expect(command).to.be.an.instanceof(Command);
    });
  });

  context('Interface',() => {
    it('should have a defaults() method', () => {
      expect(command).to.respondTo('setDefaults');
    });
    it('should have a reportEvent() method', () => {
      expect(command).to.respondTo('reportEvent');
    });
    it('should have a isTimedout() method', () => {
      expect(command).to.respondTo('isTimedOut');
    });
    it('should have a errorWithFallback() method', () => {
      expect(command).to.respondTo('errorWithFallback');
    });
    it('should have a tryFallback() method', () => {
      expect(command).to.respondTo('tryFallback');
    });
  });

  context('Implementation',() => {
    it('should set default values for every command', () => {
      expect(command.ticket).to.eql({});
      expect(command.start).to.eql(null);
      expect(command.circuit).to.eql(null);
      expect(command.run).to.eql(null);
      expect(command.fallback).to.eql(null);
      expect(command.runDuration).to.eql(null);
      expect(command.events).to.eql([]);
      expect(command.timedOut).to.eql(false);
      expect(command.circuit).to.eql(null);
    });

    it('should allow the user to change default props', () => {
      // setup:
     const opts = {commandName:'twitter.oauth',run:_.noop};
     // when:
     const diffCommand = new Command(opts);
     // then:
     expect(diffCommand.run).to.eql(_.noop);
     expect(diffCommand.commandName).to.eql('twitter.oauth');
    });
    
    it('Should report all events triggered', () => {
      // setup:
     const opts = {commandName:'twitter.oauth',run:_.noop};
     const diffCommand = new Command(opts);
     const stub = sandbox.stub(diffCommand,'emit');
     // when:
     diffCommand.reportEvent('failure');
     //then:
     expect(diffCommand.events.length).to.eql(1);
     expect(stub.getCall(0).args[0]).to.eql("hystrix:command:new:event");
     expect(stub.getCall(0).args[1]).to.eql("failure");
    });

    it('Should tell if this command is expired', () => {
      expect(command.isTimedOut()).to.eql(false);
    });

    it('Should report the correct event when the circuit is open', () => {
      // setup:
      const opts = {
        commandName:'twitter.oauth',
      };
      const diffCommand = new Command(opts);
      const stub = sandbox.stub(diffCommand,'emit');
      const ErrCircuitOpen = new CircuitError("Circuit_Open");
      // when:
      diffCommand.errorWithFallback(ErrCircuitOpen);
      // then:
      expect(stub.getCall(0).args[0]).to.eql("hystrix:command:new:event");
      expect(stub.getCall(0).args[1]).to.eql("short-circuit");
    });
    it('Should report the correct event when the circuit timed out', () => {
      // setup:
      const opts = {
        commandName:'twitter.oauth',
      };
      const diffCommand = new Command(opts);
      const stub = sandbox.stub(diffCommand,'emit');
      const ErrTimeout = new CircuitError("Timeout");
      // when:
      diffCommand.errorWithFallback(ErrTimeout);
      // then:
      expect(stub.getCall(0).args[0]).to.eql("hystrix:command:new:event");
      expect(stub.getCall(0).args[1]).to.eql("timeout");
    });
    it('Should report the correct event when the circuit saturated', () => {
      // setup:
      const opts = {
        commandName:'twitter.oauth',
      };
      const diffCommand = new Command(opts);
      const stub = sandbox.stub(diffCommand,'emit');
      const ErrMaxConcurrency = new CircuitError("Max_Concurrency");
      // when:
      diffCommand.errorWithFallback(ErrMaxConcurrency);
      // then:
      expect(stub.getCall(0).args[0]).to.eql("hystrix:command:new:event");
      expect(stub.getCall(0).args[1]).to.eql("rejected");
    });
    it('Should call the fallback when an error occurs', () => {
      // setup:
      const fallbackStub = sandbox.stub();
      const opts = {
        commandName:'twitter.oauth',
        fallback: fallbackStub,
      };
      const diffCommand = new Command(opts);
      const stub = sandbox.stub(diffCommand,'emit');
      const ErrMaxConcurrency = new CircuitError("Max_Concurrency");
      fallbackStub.callsArgWith(1, null);
      // when:
      diffCommand.errorWithFallback(ErrMaxConcurrency);
      // then:
      expect(stub.getCall(0).args[0]).to.eql("hystrix:command:new:event");
      expect(stub.getCall(0).args[1]).to.eql("rejected");
      // then:
      expect(fallbackStub.getCall(0).args[0]).to.eql(ErrMaxConcurrency);
      expect(fallbackStub.called).to.eql(true);
      expect(fallbackStub.callCount).to.eql(1);
      // then:
      expect(stub.getCall(1).args[0]).to.eql("hystrix:command:new:event");
      expect(stub.getCall(1).args[1]).to.eql("fallback-success");
    });
    it('Should return the new fallback error if the fallback fails', () => {
      // setup:
      const fallbackStub = sandbox.stub();
      const ErrSecondFailure = new Error("Second Failure");
      fallbackStub.callsArgWith(1, ErrSecondFailure);
      const opts = {
        commandName:'twitter.oauth',
        fallback: fallbackStub,
      };
      const diffCommand = new Command(opts);
      const emitStub = sandbox.stub(diffCommand,'emit');
      const ErrMaxConcurrency = new CircuitError("Max_Concurrency");
      // when:
      diffCommand.errorWithFallback(ErrMaxConcurrency);
      // then:
      expect(emitStub.getCall(0).args[0]).to.eql("hystrix:command:new:event");
      expect(emitStub.getCall(0).args[1]).to.eql("rejected");
      // then:
      expect(fallbackStub.getCall(0).args[0]).to.eql(ErrMaxConcurrency);
      expect(fallbackStub.called).to.eql(true);
      expect(fallbackStub.callCount).to.eql(1);
      // then:
      expect(emitStub.getCall(1).args[0]).to.eql("hystrix:command:new:event");
      expect(emitStub.getCall(1).args[1]).to.eql("fallback-failure");
      // then:
      const ErrFallbackFailed = new CircuitError('fallback failed',{fallback:ErrSecondFailure,original:ErrMaxConcurrency});
      expect(emitStub.getCall(2).args[0]).to.eql("hystrix:command:error");
      expect(emitStub.getCall(2).args[1]).to.deep.eql(ErrFallbackFailed);
    });
  });
});

