import { useTranslation } from 'react-i18next';
import { Box, Tooltip, Typography, useTheme } from '@mui/material';

import ChartTable from './ChartTable';
import { shadeFor } from './shade';
import { ChartDatum } from './types';

const PLOT_HEIGHT = 140;

type ColumnChartProps = {
    data: ChartDatum[];
    caption: string;
    hue: string;
};

// Ordered categories (decades, rating bands) as thin columns on one baseline.
function ColumnChart({ data, caption, hue }: ColumnChartProps) {
    const theme = useTheme();
    const { t } = useTranslation();
    const max = Math.max(...data.map((datum) => datum.value), 1);

    return (
        <>
            <Box aria-hidden sx={{ display: 'flex', alignItems: 'flex-end', gap: '2px', pt: 2.5 }}>
                {data.map((datum) => (
                    <Tooltip key={datum.label} placement="top" title={`${datum.label}: ${t('profile.titles_count', { count: datum.value })}`}>
                        <Box
                            tabIndex={0}
                            sx={{
                                flex: 1,
                                minWidth: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                borderRadius: '8px',
                                outline: 'none',
                                '&:hover, &:focus-visible': { backgroundColor: theme.palette.action.hover },
                            }}
                        >
                            <Box sx={{ height: PLOT_HEIGHT, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                                {datum.value > 0 && (
                                    <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                                        {datum.value}
                                    </Typography>
                                )}
                                <Box
                                    sx={{
                                        width: '100%',
                                        maxWidth: 36,
                                        height: `${(datum.value / max) * (PLOT_HEIGHT - 24)}px`,
                                        minHeight: datum.value > 0 ? 4 : 0,
                                        backgroundColor: shadeFor(hue, datum.value, max),
                                        // Rounded at the data end, square on the baseline.
                                        borderRadius: '4px 4px 0 0',
                                    }}
                                />
                            </Box>
                            <Box sx={{ width: '100%', borderTop: `1px solid ${theme.palette.divider}` }} />
                            <Typography variant="caption" noWrap sx={{ mt: 0.75, opacity: 0.8, maxWidth: '100%' }}>
                                {datum.label}
                            </Typography>
                        </Box>
                    </Tooltip>
                ))}
            </Box>
            <ChartTable caption={caption} data={data} />
        </>
    );
}

export default ColumnChart;
