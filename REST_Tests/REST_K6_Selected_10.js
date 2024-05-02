import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 10,
  duration: '1m',
};

let counter = 1;
const MAX_MOVIE_ID = 100;

export default function () {
  const movieId = counter.toString();
  const url = `http://localhost:4000/movie/${movieId}/genreBatching`;

  const response = http.get(url);

  // Check if the response is OK and the body is not empty
  if (response.status === 200 && response.body) {
    
      const parsedResponse = JSON.parse(response.body);
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

      JSON.stringify(result);
    } 

  counter = (counter % MAX_MOVIE_ID) + 1;
}
