import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from '../../redux/store';
import { useTranslation } from 'react-i18next';

import { Box, IconButton, Tooltip, useTheme } from "@mui/material";
import WatchLaterIcon from "@mui/icons-material/WatchLater";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FavoriteIcon from "@mui/icons-material/Favorite";

import { addWatched, addWatchLater, deleteWatched, deleteWatchLater } from '../../redux/features/watchSlice';
import { addFavourite, deleteFavourite } from '../../redux/features/favouritesSlice';

import { Movie } from "../../types";
import { movieKey } from "../../utils/tmdb";

type MovieActionsBtnProps = {
    movie: Movie;
    // "small" fits the buttons inside movie cards.
    size?: "small" | "medium";
};

const MovieActionsBtn = ({ movie, size = "medium" }: MovieActionsBtnProps) => {
    const theme = useTheme();
    const inactiveColor = theme.palette.listIconColor ?? theme.palette.iconsColor;
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();

    const key = movieKey(movie);
    const ref = { id: movie.id, media_type: movie.media_type };
    const isFavourite = useSelector((state: RootState) => state.favourites.details[key] ? true : false);
    const isWatchLater = useSelector((state: RootState) => state.watch.watchLater[key] ? true : false);
    const isWatched = useSelector((state: RootState) => state.watch.watched[key] ? true : false);

    const [loadingFavourite, setLoadingFavourite] = useState(false);
    const [loadingWatchLater, setLoadingWatchLater] = useState(false);
    const [loadingWatched, setLoadingWatched] = useState(false);

    // Failures are stored in the slice's error state and shown by the pages,
    // so the handlers only wait for completion and never rethrow.
    const handleToggleFavourite = async function () {
        setLoadingFavourite(true);
        try {
            if (isFavourite) {
                await dispatch(deleteFavourite(ref));
            } else {
                await dispatch(addFavourite(ref));
            }
        } finally {
            setLoadingFavourite(false);
        }
    }

    const handleToggleWatchLater = async function () {
        setLoadingWatchLater(true);
        try {
            if (isWatchLater) {
                await dispatch(deleteWatchLater(ref));
            } else {
                await dispatch(addWatchLater(ref));
            }
        } finally {
            setLoadingWatchLater(false);
        }
    }

    const handleToggleWatched = async function () {
        setLoadingWatched(true);
        try {
            if (isWatched) {
                await dispatch(deleteWatched(ref));
            } else {
                await dispatch(addWatched(ref));
            }
        } finally {
            setLoadingWatched(false);
        }
    }

    return <>
        <Tooltip title={isFavourite ? t('movie_actions_btn.remove_from_favourites') : t('movie_actions_btn.add_to_favourites')}>
            <Box component='span'>
                <IconButton size={size} aria-label={isFavourite ? t('movie_actions_btn.remove_from_favourites') : t('movie_actions_btn.add_to_favourites')} aria-pressed={isFavourite} disabled={loadingFavourite} onClick={handleToggleFavourite} sx={{
                    "&:hover": { backgroundColor: theme.palette.iconsBackgroundHover },
                    background: loadingFavourite
                        ? `linear-gradient(90deg, 
                        ${theme.palette.secondary.main} 25%, 
                        ${theme.palette.iconsBackgroundHover} 50%, 
                        ${theme.palette.secondary.main} 75%)`
                        : theme.palette.iconsBackground,
                    backgroundSize: "200% 100%",
                    animation: loadingFavourite ? "shimmer 1.5s ease-in-out infinite" : "none",
                    "@keyframes shimmer": {
                        "0%": { backgroundPosition: "-200% 0" },
                        "100%": { backgroundPosition: "200% 0" },
                    },
                    color: isFavourite ? theme.palette.favouriteIcon : inactiveColor,
                }}>
                    <FavoriteIcon />
                </IconButton>
            </Box>
        </Tooltip>
        <Tooltip title={isWatchLater ? t('movie_actions_btn.remove_from_watch_later') : t('movie_actions_btn.add_to_watch_later')}>
            <Box component='span'>
                <IconButton size={size} aria-label={isWatchLater ? t('movie_actions_btn.remove_from_watch_later') : t('movie_actions_btn.add_to_watch_later')} aria-pressed={isWatchLater} disabled={loadingWatchLater} sx={{
                    "&:hover": {
                        backgroundColor: theme.palette.iconsBackgroundHover
                    },
                    background: loadingWatchLater
                        ? `linear-gradient(90deg, 
                        ${theme.palette.secondary.main} 25%, 
                        ${theme.palette.iconsBackgroundHover} 50%, 
                        ${theme.palette.secondary.main} 75%)`
                        : theme.palette.iconsBackground,
                    backgroundSize: "200% 100%",
                    color: isWatchLater ? theme.palette.watchLaterIcon : inactiveColor,
                    animation: loadingWatchLater ? "shimmer 1.5s ease-in-out infinite" : "none",
                    "@keyframes shimmer": {
                        "0%": { backgroundPosition: "-200% 0" },
                        "100%": { backgroundPosition: "200% 0" }
                    }
                }} onClick={handleToggleWatchLater} >
                    <WatchLaterIcon />
                </IconButton>
            </Box>
        </Tooltip >
        <Tooltip title={isWatched ? t('movie_actions_btn.remove_from_watched') : t('movie_actions_btn.add_to_watched')}>
            <Box component='span'>
                <IconButton size={size} aria-label={isWatched ? t('movie_actions_btn.remove_from_watched') : t('movie_actions_btn.add_to_watched')} aria-pressed={isWatched} disabled={loadingWatched} sx={{
                    "&:hover": {
                        backgroundColor: theme.palette.iconsBackgroundHover
                    },
                    background: loadingWatched
                        ? `linear-gradient(90deg, 
                        ${theme.palette.secondary.main} 25%, 
                        ${theme.palette.iconsBackgroundHover} 50%, 
                        ${theme.palette.secondary.main} 75%)`
                        : theme.palette.iconsBackground,
                    backgroundSize: "200% 100%",
                    color: isWatched ? theme.palette.watchedIcon : inactiveColor,
                    animation: loadingWatched ? "shimmer 1.5s ease-in-out infinite" : "none",
                    "@keyframes shimmer": {
                        "0%": { backgroundPosition: "-200% 0" },
                        "100%": { backgroundPosition: "200% 0" }
                    }
                }} onClick={handleToggleWatched}>
                    <CheckCircleIcon />
                </IconButton>
            </Box>
        </Tooltip>
    </>;
}


export default MovieActionsBtn;