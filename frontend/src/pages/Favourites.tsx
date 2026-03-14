import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from "../redux/store";
import { useTranslation } from 'react-i18next';

import { Typography, Stack, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Box, CircularProgress, useTheme } from '@mui/material';
import Grid from '@mui/material/Grid2';
import FavoriteIcon from "@mui/icons-material/Favorite";

import Notification from '../components/common/Notification';
import MovieCard from '../components/common/MovieCard';
import BackButton from '../components/common/BackButton';

import { clearFavourites } from '../redux/features/favouritesSlice';

import i18next from 'i18next';

const Favourites = () => {
    const { userID } = useSelector((store: RootState) => store.user);

    const theme = useTheme();
    const { details: favourites, loading, error } = useSelector((state: RootState) => state.favourites);
    const numFavourites = useSelector((state: RootState) => Object.keys(state.favourites.details).length);
    const dispatch = useDispatch<AppDispatch>();

    const [openConfirmModal, setOpenConfirmModal] = useState<boolean>(false);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        if (error) {
            setOpen(true);
        }
    }, [error])

    const handleConfirmClear = function () {
        setOpenConfirmModal(false);
        dispatch(clearFavourites(userID));
    };

    return (
        <>
            <BackButton />
            <Stack gap={3} sx={{ width: '100%', margin: '0 auto', mb: 8, alignItems: 'center', justifyContent: 'center' }}>
                {!loading &&
                    < Stack direction='row' gap={2} sx={{ justifyContent: 'center', alignItems: 'center' }}>
                        <FavoriteIcon sx={{ color: theme.palette.favouriteIcon, fontSize: "clamp(1.6rem, 6vw, 2.4rem)" }} />
                        <Typography variant='h4' id='app-title' sx={{ fontSize: "clamp(1.4rem, 6vw, 2rem)", textAlign: 'center', fontWeight: '700' }}>
                            {t("favourites.favourites")} ({numFavourites})
                        </Typography>
                    </Stack>
                }
                {!loading && numFavourites > 0 &&
                    <Button onClick={() => setOpenConfirmModal(true)} variant='contained' sx={{
                        fontSize: { sm: "0.8rem", lg: '1rem' },
                        padding: { xs: "6px 12px", sm: "8px 16px", md: "10px 20px", lg: "12px 24px" },
                        minWidth: { xs: "80px", sm: "100px", md: "120px", lg: "150px" },
                        fontWeight: 600
                    }}>{t("favourites.clear_favourites")}</Button>
                }
            </Stack>

            {error && <Notification open={open} message={i18next.exists(error) ? t(error) : error} severity='error' handleClose={() => setOpen(false)} />}

            {loading && <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                <CircularProgress color="primary" />
            </Box>}

            {
                !loading && <Grid
                    container
                    spacing={2}
                    sx={{
                        maxWidth: "100%",
                        margin: "1.8rem auto",
                        justifyContent: "center",
                    }}
                >
                    {numFavourites > 0 ? <Grid
                        size={12}
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "1.2rem",
                            justifyContent: 'center',
                            maxWidth: "90%",
                        }}
                    >{(
                        Object.values(favourites).map((movie) => (
                            <MovieCard movie={movie} key={movie.imdbID} />
                        ))
                    )}</Grid> : (
                        <Box>
                            <Typography variant="h6" color="textSecondary" sx={{ marginY: 4 }}>
                                {t("favourites.no_favourites_search")} 🎬
                            </Typography>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                sx={{
                                    fontSize: { sm: "0.8rem", lg: '1rem' },
                                    padding: { xs: "6px 12px", sm: "8px 16px", md: "10px 20px", lg: "12px 24px" },
                                    minWidth: { xs: "80px", sm: "100px", md: "120px", lg: "150px" },
                                    fontWeight: 600
                                }}
                                onClick={() => navigate(`/search`)}
                            >
                                {t("app.start_searching")}
                            </Button>
                        </Box>
                    )}
                </Grid>
            }


            <Dialog sx={{
                "& .MuiPaper-root": {
                    backgroundColor: theme.palette.background.default,
                    borderRadius: '12px',
                    color: theme.palette.text.primary,
                }
            }} open={openConfirmModal} onClose={() => setOpenConfirmModal(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{t("favourites.clear_favourites")}</DialogTitle>
                < DialogContent >
                    <DialogContentText>{t("favourites.confirm_clear_message")}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirmModal(false)} color="primary">
                        {t("favourites.cancel")}
                    </Button>
                    <Button sx={{
                        backgroundColor: theme.palette.primary.main,
                        "&:hover": {
                            backgroundColor: theme.palette.background.secondary
                        }
                    }} onClick={handleConfirmClear} variant="contained">
                        {t("favourites.confirm")}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Favourites;
