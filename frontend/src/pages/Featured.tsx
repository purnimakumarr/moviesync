import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useTranslation } from "react-i18next";

import WhatshotIcon from '@mui/icons-material/Whatshot';

import Carousel from "../components/featured/Carousel";
import CarouselSkeleton from "../components/featured/CarouselSkeleton";
import PageHeader from "../components/common/PageHeader";

import { FeaturedMovie } from "../types";
import { EmblaOptionsType } from "embla-carousel";

const OPTIONS: EmblaOptionsType = { loop: true, align: 'start', dragFree: true };

// Order of the carousels on the page; `tag` matches the featured data.
const SECTIONS = [
    { tag: 'Trending', title: 'trending.new_and_trending' },
    { tag: 'Romcoms', title: 'trending.romcoms' },
    { tag: 'Horror Sensations', title: 'trending.horror_sensations' },
    { tag: 'Hidden Gems', title: 'trending.hidden_gems' },
    { tag: 'Sci-Fi & Fantasy Hits', title: 'trending.sci_fi_and_fantasy' },
];

const Featured = () => {
    const { t } = useTranslation();
    const loading = useSelector((store: RootState) => store.featured.loading);
    const movies: FeaturedMovie[] = useSelector((store: RootState) => store.featured.movies);

    return (
        <>
            <PageHeader
                icon={<WhatshotIcon color="primary" />}
                title={t("header.featured")}
                subtitle={t("trending.explore_all_the_buzz_here")}
            />
            {SECTIONS.map(({ tag, title }) => {
                const slides = movies.filter((movie) => movie.tag === tag);
                if (loading) return <CarouselSkeleton key={tag} />;
                if (slides.length === 0) return null;
                return <Carousel key={tag} title={t(title)} slides={slides} options={OPTIONS} />;
            })}
        </>
    );
};

export default Featured;
