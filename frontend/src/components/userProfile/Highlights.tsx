import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Card, CardContent, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import VideocamIcon from '@mui/icons-material/Videocam';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

import { computeProfileStats } from '../../utils/profileStats';

type Stats = ReturnType<typeof computeProfileStats>;

type HighlightProps = {
    hue: string;
    icon: ReactNode;
    label: string;
    headline: string;
    note: string;
    children?: ReactNode;
};

const Highlight = ({ hue, icon, label, headline, note, children }: HighlightProps) => {
    const theme = useTheme();
    return (
        <Card
            sx={{
                height: '100%',
                backgroundColor: theme.palette.background.default,
                backgroundImage: `linear-gradient(135deg, ${alpha(hue, 0.14)}, ${alpha(hue, 0.03)})`,
                border: `1px solid ${alpha(hue, 0.35)}`,
                boxShadow: 'none',
            }}
        >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
                    <Box
                        aria-hidden
                        sx={{
                            display: 'grid',
                            placeItems: 'center',
                            width: 28,
                            height: 28,
                            borderRadius: '8px',
                            backgroundColor: hue,
                            color: theme.palette.getContrastText(hue),
                            '& .MuiSvgIcon-root': { fontSize: 17 },
                        }}
                    >
                        {icon}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary, opacity: 0.85 }}>
                        {label}
                    </Typography>
                </Stack>
                <Typography variant="h6" component="p" sx={{ lineHeight: 1.3, overflowWrap: 'anywhere' }}>
                    {headline}
                </Typography>
                {children}
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.75 }}>
                    {note}
                </Typography>
            </CardContent>
        </Card>
    );
};

// A single ratio against its limit: a meter, not a two-slice pie.
const Meter = ({ value, label, hue }: { value: number; label: string; hue: string }) => {
    return (
        <Box
            role="meter"
            aria-label={label}
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
            sx={{ mt: 1, height: 8, borderRadius: 4, backgroundColor: alpha(hue, 0.2), overflow: 'hidden' }}
        >
            <Box sx={{ width: `${value}%`, height: '100%', borderRadius: 4, backgroundColor: hue }} />
        </Box>
    );
};

// Plain-language takeaways from the user's lists; each card only appears
// when there is data behind it.
function Highlights({ stats }: { stats: Stats }) {
    const { t } = useTranslation();
    const theme = useTheme();
    const [hueA, hueB] = [theme.palette.chart, theme.palette.chart2];
    const { topGenre, favouriteDecade, topDirector, highestRated, oldest } = stats.highlights;

    const cards = [
        stats.completionRate !== null && (
            <Highlight
                key="completion"
                hue={hueA}
                icon={<TaskAltIcon />}
                label={t('profile.hl_completion')}
                headline={t('profile.hl_completion_value', { percent: stats.completionRate })}
                note={t('profile.hl_completion_note', { watched: stats.watchedCount, later: stats.watchLaterCount })}
            >
                <Meter value={stats.completionRate} label={t('profile.hl_completion')} hue={hueA} />
            </Highlight>
        ),
        topGenre && (
            <Highlight
                key="genre"
                hue={hueB}
                icon={<TheaterComedyIcon />}
                label={t('profile.hl_top_genre')}
                headline={topGenre.label}
                note={t('profile.hl_top_genre_note', { percent: topGenre.share })}
            />
        ),
        favouriteDecade && (
            <Highlight
                key="decade"
                hue={hueA}
                icon={<HistoryEduIcon />}
                label={t('profile.hl_decade')}
                headline={favouriteDecade.label}
                note={t('profile.titles_count', { count: favouriteDecade.value })}
            />
        ),
        topDirector && (
            <Highlight
                key="director"
                hue={hueB}
                icon={<VideocamIcon />}
                label={t('profile.hl_director')}
                headline={topDirector.label}
                note={t('profile.titles_count', { count: topDirector.value })}
            />
        ),
        highestRated && (
            <Highlight
                key="rated"
                hue={hueA}
                icon={<EmojiEventsIcon />}
                label={t('profile.hl_highest_rated')}
                headline={highestRated.title}
                note={t('profile.hl_imdb', { rating: highestRated.rating })}
            />
        ),
        oldest && (
            <Highlight
                key="oldest"
                hue={hueB}
                icon={<AutoStoriesIcon />}
                label={t('profile.hl_oldest')}
                headline={oldest.title}
                note={String(oldest.year)}
            />
        ),
    ].filter(Boolean);

    if (cards.length === 0) return null;

    return (
        <Box
            component="section"
            aria-labelledby="profile-highlights"
            sx={{ mb: { xs: 3, md: 4 } }}
        >
            <Typography id="profile-highlights" variant="h5" component="h2" sx={{ mb: 2 }}>
                {t('profile.highlights')}
            </Typography>
            <Box
                sx={{
                    display: 'grid',
                    gap: { xs: 1.5, md: 2 },
                    gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
                }}
            >
                {cards}
            </Box>
        </Box>
    );
}

export default Highlights;
