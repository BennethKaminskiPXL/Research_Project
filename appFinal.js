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

//index.html in server
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

// geoptimaliseerde REST : alles wordt tegelijk opgehaald met promises
app.get('/movie/:id/genres', async (req, res) => {
  const client = await pool.connect();
  try {
    const movieResult = await client.query('SELECT * FROM movies.movie WHERE movie_id = $1', [req.params.id]);
    const movie = movieResult.rows[0];

    if (movie) {
      const genreIds = [];
      const companyIds = [];

      const [castResult, movieGenresResult, movieCompaniesResult] = await Promise.all([
        client.query('SELECT character_name FROM movies.movie_cast WHERE movie_id = $1', [req.params.id]),
        client.query('SELECT genre_id FROM movies.movie_genres WHERE movie_id = $1', [req.params.id]),
        client.query('SELECT company_id FROM movies.movie_company WHERE movie_id = $1', [req.params.id])
      ]);

      movie.cast = castResult.rows;
      movie.movieGenres = movieGenresResult.rows;
      movie.movieCompanies = movieCompaniesResult.rows;

      movie.movieGenres.forEach(movieGenre => {
        genreIds.push(movieGenre.genre_id);
      });

      movie.movieCompanies.forEach(movieCompany => {
        companyIds.push(movieCompany.company_id);
      });

      const [genresResult, companiesResult] = await Promise.all([
        client.query('SELECT * FROM movies.genre WHERE genre_id = ANY($1)', [genreIds]),
        client.query('SELECT * FROM movies.production_company WHERE company_id = ANY($1)', [companyIds])
      ]);

      movie.movieGenres = movie.movieGenres.map(movieGenre => {
        movieGenre.genre = genresResult.rows.find(genre => genre.genre_id === movieGenre.genre_id);
        return movieGenre;
      });

      movie.movieCompanies = movie.movieCompanies.map(movieCompany => {
        movieCompany.company = companiesResult.rows.find(company => company.company_id === movieCompany.company_id);
        return movieCompany;
      });
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
}



type Query {
  movies: [Movie]
  movie(movie_id: ID!): Movie
}
`;

const DataLoader = require('dataloader');

// Maak een DataLoader voor elke entiteit
const castLoader = new DataLoader(async (movieIds) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM movies.movie_cast WHERE movie_id = ANY($1)', [movieIds]);
    return movieIds.map(id => result.rows.filter(row => row.movie_id === id));
  } finally {
    client.release();
  }
});

const genreLoader = new DataLoader(async (movieIds) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM movies.movie_genres WHERE movie_id = ANY($1)', [movieIds]);
    return movieIds.map(id => result.rows.filter(row => row.movie_id === id));
  } finally {
    client.release();
  }
});

const companyLoader = new DataLoader(async (movieIds) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM movies.movie_company WHERE movie_id = ANY($1)', [movieIds]);
    return movieIds.map(id => result.rows.filter(row => row.movie_id === id));
  } finally {
    client.release();
  }
});

const genreDetailsLoader = new DataLoader(async (genreIds) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM movies.genre WHERE genre_id = ANY($1)', [genreIds]);
    return genreIds.map(id => result.rows.find(row => row.genre_id === id));
  } finally {
    client.release();
  }
});

const companyDetailsLoader = new DataLoader(async (companyIds) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM movies.production_company WHERE company_id = ANY($1)', [companyIds]);
    return companyIds.map(id => result.rows.find(row => row.company_id === id));
  } finally {
    client.release();
  }
});

// Pas je resolvers aan om de DataLoaders te gebruiken
const resolvers = {
  Movie: {
    cast: (parent) => castLoader.load(parent.movie_id),
    movieGenres: (parent) => genreLoader.load(parent.movie_id),
    movieCompanies: (parent) => companyLoader.load(parent.movie_id),
  },
  MovieGenre: {
    genre: (parent) => genreDetailsLoader.load(parent.genre_id),
  },
  MovieCompany: {
    company: (parent) => companyDetailsLoader.load(parent.company_id),
  },
  Query: {
    // GraphQL all movies
    movies: async () => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM movies.movie');
        return result.rows;
      } 
      catch (err) {
        console.error(err);
        result.send('Error ' + err);
      }
      finally {
        client.release();
      }
    },
    // GraphQL 1 movie
    movie: async (_, { movie_id }) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM movies.movie WHERE movie_id = $1', [movie_id]);
        return result.rows[0];
      } 
      catch (err) {
        console.error(err);
        result.send('Error ' + err);
      }
      finally {
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
