import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10, // Key for Smoke test. Keep it at 2, 3, max 5 VUs
  duration: '1m', // This can be shorter or just a few iterations
};
export default function () {
  http.get('http://localhost:4000/movies');
}


// k6 run --vus 10 --iterations 40 restGet_K6.js