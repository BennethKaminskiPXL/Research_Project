const express = require('express');
const { Pool } = require('pg');
const { ApolloServer, gql } = require('apollo-server-express');

const app = express();
const port = 4000;

const pool = new Pool({
  user: 'student',
  host: 'localhost',
  database: 'moviedb',
  password: 'student',
  port: 5432,
});


// rest alle movies ophalen
app.get('/movies', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM movies.movie');
    res.send(result.rows);
  } catch (err) {
    console.error(err);
    res.send('Error ' + err);
  } finally {
    client.release();
  }
});

// alle movies met id en castnamen ophalen
app.get('/movie/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const movieResult = await client.query('SELECT * FROM movies.movie WHERE movie_id = $1', [req.params.id]);
    const movie = movieResult.rows[0];

    if (movie) {
      const castResult = await client.query('SELECT character_name FROM movies.movie_cast WHERE movie_id = $1', [req.params.id]);
      movie.cast = castResult.rows;
    }

    res.send(movie);
  } catch (err) {
    console.error(err);
    res.send('Error ' + err);
  } finally {
    client.release();
  }
});

// rest movie by id met castnaam, moviegenres en genrenaam
/* app.get('/movie/:id/genre', async (req, res) => {
  const client = await pool.connect();
  try {
    const movieResult = await client.query('SELECT * FROM movies.movie WHERE movie_id = $1', [req.params.id]);
    const movie = movieResult.rows[0];

    if (movie) {
      const castResult = await client.query('SELECT character_name FROM movies.movie_cast WHERE movie_id = $1', [req.params.id]);
      movie.cast = castResult.rows;

      const movieGenresResult = await client.query('SELECT genre_id FROM movies.movie_genres WHERE movie_id = $1', [req.params.id]);
      movie.movieGenres = await Promise.all(movieGenresResult.rows.map(async (movieGenre) => {
        const genreResult = await client.query('SELECT genre_name FROM movies.genre WHERE genre_id = $1', [movieGenre.genre_id]);
        movieGenre.genre = genreResult.rows[0];
        return movieGenre;
      }));
    }

    res.send(movie);
  } catch (err) {
    console.error(err);
    res.send('Error ' + err);
  } finally {
    client.release();
  }
}); */
app.get('/movie/:id/genre', async (req, res) => {
  const client = await pool.connect();
  try {
    const movieResult = await client.query('SELECT * FROM movies.movie WHERE movie_id = $1', [req.params.id]);
    const movie = movieResult.rows[0];

    if (movie) {
      const castResult = await client.query('SELECT character_name FROM movies.movie_cast WHERE movie_id = $1', [req.params.id]);
      movie.cast = castResult.rows;

      const movieGenresResult = await client.query('SELECT genre_id FROM movies.movie_genres WHERE movie_id = $1', [req.params.id]);
      movie.movieGenres = await Promise.all(movieGenresResult.rows.map(async (movieGenre) => {
        const genreResult = await client.query('SELECT genre_name FROM movies.genre WHERE genre_id = $1', [movieGenre.genre_id]);
        movieGenre.genre = genreResult.rows[0];
        return movieGenre;
      }));

      const movieCompaniesResult = await client.query('SELECT company_id FROM movies.movie_company WHERE movie_id = $1', [req.params.id]);
      movie.movieCompanies = await Promise.all(movieCompaniesResult.rows.map(async (movieCompany) => {
        const companyResult = await client.query('SELECT company_name FROM movies.production_company WHERE company_id = $1', [movieCompany.company_id]);
        movieCompany.company = companyResult.rows[0];
        return movieCompany;
      }));
    }

    res.send(movie);
  } catch (err) {
    console.error(err);
    res.send('Error ' + err);
  } finally {
    client.release();
  }
});



const typeDefs = gql`
type MovieCast {
  movie_id: ID
  person_id: Int
  character_name: String
  gender_id: Int
  cast_order: Int
}

type MovieCompany {
  movie_id: ID
  company_id: Int
  company: Company
}

type Company {
  company_id: ID
  company_name: String
}

type MovieGenre {
  movie_id: ID
  genre_id: Int
  genre: Genre
}

type Genre {
  genre_id: ID
  genre_name: String
}

type Movie {
  movie_id: ID
  title: String
  budget : Int
  homepage: String
  overview: String
  popularity: Float
  release_date: String
  revenue: Float
  runtime: Int
  movie_status: String
  tagline: String
  vote_average: Float
  vote_count: Int
  cast: [MovieCast]
  movieGenres: [MovieGenre]
  movieCompanies: [MovieCompany]
  # Add other fields as needed
}



type Query {
  movies: [Movie]
  movie(movie_id: ID!): Movie
}
`;

const resolvers = {
  Movie: {
    cast: async (parent) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM movies.movie_cast WHERE movie_id = $1', [parent.movie_id]);
        return result.rows;
      } finally {
        client.release();
      }
    },
    movieGenres: async (parent) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM movies.movie_genres WHERE movie_id = $1', [parent.movie_id]);
        return result.rows;
      } finally {
        client.release();
      }
    },
    movieCompanies: async (parent) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM movies.movie_company WHERE movie_id = $1', [parent.movie_id]);
        return result.rows;
      } finally {
        client.release();
      }
    },
  },
  MovieGenre: {
    genre: async (parent) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM movies.genre WHERE genre_id = $1', [parent.genre_id]);
        return result.rows[0];
      } finally {
        client.release();
      }
    },
  },
  MovieCompany: {
    company: async (parent) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM movies.production_company WHERE company_id = $1', [parent.company_id]);
        return result.rows[0];
      } finally {
        client.release();
      }
    },
  },
  
  Query: {
    // GraphQL all movies
    movies: async () => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM movies.movie');
        return result.rows;
      } finally {
        client.release();
      }
    },
    // GraphQL 1 movie
    movie: async (_, { movie_id }) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM movies.movie WHERE movie_id = $1', [movie_id]);
        return result.rows[0];
      } finally {
        client.release();
      }
    },
  },
};

async function startApolloServer(typeDefs, resolvers) {
    const server = new ApolloServer({ typeDefs, resolvers });
    await server.start();
    server.applyMiddleware({ app });
  
    app.listen({ port: 4000 }, () =>
      console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
    )
  }
  
  startApolloServer(typeDefs, resolvers);
