import { WordCloud } from '@isoterik/react-word-cloud';
import { Box, Typography, useTheme } from '@mui/material';

type PeopleWordCloudProps = {
  words: { text: string; value: number }[];
};

export default function PeopleWordCloud({ words }: PeopleWordCloudProps) {
  const theme = useTheme();

  if (words.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={300}>
        <Typography variant="h6" color={theme.palette.text.secondary}>
          No actor or director data yet.
        </Typography>
      </Box>
    );
  }

  const maxValue = Math.max(...words.map((word) => word.value));

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: 320,
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <WordCloud
        words={words}
        width={760}
        height={320}
        padding={4}
        rotate={() => 0}
        font="DM Sans"
        fontWeight={(word) => (word.value === maxValue ? 800 : 600)}
        fontSize={(word) => 16 + (word.value / maxValue) * 34}
        fill={(_, index) =>
          index % 3 === 0
            ? theme.palette.primary.main
            : index % 3 === 1
              ? theme.palette.secondary.main
              : theme.palette.text.primary
        }
        svgProps={{ role: 'img', 'aria-label': 'Most watched actors and directors' }}
      />
    </Box>
  );
}
