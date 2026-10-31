import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { useTranslation } from 'react-i18next';

import { Box, useMediaQuery, useTheme } from '@mui/material';
import SearchIcon from "@mui/icons-material/Search";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";

import { useNotification } from '../components/common/Notification';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import MovieGrid from '../components/common/MovieGrid';
import MovieCard from '../components/common/MovieCard';
import SearchBar from '../components/search/SearchBar';
import CardSkeleton from '../components/search/CardSkeleton';
import PaginationComponent from '../components/search/PaginationComponent';

import { fetchMovies, setPage, setTitle, setType, setYear, clearSearch, DEFAULT_PAGE_SIZE } from '../redux/features/moviesSlice';

const LAPTOP_PAGE_SIZE = 12;

import i18next from 'i18next';
import { movieKey } from '../utils/tmdb';

function Search() {

    const { search: movies, totalPages, loading, error, page, title, year, type } = useSelector((store: RootState) => store.movies);
    const dispatch = useDispatch<AppDispatch>();
    const { notify } = useNotification();

    const { t } = useTranslation();
    const theme = useTheme();

    useEffect(() => {
        if (error) {
            notify({
                message: i18next.exists(error) ? t(error) : error,
                severity: 'error',
            });
        }
    }, [error, notify, t])

    // Laptops show 6 posters per row, so 12 results fill two complete rows.
    const isLaptop = useMediaQuery(theme.breakpoints.up('lg'));
    const pageSize = isLaptop ? LAPTOP_PAGE_SIZE : DEFAULT_PAGE_SIZE;

    const handleSearch = async function () {
        dispatch(fetchMovies(pageSize))
    }

    const handlePageChange = function (_event: unknown, value: number) {
        dispatch(setPage(value));
        handleSearch();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const resetSearchBar = function () {
        dispatch(clearSearch());
    }

    return (
        <>
            <PageHeader icon={<SearchIcon color="primary" />} title={t("search.lights_camera_search")} />
            <Box sx={{
                mb: { xs: 3, md: 5 },
                borderRadius: '16px',
                backgroundColor: theme.palette.searchBarBg,
                p: { xs: 2, md: 3 },
                boxShadow: 4,
                border: `2px solid ${theme.palette.primary.main}`,
            }}>
                <SearchBar title={title}
                    setTitle={(val) => dispatch(setTitle(val))}
                    year={year}
                    setYear={(val) => dispatch(setYear(val))}
                    type={type}
                    setType={(val) => dispatch(setType(val))}
                    handleSearch={handleSearch}
                    resetSearchBar={resetSearchBar} />
            </Box>

            {!loading && movies.length === 0 &&
                <EmptyState
                    icon={<TravelExploreIcon />}
                    title={t("search.empty_title")}
                    description={t("search.placeholder_text")}
                />
            }

            {loading && <CardSkeleton count={pageSize} />}
            {!loading && !error && movies.length > 0 && (
                <MovieGrid label={t("search.results")}>
                    {movies.map((movie) => (
                        <MovieCard movie={movie} key={movieKey(movie)} />
                    ))}
                </MovieGrid>
            )}
            {!loading && !error && movies.length > 0 && <PaginationComponent totalPages={totalPages} page={page} handlePageChange={handlePageChange} />}
        </>
    )
}

export default Search;
