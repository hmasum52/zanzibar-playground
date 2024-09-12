import { Client, StatusOK } from 'k6/net/grpc';
import { check, sleep } from 'k6';

export let options = {
  vus: 1,
  duration: '1s',
};

const client = new Client();
//client.load(['definitions'], 'base/v1/service.proto');

export default () => {
  client.connect('localhost:3478', {});

  const data = { greeting: 'Bert' };
  const response = client.invoke('PermissionCheckRequest', data);

  check(response, {
    'status is OK': (r) => r && r.status === StatusOK,
  });

  console.log(JSON.stringify(response.message));

  client.close();
  sleep(1);
};