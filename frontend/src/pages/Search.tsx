import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { useTranslation } from 'react-i18next';

import { Typography, Box, useTheme } from '@mui/material';
import MovieIcon from "@mui/icons-material/Movie";

import Notification from '../components/common/Notification';
import BackButton from '../components/common/BackButton';
import SearchBar from '../components/search/SearchBar';
import CardSkeleton from '../components/search/CardSkeleton';
import MovieGallery from '../components/search/MovieGallery';
import PaginationComponent from '../components/search/PaginationComponent';

import { fetchMovies, setPage, setTitle, setType, setYear, clearSearch } from '../redux/features/moviesSlice';

import i18next from 'i18next';

function Search() {

    const { search: movies, totalPages, loading, error, page, title, year, type } = useSelector((store: RootState) => store.movies);
    const dispatch = useDispatch<AppDispatch>();
    const [open, setOpen] = useState(false);

    const { t } = useTranslation();
    const theme = useTheme();

    useEffect(() => {
        if (error) {
            setOpen(true);
        }
    }, [error])

    const handleSearch = async function () {
        dispatch(fetchMovies())
    }

    const handlePageChange = function (_event: unknown, value: number) {
        dispatch(setPage(value));
        handleSearch();
    }

    const resetSearchBar = function () {
        dispatch(clearSearch());
    }

    return (
        <>
            <BackButton />
            <Typography variant='h4' id='app-title' sx={{ fontSize: "clamp(1.2rem, 4vw, 1.8rem)", marginY: 4, textAlign: 'center', fontWeight: '700' }}>{t("search.lights_camera_search")} 🕵️</Typography>
            <Box sx={{ maxWidth: "1000px", margin: '48px auto 48px  auto', borderRadius: '12px', backgroundColor: theme.palette.searchBarBg, padding: 2, boxShadow: 4, border: `2px solid ${theme.palette.primary.main}` }}>
                <SearchBar title={title}
                    setTitle={(val) => dispatch(setTitle(val))}
                    year={year}
                    setYear={(val) => dispatch(setYear(val))}
                    type={type}
                    setType={(val) => dispatch(setType(val))}
                    handleSearch={handleSearch}
                    resetSearchBar={resetSearchBar} />
            </Box >

            {!loading && movies.length === 0 &&
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "50vh",
                        textAlign: "center",
                        color: "text.secondary",
                    }}
                >
                    <MovieIcon sx={{ fontSize: 80, color: "primary.main", mb: 2 }} />
                    <Typography variant="body2">
                        {t("search.placeholder_text")}
                    </Typography>
                </Box>
            }

            {
                error &&
                <Notification open={open} message={i18next.exists(error) ? t(error) : error} severity='error' handleClose={() => setOpen(false)} />
            }

            {loading && <CardSkeleton count={10} />}
            {!loading && !error && <MovieGallery movies={movies} />}
            {!loading && !error && movies.length > 0 && <PaginationComponent totalPages={totalPages} page={page} handlePageChange={handlePageChange} />}
        </>
    )
}

export default Search;
