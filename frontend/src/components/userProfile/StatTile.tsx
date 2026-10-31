import { ReactNode } from 'react';
import { Box, Card, CardActionArea, CardContent, Skeleton, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

type StatTileProps = {
    icon: ReactNode;
    label: string;
    value: string | number;
    note?: string;
    // Colour of the icon chip.
    accent: string;
    onClick?: () => void;
    loading?: boolean;
};

// One headline number. Clickable tiles lead to the matching list.
function StatTile({ icon, label, value, note, accent, onClick, loading }: StatTileProps) {
    const theme = useTheme();

    const content = (
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
                <Box
                    aria-hidden
                    sx={{
                        display: 'grid',
                        placeItems: 'center',
                        width: 28,
                        height: 28,
                        flexShrink: 0,
                        borderRadius: '8px',
                        color: accent,
                        backgroundColor: alpha(accent, 0.16),
                        '& .MuiSvgIcon-root': { fontSize: 17, color: 'inherit' },
                    }}
                >
                    {icon}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.85 }} noWrap>
                    {label}
                </Typography>
            </Stack>
            <Typography sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 800, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                {loading ? <Skeleton width="50%" /> : value}
            </Typography>
            {loading ? (
                <Skeleton variant="text" sx={{ mt: 0.5, width: '70%' }} />
            ) : note && (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.75 }} noWrap>
                    {note}
                </Typography>
            )}
        </CardContent>
    );

    return (
        <Card
            sx={{
                height: '100%',
                backgroundColor: theme.palette.background.default,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: 'none',
            }}
        >
            {onClick && !loading ? <CardActionArea onClick={onClick} sx={{ height: '100%' }}>{content}</CardActionArea> : content}
        </Card>
    );
}

export default StatTile;
