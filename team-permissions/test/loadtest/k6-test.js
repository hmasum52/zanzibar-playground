import http from 'k6/http';
import { check, sleep } from 'k6';

// export let options = {
//     stages: [
//         { duration: '10s', target: 5000 },
//         { duration: '10s', target: 5000 }, //avg=1.9s ,iterations=40988
//     ],
//     // rate: 10000, // 100 RPS
//     // duration: '5s',
//     // thresholds: {
//     //     http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
//     // },
// };

// export const options = {
//     // Key configurations for breakpoint in this section
//     executor: 'ramping-arrival-rate', //Assure load increase if the system slows
//     stages: [
//       { duration: '10s', target: 10000 }, // just slowly ramp-up to a HUGE load
//     ],
//   };

// https://k6.io/blog/how-to-generate-a-constant-request-rate-with-the-new-scenarios-api/
export const options = {
    scenarios: {
      constant_load: {
        executor: 'constant-arrival-rate',
        rate: 2500,
        timeUnit: '1s',
        duration: '20s',
        preAllocatedVUs: 300,
        maxVUs: 3000,
      },
    }
  }; // 1225 vu, 40832 vu, avg=347.93ms, rate= 40832/20=2041.6 RPS


function testLocal(){
    let url = 'http://localhost:3000/docs/1';
    let params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MjU3MDc1NTUsImV4cCI6MTcyNTg4MDM1NX0.FQdS96TquF6EtMNpZSsCRykYz1xvNCB4aUfV2gBWffw',
        },
    };

    let res = http.get(url, params);
    //console.log('Response:', res.body)
    check(res, {
        'status is 200': (r) => r.status === 200,
    });
}

function testPermify() {
    // body params of Permify check request
    const bodyParams = {
        metadata: {
          schema_version: "",
          snap_token: "",
          depth: 20,
        },
        entity: {
          type: "document",
          id: "1"
        },
        permission: "view",
        subject: {
          type: "user",
          id: "1",
          relation: "",
        },
      };

    let res = http.post(
        "http://localhost:3476/v1/tenants/t1/permissions/check", 
        JSON.stringify(bodyParams), {
            headers: { 
                "Content-Type": "application/json" 
            },
    });

    let checkResJson = JSON.parse(res.body);
    //console.log('Response:', checkResJson)
    check(checkResJson, {
        'status is 200': (r) => r.can === 'CHECK_RESULT_ALLOWED',
    });

   // sleep(0.1);
}

export default function() {
    testPermify();
}