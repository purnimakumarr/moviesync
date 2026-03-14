import { useIsAuthenticated } from '../../auth/authHooks';
import { Link } from 'react-router-dom';

import { Stack, Card, CardMedia, CardContent, Typography, Box, useTheme, Tooltip } from '@mui/material';

import MovieActionsBtn from './MovieActionsBtn';

import noImg from '../../assets/no-img.jpg';
import { MovieProps } from '../../types';


function MovieCard({ movie }: MovieProps) {
    const theme = useTheme();
    const isAuthenticated = useIsAuthenticated();

    return (
        <Card sx={{
            width: 300,
            cursor: "pointer",
            position: 'relative',
            borderRadius: '12px',
            boxShadow: `0 0 15px 4px ${theme.palette.primary.main}50`,
            "&:hover .card-content": {
                opacity: 1,
            },
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
                transform: "scale(1.05)",
                boxShadow: `0 0 24px 6px ${theme.palette.primary.main}80`
            },
        }}>
            <Box component={Link} to={`/movie/${movie.imdbID}`} className='card-img-wrapper' sx={{ borderRadius: '12px' }}>
                <CardMedia className='card-img' component='img' image={movie.Poster !== 'N/A' ? movie.Poster : noImg} sx={{
                    height: 450, objectFit: "cover"
                }} onError={(e) => (e.currentTarget.src = noImg)} />
            </Box>
            <CardContent className="card-content"
                sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: theme.palette.background.primary,
                    margin: 1,
                    opacity: 0,
                    transition: "opacity 0.3s ease, transform 0.3s ease",
                    borderRadius: '12px'
                }}>
                <Stack direction='row' gap={2} sx={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2
                }}>
                    {isAuthenticated && <MovieActionsBtn movie={movie} />}
                </Stack>
                <Stack gap={1}>
                    <Tooltip title={movie.Title}>
                        <Typography sx={{ fontWeight: 500, textAlign: 'center' }} gutterBottom variant='body1' component='div'>{movie.Title.length > 22 ? `${movie.Title.substring(0, 22)}...` : movie.Title}</Typography>
                    </Tooltip>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default MovieCard;