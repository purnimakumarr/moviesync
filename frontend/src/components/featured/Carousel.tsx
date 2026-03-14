import React, { useEffect, useState } from 'react';

import { IconButton, Box, useTheme } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import MovieCard from '../common/MovieCard';

import { EmblaOptionsType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import { Movie } from '../../types';

import '../../embla.css';

type CarouselProps = {
    slides: Movie[];
    options?: EmblaOptionsType;
};

const Carousel: React.FC<CarouselProps> = ({ slides, options }) => {
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    const theme = useTheme();

    const [emblaRef, emblaApi] = useEmblaCarousel(options);

    useEffect(() => {
        if (!emblaApi) return;

        const updateScrollState = () => {
            setCanScrollPrev(emblaApi.canScrollPrev());
            setCanScrollNext(emblaApi.canScrollNext());
        };

        emblaApi.on('select', updateScrollState);
        updateScrollState();

        return () => {
            emblaApi.off('select', updateScrollState);
        };
    }, [emblaApi]);

    return (
        <Box className="embla" sx={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '2rem' }}>
            <IconButton
                onClick={() => emblaApi && emblaApi.scrollPrev()}
                disabled={!canScrollPrev}
                sx={{
                    padding: '1rem', position: 'absolute', left: '0', zIndex: 10, backgroundColor: theme.palette.primary.main, color: theme.palette.iconsColor, "&:hover": {
                        backgroundColor: theme.palette.primary.main
                    }
                }}
            >
                <ArrowBackIosNewIcon />
            </IconButton>

            <div className="embla__viewport" ref={emblaRef}>
                <div className="embla__container">
                    {slides.map((slide) => (
                        <div className="embla__slide" key={slide.imdbID}>
                            <MovieCard movie={slide} />
                        </div>
                    ))}
                </div>
            </div>

            <IconButton
                onClick={() => emblaApi && emblaApi.scrollNext()}
                disabled={!canScrollNext}
                sx={{
                    padding: '1rem', position: 'absolute', right: '0', zIndex: 10, backgroundColor: theme.palette.primary.main, color: theme.palette.iconsColor, "&:hover": {
                        backgroundColor: theme.palette.primary.main
                    }
                }}
            >
                <ArrowForwardIosIcon />
            </IconButton>
        </Box>
    );
};

export default Carousel;

