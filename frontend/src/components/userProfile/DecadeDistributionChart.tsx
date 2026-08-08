import { BarChart } from '@mui/x-charts/BarChart';
import { Box, Typography, useTheme } from '@mui/material';

type DecadeDistributionChartProps = {
  data: { decade: string; count: number }[];
};

export default function DecadeDistributionChart({
  data,
}: DecadeDistributionChartProps) {
  const theme = useTheme();

  if (data.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={260}>
        <Typography variant="h6" color={theme.palette.text.secondary}>
          No release-year data yet.
        </Typography>
      </Box>
    );
  }

  return (
    <BarChart
      dataset={data}
      xAxis={[
        {
          scaleType: 'band',
          dataKey: 'decade',
          tickLabelStyle: {
            fill: theme.palette.text.primary,
            fontWeight: 600,
          },
        },
      ]}
      yAxis={[
        {
          tickLabelStyle: {
            fill: theme.palette.text.primary,
            fontWeight: 500,
          },
        },
      ]}
      series={[{ dataKey: 'count', color: theme.palette.secondary.main }]}
      height={300}
      borderRadius={8}
      margin={{ left: 48, right: 20, top: 20, bottom: 40 }}
      slotProps={{ legend: { hidden: true } }}
    />
  );
}
