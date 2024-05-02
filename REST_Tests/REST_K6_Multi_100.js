import http from 'k6/http';

export const options = {
  vus: 100,
  duration: '1m',
};

let counter = 1;
const MAX_MOVIE_ID = 100;

export default function () {
  http.get(`http://localhost:4000/movie/${counter}/genreBatching`);




  counter = counter % MAX_MOVIE_ID + 1;
}
