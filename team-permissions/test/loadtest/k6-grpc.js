import { Client, StatusOK } from 'k6/net/grpc';
import { check, sleep } from 'k6';

export const options  = {
  vus: 1,
  iterations: 1,
};

const client = new Client();
// buf export buf.build/permifyco/permify  --output ./definitions
client.load(['./definitions/base/v1/service.proto']);

// https://k6.io/blog/performance-testing-grpc-services/
export default () => {
  client.connect('localhost:3478', {});

  const data = { greeting: 'Bert' };
  const response = client.invoke('base.v1.Permission/Check',data);

  console.log(`Response: ${response}`);

  client.close();
  sleep(1);
};