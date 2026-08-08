import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useTranslation } from 'react-i18next';

import { BarChart } from '@mui/x-charts/BarChart';
import { Box, Typography, useTheme } from '@mui/material';

type BarGraphProps = {
  genreCount: Record<string, number>;
};

const generateColor = (index: number) => {
  const hue = (index * 137) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

export default function GenreBarGraph({ genreCount }: BarGraphProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isLoading = useSelector(
    (state: RootState) =>
      state.favourites.loading ||
      state.watch.loadingWatchLater ||
      state.watch.loadingWatched,
  );

  const sortedData = Object.entries(genreCount)
    .map(([genre, count], index) => ({
      genre,
      count,
      color: generateColor(index),
    }))
    .sort((a, b) => b.count - a.count);

  if (isLoading) {
    return (
      <BarChart
        loading
        dataset={Array.from({ length: 8 }, (_, index) => ({
          genre: `Loading ${index + 1}`,
          count: 10 - index,
        }))}
        yAxis={[{ scaleType: 'band', dataKey: 'genre' }]}
        xAxis={[{}]}
        series={[{ dataKey: 'count', color: theme.palette.secondary.main }]}
        layout="horizontal"
        height={420}
      />
    );
  }

  if (sortedData.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={320}>
        <Typography variant="h6" color={theme.palette.text.secondary}>
          {t('profile.error_no_data')}
        </Typography>
      </Box>
    );
  }

  return (
    <BarChart
      dataset={sortedData}
      yAxis={[
        {
          scaleType: 'band',
          dataKey: 'genre',
          tickLabelStyle: {
            fill: theme.palette.text.primary,
            fontSize: 13,
            fontWeight: 600,
          },
        },
      ]}
      xAxis={[
        {
          tickLabelStyle: {
            fill: theme.palette.text.primary,
            fontWeight: 500,
          },
        },
      ]}
      series={[
        {
          dataKey: 'count',
          color: theme.palette.primary.main,
          valueFormatter: (value) => `${value}`,
        },
      ]}
      layout="horizontal"
      height={Math.max(360, sortedData.length * 36)}
      borderRadius={8}
      margin={{ left: 110, right: 24, top: 16, bottom: 36 }}
      slotProps={{
        legend: {
          hidden: true,
        },
      }}
    />
  );
}
