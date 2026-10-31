import { useIsAuthenticated } from '../../auth/authHooks';
import { Link } from 'react-router-dom';

import { Box, Card, CardMedia, Stack, Typography, useTheme } from '@mui/material';

import MovieActionsBtn from './MovieActionsBtn';

import noImg from '../../assets/no-img.jpg';
import { MovieProps } from '../../types';
import { getTitle, getYear, moviePath, posterUrl } from '../../utils/tmdb';

// Fills its grid cell. Title and year are always visible; the list buttons
// appear on hover where hover exists and are always shown on touch screens.
function MovieCard({ movie }: MovieProps) {
    const theme = useTheme();
    const isAuthenticated = useIsAuthenticated();
    const title = getTitle(movie);
    const year = getYear(movie);

    return (
        <Card
            component="article"
            sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: theme.palette.background.primary,
                boxShadow: `0 0 12px 2px ${theme.palette.primary.main}40`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover, &:focus-within': {
                    boxShadow: `0 0 20px 4px ${theme.palette.primary.main}70`,
                },
                '@media (hover: hover) and (prefers-reduced-motion: no-preference)': {
                    '&:hover': { transform: 'translateY(-4px)' },
                },
                '@media (hover: hover)': {
                    '& .card-actions': { opacity: 0, transform: 'translateY(8px)' },
                    '&:hover .card-actions, &:focus-within .card-actions': {
                        opacity: 1,
                        transform: 'none',
                    },
                },
            }}
        >
            <Box
                component={Link}
                to={moviePath(movie)}
                aria-label={year ? `${title} (${year})` : title}
                sx={{ display: 'block', position: 'relative', color: 'inherit', textDecoration: 'none' }}
            >
                <CardMedia
                    component="img"
                    image={posterUrl(movie, 'w342') ?? noImg}
                    alt=""
                    loading="lazy"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => (e.currentTarget.src = noImg)}
                    sx={{ aspectRatio: '2 / 3', width: '100%', objectFit: 'cover', display: 'block' }}
                />
            </Box>

            {isAuthenticated && (
                <Stack
                    className="card-actions"
                    direction="row"
                    gap={0.5}
                    justifyContent="center"
                    sx={{
                        position: 'absolute',
                        left: 8,
                        right: 8,
                        // Sits over the bottom of the poster, above the title.
                        bottom: { xs: 76, sm: 90 },
                        py: 0.5,
                        borderRadius: '999px',
                        backgroundColor: `${theme.palette.background.default}E6`,
                        backdropFilter: 'blur(6px)',
                        transition: 'opacity 0.2s, transform 0.2s',
                    }}
                >
                    <MovieActionsBtn movie={movie} size="small" />
                </Stack>
            )}

            <Box sx={{ p: { xs: 1, sm: 1.5 }, minHeight: { xs: 56, sm: 62 } }}>
                <Typography
                    component="h3"
                    title={title}
                    sx={{
                        fontWeight: 700,
                        fontSize: { xs: '0.85rem', sm: '0.95rem' },
                        lineHeight: 1.25,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {title}
                </Typography>
                {year && (
                    <Typography variant="caption" sx={{ opacity: 0.75, fontWeight: 600 }}>
                        {year}
                    </Typography>
                )}
            </Box>
        </Card>
    );
};

export default MovieCard;
