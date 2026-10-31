import { useTranslation } from 'react-i18next';
import { Box, Tooltip, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

import ChartTable from './ChartTable';
import { shadeFor } from './shade';
import { ChartDatum } from './types';

type RankedBarsProps = {
    data: ChartDatum[];
    // Denominator for the share shown in the tooltip.
    total: number;
    caption: string;
    // Single hue for the chart; bars are shaded by value within it.
    hue: string;
};

// Largest first, one hue, on a shared baseline: easier to compare than pie
// slices. Values sit at the bar ends, so there is no axis to read.
function RankedBars({ data, total, caption, hue }: RankedBarsProps) {
    const theme = useTheme();
    const { t } = useTranslation();
    const max = Math.max(...data.map((datum) => datum.value), 1);

    return (
        <>
            <Box component="ol" aria-hidden sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 0.75 }}>
                {data.map((datum) => {
                    const share = total > 0 ? Math.round((datum.value / total) * 100) : 0;
                    return (
                        <Tooltip
                            key={datum.label}
                            placement="top"
                            title={`${datum.label}: ${t('profile.titles_count', { count: datum.value })} · ${t('profile.share', { percent: share })}`}
                        >
                            <Box
                                component="li"
                                tabIndex={0}
                                sx={{
                                    display: 'grid',
                                    // Label column shrinks on phones; bar takes the rest.
                                    gridTemplateColumns: { xs: 'minmax(0, 7rem) 1fr auto', sm: 'minmax(0, 9rem) 1fr auto' },
                                    alignItems: 'center',
                                    gap: 1.5,
                                    py: 0.5,
                                    px: 0.75,
                                    mx: -0.75,
                                    borderRadius: '8px',
                                    outline: 'none',
                                    '&:hover, &:focus-visible': { backgroundColor: theme.palette.action.hover },
                                }}
                            >
                                <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                                    {datum.label}
                                </Typography>
                                <Box sx={{ height: 10, borderRadius: '0 4px 4px 0', overflow: 'hidden', backgroundColor: alpha(hue, 0.08) }}>
                                    <Box
                                        sx={{
                                            width: `${(datum.value / max) * 100}%`,
                                            minWidth: 4,
                                            height: '100%',
                                            backgroundColor: shadeFor(hue, datum.value, max),
                                            // Square at the baseline, rounded at the data end.
                                            borderRadius: '0 4px 4px 0',
                                        }}
                                    />
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 700, minWidth: '2ch', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                    {datum.value}
                                </Typography>
                            </Box>
                        </Tooltip>
                    );
                })}
            </Box>
            <ChartTable caption={caption} data={data} />
        </>
    );
}

export default RankedBars;
