import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

// Maak een nieuwe Apollo Client
const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  cache: new InMemoryCache(),
});
  

// Functie om films op te halen via GraphQL
window.fetchGraphQL = async function fetchGraphQL() {
  const query = gql`
    query {
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

  try {
    const { data } = await client.query({ query });
    document.getElementById('results').textContent = JSON.stringify(data.movies);
    location.reload();
  } catch (error) {
    console.error('Fout bij het ophalen van films:', error);
  }
}
// functie om films op te halen via REST
window.fetchREST = async function fetchREST() {
    const response = await fetch('http://localhost:4000/movies');
    const movies = await response.json();
    document.getElementById('results').textContent = JSON.stringify(movies);
    location.reload();
  }


// film ophalen rest selected 
window.fetchRESTMovieWithParams = async function fetchRESTMovieWithParams(id) {
  const response = await fetch(`http://localhost:4000/movie/${id}/genres`);
if (response.status === 200) {
    
  const parsedResponse = await response.json();
    const movie_id = parsedResponse.movie_id;
    const title = parsedResponse.title;
    const characterNames = Array.isArray(parsedResponse.cast) 
      ? parsedResponse.cast.map(character => character.character_name)
      : [];
    const genreNames = Array.isArray(parsedResponse.movieGenres)
      ? parsedResponse.movieGenres.map(genre => genre.genre.genre_name)
      : [];
    const companyNames = Array.isArray(parsedResponse.movieCompanies)
      ? parsedResponse.movieCompanies.map(company => company.company.company_name)
      : [];


  const result = {
    movie_id: movie_id,
    title: title,
    character_names: characterNames,
    genre_names: genreNames,
    company_names: companyNames,
  };
  document.getElementById('results').textContent = JSON.stringify(result);
  location.reload();
}
}

window.fetchGraphQLMovieWithParams = async function fetchGraphQLMovieWithParams(id) {
  const query = gql`
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

  try {
    const { data } = await client.query({ query, variables: { movieId: id } });
    document.getElementById('results').textContent = JSON.stringify(data.movie);
    location.reload();
  } catch (error) {
    console.error('Error fetching movie:', error);
  }
}