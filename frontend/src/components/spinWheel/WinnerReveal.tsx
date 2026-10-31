import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Box, Button, Card, Chip, Stack, Typography, useTheme } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

import MovieActionsBtn from '../common/MovieActionsBtn';
import MovieCard from '../common/MovieCard';
import MovieGrid from '../common/MovieGrid';
import { useIsAuthenticated } from '../../auth/authHooks';
import { WheelPick } from '../../types';
import noImg from '../../assets/no-img.jpg';
import { getGenres, getTitle, getYear, movieKey, moviePath, posterUrl } from '../../utils/tmdb';

type WinnerRevealProps = {
    winner: WheelPick;
    runnersUp: WheelPick[];
    onSpinAgain: () => void;
    spinDisabled: boolean;
};

const ReasonChips = ({ reasons }: { reasons?: string[] }) =>
    reasons && reasons.length > 0 ? (
        <Stack direction="row" gap={1} sx={{ flexWrap: 'wrap' }}>
            {reasons.map((reason) => (
                <Chip
                    key={reason}
                    label={reason}
                    size="small"
                    color="primary"
                    variant="outlined"
                    // Theme text colour: primary-coloured text is too faint on dark themes.
                    sx={{ height: 'auto', color: 'text.primary', '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 } }}
                />
            ))}
        </Stack>
    ) : null;

// The heading is focusable so keyboard and screen reader users land on the
// result when the wheel stops.
const WinnerReveal = forwardRef<HTMLHeadingElement, WinnerRevealProps>(
    ({ winner, runnersUp, onSpinAgain, spinDisabled }, headingRef) => {
        const theme = useTheme();
        const { t } = useTranslation();
        const isAuthenticated = useIsAuthenticated();

        return (
            <Box
                component={motion.section}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                aria-labelledby="wheel-winner-heading"
                sx={{ mt: { xs: 4, md: 6 } }}
            >
                <Card
                    sx={{
                        p: { xs: 2, sm: 3 },
                        display: 'grid',
                        gap: { xs: 2, sm: 3 },
                        gridTemplateColumns: { xs: '1fr', sm: '180px 1fr', md: '220px 1fr' },
                        alignItems: 'start',
                        backgroundColor: theme.palette.background.primary,
                        border: `2px solid ${theme.palette.primary.main}`,
                        boxShadow: `0 0 32px 4px ${theme.palette.primary.main}55`,
                    }}
                >
                    <Box
                        component="img"
                        src={posterUrl(winner) ?? noImg}
                        alt=""
                        sx={{
                            width: '100%',
                            maxWidth: { xs: 200, sm: '100%' },
                            mx: { xs: 'auto', sm: 0 },
                            aspectRatio: '2 / 3',
                            objectFit: 'cover',
                            borderRadius: '12px',
                        }}
                    />
                    <Stack gap={1.5} sx={{ minWidth: 0 }}>
                        <Stack direction="row" gap={1} alignItems="center" sx={{ color: theme.palette.text.primary }}>
                            <EmojiEventsIcon fontSize="small" sx={{ color: theme.palette.watchLaterIcon }} />
                            <Typography variant="overline" sx={{ fontWeight: 800, lineHeight: 1.5 }}>
                                {t('spin_wheel.tonights_pick')}
                            </Typography>
                        </Stack>
                        <Typography
                            id="wheel-winner-heading"
                            ref={headingRef}
                            tabIndex={-1}
                            variant="h4"
                            component="h2"
                            sx={{ fontWeight: 800, outline: 'none' }}
                        >
                            {getTitle(winner)}
                            {getYear(winner) && (
                                <Box component="span" sx={{ opacity: 0.7, fontWeight: 600 }}> ({getYear(winner)})</Box>
                            )}
                        </Typography>

                        {getGenres(winner).length > 0 && (
                            <Stack direction="row" gap={1} sx={{ flexWrap: 'wrap' }}>
                                {getGenres(winner).map((genre) => (
                                    <Chip key={genre} label={genre} size="small" sx={{ fontWeight: 700 }} />
                                ))}
                            </Stack>
                        )}

                        {winner.overview && (
                            <Typography
                                sx={{
                                    maxWidth: '70ch',
                                    lineHeight: 1.6,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 4,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}
                            >
                                {winner.overview}
                            </Typography>
                        )}

                        <ReasonChips reasons={winner.reasons} />

                        <Stack direction="row" gap={1.5} alignItems="center" sx={{ flexWrap: 'wrap', mt: 1 }}>
                            <Button
                                component={Link}
                                to={moviePath(winner)}
                                variant="contained"
                                startIcon={<InfoOutlinedIcon />}
                                sx={{ py: 1 }}
                            >
                                {t('spin_wheel.view_details')}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<ReplayIcon />}
                                onClick={onSpinAgain}
                                disabled={spinDisabled}
                                sx={{ py: 1, color: theme.palette.text.primary }}
                            >
                                {t('spin_wheel.spin_again')}
                            </Button>
                            {isAuthenticated && <MovieActionsBtn movie={winner} />}
                        </Stack>
                    </Stack>
                </Card>

                {runnersUp.length > 0 && (
                    <Box sx={{ mt: { xs: 3, md: 4 } }}>
                        <Typography variant="h6" component="h3" sx={{ fontWeight: 800, mb: 2 }}>
                            {t('spin_wheel.also_shortlisted')}
                        </Typography>
                        <MovieGrid label={t('spin_wheel.also_shortlisted')}>
                            {runnersUp.map((movie) => (
                                <Stack key={movieKey(movie)} gap={1}>
                                    <MovieCard movie={movie} />
                                    <ReasonChips reasons={movie.reasons} />
                                </Stack>
                            ))}
                        </MovieGrid>
                    </Box>
                )}
            </Box>
        );
    },
);

WinnerReveal.displayName = 'WinnerReveal';

export default WinnerReveal;
