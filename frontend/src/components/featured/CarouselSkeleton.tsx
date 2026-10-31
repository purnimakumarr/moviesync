import { Box, Skeleton, Stack } from '@mui/material';

type CarouselSkeletonProps = {
    // Show a section title placeholder above the slides.
    withTitle?: boolean;
    count?: number;
};

// Same slide size as the Carousel, so loading doesn't shift the layout.
function CarouselSkeleton({ withTitle = true, count = 6 }: CarouselSkeletonProps) {
    return (
        <Box sx={{ mb: { xs: 4, md: 6 } }} aria-busy="true">
            {withTitle && <Skeleton variant="text" sx={{ width: 200, fontSize: '1.5rem', mb: 1.5 }} />}
            <Stack direction="row" gap={2} sx={{ overflow: 'hidden' }}>
                {[...Array(count)].map((_, index) => (
                    <Box key={index} sx={{ flex: '0 0 clamp(140px, 40vw, 220px)' }}>
                        <Skeleton variant="rounded" sx={{ height: 'auto', aspectRatio: '2 / 3', borderRadius: '12px' }} />
                        <Skeleton variant="text" sx={{ mt: 1, width: '80%' }} />
                        <Skeleton variant="text" sx={{ width: '30%' }} />
                    </Box>
                ))}
            </Stack>
        </Box>
    );
}

export default CarouselSkeleton;
