import http from 'k6/http';

export const options = {
  vus: 1, // Key for Smoke test. Keep it at 2, 3, max 5 VUs
  duration: '1m', // This can be shorter or just a few iterations
};

export default function () {
  const query = `
  query Movies {
    movies {
      movie_id
      title
      budget
      homepage
      overview
      popularity
      release_date
      revenue
      runtime
      movie_status
      tagline
      vote_average
      vote_count
    }
  }
  `;

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  http.post('http://localhost:4000/graphql', JSON.stringify({ query }), params);
   

}