import { Skeleton } from '@mui/material';
import Grid from '@mui/material/Grid2';

type CardSkeletonProps = {
    count?: number;
};

function CardSkeleton({ count = 5 }: CardSkeletonProps) {
    return (
        <Grid container spacing={2} size={{ xs: 8 }} sx={{ maxWidth: '1800px', margin: '0 auto', alignItems: 'center', justifyContent: 'center' }}>
            {[...Array(count)].map((_, index) => (
                <Skeleton sx={{ borderRadius: '12px' }} variant="rounded" height={450} width={300} key={index} />
            ))}
        </Grid>
    )
}

export default CardSkeleton;