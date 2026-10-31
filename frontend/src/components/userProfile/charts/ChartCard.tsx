import { ReactNode } from 'react';
import { Box, Card, CardContent, Skeleton, Stack, Typography, useTheme } from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import { alpha } from '@mui/material/styles';

type ChartCardProps = {
    title: string;
    subtitle?: string;
    isEmpty: boolean;
    emptyText: string;
    // The chart's hue, echoed as a small accent beside the title.
    accent: string;
    loading?: boolean;
    children: ReactNode;
};

function ChartCard({ title, subtitle, isEmpty, emptyText, accent, loading, children }: ChartCardProps) {
    const theme = useTheme();

    return (
        <Card
            component="section"
            aria-label={title}
            sx={{
                height: '100%',
                backgroundColor: theme.palette.background.default,
                border: `1px solid ${theme.palette.divider}`,
                // Subtle wash of the chart's hue from the top edge.
                backgroundImage: `linear-gradient(180deg, ${alpha(accent, 0.07)}, transparent 120px)`,
                boxShadow: 'none',
            }}
        >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
                <Stack direction="row" alignItems="center" gap={1}>
                    <Box aria-hidden sx={{ width: 4, height: 18, borderRadius: 2, backgroundColor: accent }} />
                    <Typography variant="h6" component="h3">
                        {title}
                    </Typography>
                </Stack>
                {subtitle && (
                    <Typography variant="body2" sx={{ opacity: 0.75, mb: 2 }}>
                        {subtitle}
                    </Typography>
                )}
                {loading ? (
                    <Stack gap={1.5} aria-busy="true" sx={{ py: 1 }}>
                        {[90, 70, 55, 40].map((width) => (
                            <Skeleton key={width} variant="rounded" height={18} sx={{ width: `${width}%` }} />
                        ))}
                    </Stack>
                ) : isEmpty ? (
                    <Stack alignItems="center" justifyContent="center" gap={1} sx={{ py: 5, opacity: 0.75, textAlign: 'center' }}>
                        <InsightsIcon />
                        <Typography variant="body2">{emptyText}</Typography>
                    </Stack>
                ) : (
                    children
                )}
            </CardContent>
        </Card>
    );
}

export default ChartCard;
