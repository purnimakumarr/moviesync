import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Box, Button, Chip, Divider, Stack, Typography, useTheme } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import MovieActionsBtn from '../common/MovieActionsBtn';
import { useIsAuthenticated } from '../../auth/authHooks';
import { WheelPick } from '../../types';
import noImg from '../../assets/no-img.jpg';
import { getGenres, getTitle, getYear, movieKey, moviePath, posterUrl } from '../../utils/tmdb';

type ResultPanelProps = {
    winner?: WheelPick;
    runnersUp: WheelPick[];
};

const posterOf = (movie: WheelPick) => posterUrl(movie, 'w342') ?? noImg;

// Compact result for the laptop layout, shown beside the wheel so the page
// never needs to scroll. The list of runners-up scrolls inside the panel.
const ResultPanel = forwardRef<HTMLHeadingElement, ResultPanelProps>(({ winner, runnersUp }, headingRef) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const isAuthenticated = useIsAuthenticated();

    if (!winner) {
        return (
            <Stack alignItems="center" justifyContent="center" textAlign="center" gap={1.5} sx={{ height: '100%', px: 2 }}>
                <Box
                    aria-hidden
                    sx={{
                        display: 'grid',
                        placeItems: 'center',
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        color: theme.palette.watchLaterIcon,
                        backgroundColor: `${theme.palette.primary.main}22`,
                        '& .MuiSvgIcon-root': { fontSize: 40 },
                    }}
                >
                    <EmojiEventsIcon />
                </Box>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>
                    {t('spin_wheel.result_placeholder_title')}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, maxWidth: 260 }}>
                    {t('spin_wheel.result_placeholder_body')}
                </Typography>
            </Stack>
        );
    }

    return (
        <Stack
            component={motion.section}
            key={movieKey(winner)}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            aria-labelledby="wheel-winner-heading"
            gap={1.5}
            // The whole panel scrolls, so a long shortlist is never squeezed
            // into a small window under the winner.
            sx={{ height: '100%', minHeight: 0, overflowY: 'auto', pr: 0.5 }}
        >
            <Stack direction="row" gap={1} alignItems="center">
                <EmojiEventsIcon fontSize="small" sx={{ color: theme.palette.watchLaterIcon }} />
                <Typography variant="overline" sx={{ fontWeight: 800, lineHeight: 1.5 }}>
                    {t('spin_wheel.tonights_pick')}
                </Typography>
            </Stack>

            <Stack direction="row" gap={2} alignItems="flex-start">
                <Box
                    component="img"
                    src={posterOf(winner)}
                    alt=""
                    sx={{ width: 104, flexShrink: 0, aspectRatio: '2 / 3', objectFit: 'cover', borderRadius: '10px' }}
                />
                <Stack gap={1} sx={{ minWidth: 0 }}>
                    <Typography
                        id="wheel-winner-heading"
                        ref={headingRef}
                        tabIndex={-1}
                        variant="h6"
                        component="h2"
                        sx={{ fontWeight: 800, lineHeight: 1.25, outline: 'none' }}
                    >
                        {getTitle(winner)}
                        {getYear(winner) && (
                            <Box component="span" sx={{ opacity: 0.7, fontWeight: 600 }}> ({getYear(winner)})</Box>
                        )}
                    </Typography>
                    {getGenres(winner).length > 0 && (
                        <Stack direction="row" gap={0.5} sx={{ flexWrap: 'wrap' }}>
                            {getGenres(winner).map((genre) => (
                                <Chip key={genre} label={genre} size="small" sx={{ fontWeight: 700 }} />
                            ))}
                        </Stack>
                    )}
                </Stack>
            </Stack>

            {winner.overview && (
                <Typography
                    variant="body2"
                    sx={{
                        lineHeight: 1.55,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {winner.overview}
                </Typography>
            )}

            {winner.reasons?.map((reason) => (
                <Chip
                    key={reason}
                    label={reason}
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{ alignSelf: 'flex-start', maxWidth: '100%', height: 'auto', color: 'text.primary', '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 } }}
                />
            ))}

            <Stack direction="row" gap={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                <Button
                    component={Link}
                    to={moviePath(winner)}
                    variant="contained"
                    size="small"
                    startIcon={<InfoOutlinedIcon />}
                    sx={{ py: 0.75, px: 1.5 }}
                >
                    {t('spin_wheel.view_details')}
                </Button>
                {isAuthenticated && <MovieActionsBtn movie={winner} size="small" />}
            </Stack>

            {runnersUp.length > 0 && (
                <>
                    <Divider sx={{ borderColor: `${theme.palette.primary.main}40` }} />
                    <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 800 }}>
                        {t('spin_wheel.also_shortlisted')}
                    </Typography>
                    <Box
                        component="ul"
                        sx={{
                            listStyle: 'none',
                            p: 0,
                            m: 0,
                            display: 'grid',
                            gap: 1,
                            // Two across where the panel is wide enough.
                            gridTemplateColumns: { lg: '1fr', xl: 'repeat(2, minmax(0, 1fr))' },
                        }}
                    >
                        {runnersUp.map((movie) => (
                            <Box component="li" key={movieKey(movie)}>
                                <Stack
                                    component={Link}
                                    to={moviePath(movie)}
                                    direction="row"
                                    gap={1.5}
                                    alignItems="center"
                                    sx={{
                                        p: 1,
                                        height: '100%',
                                        borderRadius: '10px',
                                        border: `1px solid ${theme.palette.divider}`,
                                        color: 'inherit',
                                        textDecoration: 'none',
                                        '&:hover, &:focus-visible': { backgroundColor: `${theme.palette.primary.main}22` },
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={posterOf(movie)}
                                        alt=""
                                        loading="lazy"
                                        sx={{ width: 56, flexShrink: 0, aspectRatio: '2 / 3', objectFit: 'cover', borderRadius: '6px' }}
                                    />
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography
                                            variant="body2"
                                            title={getTitle(movie)}
                                            sx={{
                                                fontWeight: 700,
                                                lineHeight: 1.3,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {getTitle(movie)}
                                        </Typography>
                                        {getYear(movie) && (
                                            <Typography variant="caption" sx={{ opacity: 0.75 }}>
                                                {getYear(movie)}
                                            </Typography>
                                        )}
                                    </Box>
                                </Stack>
                            </Box>
                        ))}
                    </Box>
                </>
            )}
        </Stack>
    );
});

ResultPanel.displayName = 'ResultPanel';

export default ResultPanel;
