import { Box, Skeleton } from '@mui/material';
import { movieGridSx } from '../common/movieGridSx';

type CardSkeletonProps = {
    count?: number;
};

// Same grid and proportions as MovieCard, so loading doesn't shift the layout.
function CardSkeleton({ count = 5 }: CardSkeletonProps) {
    return (
        <Box sx={movieGridSx} aria-busy="true">
            {[...Array(count)].map((_, index) => (
                <Box key={index}>
                    <Skeleton variant="rounded" sx={{ borderRadius: '12px', width: '100%', height: 'auto', aspectRatio: '2 / 3' }} />
                    <Skeleton variant="text" sx={{ mt: 1, width: '80%' }} />
                    <Skeleton variant="text" sx={{ width: '30%' }} />
                </Box>
            ))}
        </Box>
    )
}

export default CardSkeleton;
