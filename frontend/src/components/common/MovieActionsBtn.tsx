import { useState } from "react";
import { useAuth } from "react-oidc-context";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from '../../redux/store';
import { useTranslation } from 'react-i18next';

import { Box, IconButton, Tooltip, useTheme } from "@mui/material";
import WatchLaterIcon from "@mui/icons-material/WatchLater";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FavoriteIcon from "@mui/icons-material/Favorite";

import { addWatched, addWatchLater, deleteWatched, deleteWatchLater } from '../../redux/features/watchSlice';
import { addFavourite, deleteFavourite } from '../../redux/features/favouritesSlice';

import { MovieProps } from "../../types";

const MovieActionsBtn = ({ movie }: MovieProps) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const auth = useAuth();
    const userID = auth.user?.profile.email || null;

    const isFavourite = useSelector((state: RootState) => state.favourites.details[movie.imdbID] ? true : false);
    const isWatchLater = useSelector((state: RootState) => state.watch.watchLater[movie.imdbID] ? true : false);
    const isWatched = useSelector((state: RootState) => state.watch.watched[movie.imdbID] ? true : false);

    const [loadingFavourite, setLoadingFavourite] = useState(false);
    const [loadingWatchLater, setLoadingWatchLater] = useState(false);
    const [loadingWatched, setLoadingWatched] = useState(false);

    const handleToggleFavourite = async function () {
        setLoadingFavourite(true);
        try {
            if (isFavourite) {
                await dispatch(deleteFavourite({ userID, imdbID: movie.imdbID })).unwrap();
            } else {
                await dispatch(addFavourite({ userID, imdbID: movie.imdbID })).unwrap();
            }
        } finally {
            setLoadingFavourite(false);
        }
    }

    const handleToggleWatchLater = async function () {
        setLoadingWatchLater(true);
        try {
            if (isWatchLater) {
                await dispatch(deleteWatchLater({ userID, imdbID: movie.imdbID })).unwrap();
            } else {
                await dispatch(addWatchLater({ userID, imdbID: movie.imdbID })).unwrap();
            }
        } finally {
            setLoadingWatchLater(false);
        }
    }

    const handleToggleWatched = async function () {
        setLoadingWatched(true);
        try {
            if (isWatched) {
                await dispatch(deleteWatched({ userID, imdbID: movie.imdbID })).unwrap();
            } else {
                await dispatch(addWatched({ userID, imdbID: movie.imdbID })).unwrap();
            }
        } finally {
            setLoadingWatched(false);
        }
    }

    return <>
        <Tooltip title={isFavourite ? t('movie_actions_btn.remove_from_favourites') : t('movie_actions_btn.add_to_favourites')}>
            <Box component='span'>
                <IconButton disabled={loadingFavourite} onClick={handleToggleFavourite} sx={{
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
                    color: isFavourite ? theme.palette.favouriteIcon : theme.palette.iconsColor,
                }}>
                    <FavoriteIcon />
                </IconButton>
            </Box>
        </Tooltip>
        <Tooltip title={isWatchLater ? t('movie_actions_btn.remove_from_watch_later') : t('movie_actions_btn.add_to_watch_later')}>
            <Box component='span'>
                <IconButton disabled={loadingWatchLater} sx={{
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
                    color: isWatchLater ? theme.palette.watchLaterIcon : theme.palette.iconsColor,
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
                <IconButton disabled={loadingWatched} sx={{
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
                    color: isWatched ? theme.palette.watchedIcon : theme.palette.iconsColor,
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