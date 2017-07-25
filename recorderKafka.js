const {BatchRecorder} = require('zipkin'),
      {KafkaLogger} = require('zipkin-transport-kafka');

const recorderKafka = new BatchRecorder({
  logger: new KafkaLogger({
    clientOpts: {
      connectionString: 'kafka:2181'
    }
  })
});

module.exports.recorderKafka = recorderKafka;
