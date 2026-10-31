import { ReactNode } from 'react';
import { Box } from '@mui/material';
import { movieGridSx } from './movieGridSx';

type MovieGridProps = {
    children: ReactNode;
    label?: string;
};

function MovieGrid({ children, label }: MovieGridProps) {
    return (
        <Box component="section" aria-label={label} sx={movieGridSx}>
            {children}
        </Box>
    );
}

export default MovieGrid;
