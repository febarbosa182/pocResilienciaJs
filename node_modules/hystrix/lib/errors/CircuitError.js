
export default class CircuitError extends Error {
  constructor(message, extra) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = "hystrix: " + message;
    this.extra = extra || null;
  }
}
