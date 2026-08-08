import { PieChart } from '@mui/x-charts/PieChart';
import { Box, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';

type ContentTypeDonutChartProps = {
  movieCount: number;
  seriesCount: number;
};

export default function ContentTypeDonutChart({
  movieCount,
  seriesCount,
}: ContentTypeDonutChartProps) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const total = movieCount + seriesCount;

  if (total === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={260}>
        <Typography variant="h6" color={theme.palette.text.secondary}>
          No watched titles yet.
        </Typography>
      </Box>
    );
  }

  const data = [
    { id: 0, value: movieCount, label: 'Movies', color: theme.palette.primary.main },
    { id: 1, value: seriesCount, label: 'TV Shows', color: theme.palette.secondary.main },
  ].filter((item) => item.value > 0);

  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <PieChart
        series={[
          {
            data,
            innerRadius: isSmallScreen ? 36 : 56,
            outerRadius: isSmallScreen ? 82 : 118,
            paddingAngle: 3,
            cornerRadius: 6,
            highlightScope: { fade: 'global', highlight: 'item' },
          },
        ]}
        height={isSmallScreen ? 220 : 280}
        slotProps={{ legend: { hidden: true } }}
      />
      <Stack direction="row" gap={2} sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
        {data.map((item) => (
          <Box key={item.id} display="flex" alignItems="center">
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: item.color,
                mr: 1,
              }}
            />
            <Typography variant="body2" fontWeight={600}>
              {item.label} ({Math.round((item.value / total) * 100)}%)
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
