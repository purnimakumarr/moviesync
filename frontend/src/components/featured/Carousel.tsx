import React, { useEffect, useState } from 'react';

import { IconButton, Box, Stack, Typography, useTheme } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useTranslation } from 'react-i18next';

import MovieCard from '../common/MovieCard';

import { EmblaOptionsType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import { Movie } from '../../types';
import { movieKey } from '../../utils/tmdb';

import '../../embla.css';

type CarouselProps = {
    title: string;
    slides: Movie[];
    options?: EmblaOptionsType;
};

const Carousel: React.FC<CarouselProps> = ({ title, slides, options }) => {
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    const theme = useTheme();
    const { t } = useTranslation();

    const [emblaRef, emblaApi] = useEmblaCarousel(options);

    useEffect(() => {
        if (!emblaApi) return;

        const updateScrollState = () => {
            setCanScrollPrev(emblaApi.canScrollPrev());
            setCanScrollNext(emblaApi.canScrollNext());
        };

        emblaApi.on('select', updateScrollState);
        emblaApi.on('reInit', updateScrollState);
        updateScrollState();

        return () => {
            emblaApi.off('select', updateScrollState);
            emblaApi.off('reInit', updateScrollState);
        };
    }, [emblaApi]);

    const arrowSx = {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.iconsColor,
        '&:hover': { backgroundColor: theme.palette.headerIconsBackground },
        '&.Mui-disabled': { opacity: 0.4, backgroundColor: theme.palette.primary.main, color: theme.palette.iconsColor },
    };

    return (
        <Box component="section" aria-roledescription="carousel" aria-label={title} sx={{ mb: { xs: 4, md: 6 } }}>
            <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 1.5 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 800 }}>
                    {title}
                </Typography>
                {/* Touch screens swipe; arrows are for mouse and keyboard users. */}
                <Stack
                    direction="row"
                    gap={1}
                    sx={{ ml: 'auto', '@media (hover: none)': { display: 'none' } }}
                >
                    <IconButton
                        size="small"
                        aria-label={t('trending.previous')}
                        onClick={() => emblaApi?.scrollPrev()}
                        disabled={!canScrollPrev}
                        sx={arrowSx}
                    >
                        <ArrowBackIosNewIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        aria-label={t('trending.next')}
                        onClick={() => emblaApi?.scrollNext()}
                        disabled={!canScrollNext}
                        sx={arrowSx}
                    >
                        <ArrowForwardIosIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </Stack>

            <div className="embla">
                <div className="embla__viewport" ref={emblaRef}>
                    <div className="embla__container">
                        {slides.map((slide) => (
                            <div className="embla__slide" key={movieKey(slide)}>
                                <MovieCard movie={slide} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Box>
    );
};

export default Carousel;
