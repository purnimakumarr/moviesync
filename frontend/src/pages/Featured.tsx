import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useTranslation } from "react-i18next";

import { Typography, Stack, Box, useTheme, CircularProgress } from "@mui/material";
import BackButton from "../components/common/BackButton";
import WhatshotIcon from '@mui/icons-material/Whatshot';

import Carousel from "../components/featured/Carousel";

import { FeaturedMovie } from "../types";
import { EmblaOptionsType } from "embla-carousel";

const Featured = () => {
    const theme = useTheme();
    const { t } = useTranslation();

    const OPTIONS: EmblaOptionsType = { loop: true };
    const loading = useSelector((store: RootState) => store.featured.loading);

    const SLIDES: FeaturedMovie[] = useSelector((store: RootState) => store.featured.movies);

    const SLIDES_TRENDING = useMemo(
        () => SLIDES.filter((movie) => movie.tag === 'Trending'),
        [SLIDES]
    );

    const SLIDES_HORROR = useMemo(
        () => SLIDES.filter((movie) => movie.tag === 'Horror Sensations'),
        [SLIDES]
    );

    const SLIDES_ROMCOM = useMemo(
        () => SLIDES.filter((movie) => movie.tag === 'Romcoms'),
        [SLIDES]
    );

    const SLIDES_HIDDEN_GEMS = useMemo(
        () => SLIDES.filter((movie) => movie.tag === 'Hidden Gems'),
        [SLIDES]
    );

    const SLIDES_SCIFI_FANTASY = useMemo(
        () => SLIDES.filter((movie) => movie.tag === 'Sci-Fi & Fantasy Hits'),
        [SLIDES]
    );


    return (
        <>
            <BackButton />
            <Stack className="test" direction='row' gap={2} sx={{
                justifyContent: "center",
                alignItems: "center",
                mb: '4rem',
            }}>
                <WhatshotIcon color="primary" fontSize="large" />
                <Typography variant="h4" sx={{ fontSize: "clamp(1rem, 2vw, 2rem)", textTransform: 'uppercase', fontWeight: 600, color: theme.palette.primary.main }}>{t("trending.explore_all_the_buzz_here")}</Typography>
                <WhatshotIcon color="primary" fontSize="large" />
            </Stack >

            <Stack gap={2} sx={{
                justifyContent: "center",
                alignItems: "center",
                mb: '3rem',
            }}>
                <Typography variant="h4" sx={{ fontWeight: 600, fontSize: "clamp(1rem, 2vw, 1.4rem)" }}>{t("trending.new_and_trending")}</Typography>
                {!loading ? <Carousel slides={SLIDES_TRENDING} options={OPTIONS} /> :
                    <Box component='div' sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "28rem",
                        width: "100%"
                    }}>
                        <CircularProgress color="primary" sx={{ mb: '2rem' }} />
                    </Box>
                }
            </Stack>

            <Stack gap={2} sx={{
                justifyContent: "center",
                alignItems: "center",
                mb: '3rem'
            }}>
                <Typography variant="h4" sx={{ fontWeight: 600, fontSize: "clamp(1rem, 2vw, 1.4rem)" }}>{t("trending.romcoms")}</Typography>
                {!loading ? <Carousel options={OPTIONS} slides={SLIDES_ROMCOM} /> :
                    <Box component='div' sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "28rem",
                        width: "100%"
                    }}>
                        <CircularProgress color="primary" sx={{ mb: '2rem' }} />
                    </Box>
                }
            </Stack>

            <Stack gap={2} sx={{
                justifyContent: "center",
                alignItems: "center",
                mb: '3rem'
            }}>
                <Typography variant="h4" sx={{ fontWeight: 600, fontSize: "clamp(1rem, 2vw, 1.4rem)" }}>{t("trending.horror_sensations")}</Typography>
                {!loading ? <Carousel slides={SLIDES_HORROR} options={OPTIONS} /> :
                    <Box component='div' sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "28rem",
                        width: "100%"
                    }}>
                        <CircularProgress color="primary" sx={{ mb: '2rem' }} />
                    </Box>
                }
            </Stack>

            <Stack gap={2} sx={{
                justifyContent: "center",
                alignItems: "center",
                mb: '3rem'
            }}>
                <Typography variant="h4" sx={{ fontWeight: 600, fontSize: "clamp(1rem, 2vw, 1.4rem)" }}>{t("trending.hidden_gems")}</Typography>
                {!loading ? <Carousel slides={SLIDES_HIDDEN_GEMS} options={OPTIONS} /> :
                    <Box component='div' sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "28rem",
                        width: "100%"
                    }}>
                        <CircularProgress color="primary" sx={{ mb: '2rem' }} />
                    </Box>
                }
            </Stack>

            <Stack gap={2} sx={{
                justifyContent: "center",
                alignItems: "center",
                mb: '3rem'
            }}>
                <Typography variant="h4" sx={{ fontWeight: 600, fontSize: "clamp(1rem, 2vw, 1.4rem)" }}>{t("trending.sci_fi_and_fantasy")}</Typography>
                {!loading ? <Carousel slides={SLIDES_SCIFI_FANTASY} options={OPTIONS} /> :
                    <Box component='div' sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "28rem",
                        width: "100%"
                    }}>
                        <CircularProgress color="primary" sx={{ mb: '2rem' }} />
                    </Box>
                }
            </Stack>
        </>
    );
};

export default Featured;
