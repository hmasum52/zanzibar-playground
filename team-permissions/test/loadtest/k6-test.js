import http from 'k6/http';
import { check } from 'k6';

export let options = {
    stages: [
        { duration: '5s', target: 50 },
        { duration: '10s', target: 200 },
        { duration: '5s', target: 0 },
    ],
    // thresholds: {
    //     http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    // },
};


export default function() {
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