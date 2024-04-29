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

const typeDefs = gql`
type MovieCast {
  movie_id: ID
  person_id: Int
  character_name: String
  gender_id: Int
  cast_order: Int
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
  # Add other fields as needed
}



type Query {
  movies: [Movie]
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
  },
  
  Query: {
    
    movies: async () => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM movies.movie');
        return result.rows;
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
