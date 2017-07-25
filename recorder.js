const {BatchRecorder} = require('zipkin'),
      {HttpLogger} = require('zipkin-transport-http');

// Send spans to Zipkin asynchronously over HTTP
const zipkinBaseUrl = 'http://zipkin:9411';
const recorder = new BatchRecorder({
  logger: new HttpLogger({
    endpoint: `${zipkinBaseUrl}/api/v1/spans`
  })
});

module.exports.recorder = recorder;




