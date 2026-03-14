import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

import { Box, Typography, useTheme } from '@mui/material';
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts';

type BarGraphProps = {
    genreCount: Record<string, number>
};

export default function GenreBarGraph({ genreCount }: BarGraphProps) {
    const theme = useTheme();
    const isLoading = useSelector((state: RootState) =>
        state.favourites.loading || state.watch.watchLater.loading || state.watch.watched.loading
    );

    const generateColor = (index: number) => {
        const hue = (index * 137) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    };

    const formatGenreData = (genreCount: Record<string, number>) => {
        return Object.entries(genreCount).map(([genre, count], index) => ({
            genre,
            count,
            color: generateColor(index),
        }));
    };

    const data = formatGenreData(genreCount);
    const sortedData = [...data].sort((a, b) => b.count - a.count);

    if (isLoading) {
        // Simulated skeleton bars for loading state
        const loadingData = Array.from({ length: 10 }, (_, i) => ({
            genre: `Loading ${i + 1}`,
            count: Math.random() * 10 + 5, // Random height
        }));

        return (
            <ResponsiveContainer width="100%" height={800}>
                <BarChart
                    data={loadingData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                    <XAxis type="number" stroke={theme.palette.text.primary} tick={false} />
                    <YAxis type="category" dataKey="genre" tick={false} stroke={theme.palette.text.primary} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {loadingData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill="gray" />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        );
    }

    if (sortedData.length === 0) {
        return (
            <Box display="flex" alignItems="center" justifyContent="center" height={800}>
                <Typography variant="h6" color={theme.palette.text.secondary}>
                    No data to display. Add movies to your lists!
                </Typography>
            </Box>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={800}>
            <BarChart
                data={sortedData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
                <XAxis type="number" stroke={theme.palette.text.primary} tick={{ fill: theme.palette.text.primary }} />
                <YAxis
                    type="category"
                    dataKey="genre"
                    tick={{ fontSize: 14, fill: theme.palette.text.primary }}
                    stroke={theme.palette.text.primary}
                />
                <Bar dataKey="count" background={{ fill: theme.palette.background.default }} radius={[0, 6, 6, 0]}>
                    {sortedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}


