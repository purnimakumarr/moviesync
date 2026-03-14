import MovieCard from '../common/MovieCard';
import Grid from '@mui/material/Grid2';
import { Movie } from "../../types";

type MovieGalleryProps = {
    movies: Movie[];
};

function MovieGallery({ movies }: MovieGalleryProps) {

    return (
        <Grid container spacing={4} size={{ xs: 8 }} sx={{ maxWidth: "1800px", margin: '0 auto', justifyContent: 'center', alignItems: 'center' }}>
            {movies.length > 0 && movies.map((movie) => (
                <MovieCard movie={movie} key={movie.imdbID} />
            ))}
        </Grid>
    );
};

export default MovieGallery;