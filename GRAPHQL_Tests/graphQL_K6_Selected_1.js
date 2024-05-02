import http from 'k6/http';

export const options = {
  vus: 1, // Key for Smoke test. Keep it at 2, 3, max 5 VUs
  duration: '1m', // This can be shorter or just a few iterations
};

let counter = 1;
const MAX_MOVIE_ID = 100;

export default function () {
  const query = `
  query Movie($movieId: ID!) {
    movie(movie_id: $movieId) {
      movie_id
    title
    cast {
      character_name
    }
    movieGenres {
      genre {
        genre_name
      }
    }
    movieCompanies {
      company {
        company_name
      }
    }
  }
}
  `;

  const variables = {
    movieId: counter.toString(),
  };

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  http.post('http://localhost:4000/graphql', JSON.stringify({ query, variables }), params);
  

  counter = counter % MAX_MOVIE_ID + 1;
}

//dynamisch maken met een variabele