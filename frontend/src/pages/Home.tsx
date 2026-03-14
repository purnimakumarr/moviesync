import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { useIsAuthenticated } from "../auth/authHooks";

import { Typography, Button, Stack, Box, useTheme } from "@mui/material";
// import MovieFilterIcon from "@mui/icons-material/MovieFilter";
import LoginIcon from "@mui/icons-material/Login";
import Cinema from '../../src/assets/cinema.png';

import AnimatedBackground from "../components/common/AnimatedComponent";

const Home = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const theme = useTheme();
    const auth = useAuth();
    const isAuthenticated = useIsAuthenticated();

    return (
        <>
            <AnimatedBackground />
            <Stack gap={2} sx={{
                justifyContent: "center",
                alignItems: "center",
                height: '82vh',
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                    <Box
                        component="img"
                        src={Cinema}
                        alt="MovieSync Logo"
                        sx={{ width: '10%', height: 'auto', borderRadius: 2 }}
                    />

                    <Typography sx={{ fontSize: "clamp(2rem, 4vw, 6rem)", fontFamily: "Luckiest Guy, DM Sans, sans-serif", color: theme.palette.primary.main }}
                        variant="h1" fontWeight="700">{t("app.app_title")}</Typography>
                </Box>
                <Typography sx={{ fontSize: "clamp(0.8rem, 2vw, 1.8rem)" }} variant="h6" color="text.secondary">{t("home.tagline")}</Typography>
                <Stack direction='row' gap={2}>
                    {!isAuthenticated &&
                        <Button
                            variant="outlined"
                            startIcon={<LoginIcon />}
                            onClick={() => auth.signinRedirect()}
                            size="large"
                            sx={{
                                fontSize: { xs: "0.4rem", sm: "0.6rem", md: "0.8rem", lg: "1rem" },
                                padding: { xs: "6px 12px", sm: "8px 16px", md: "10px 20px", lg: "12px 24px" },
                                minWidth: { xs: "60px", sm: "80px", md: "100px", lg: "120px" },
                                fontWeight: 600
                            }}
                        >
                            {t("app.sign_in")}
                        </Button>
                    }
                    <Button
                        variant="contained"
                        size="large"
                        sx={{
                            fontSize: { xs: "0.4rem", sm: "0.6rem", md: "0.8rem", lg: "1rem" },
                            padding: { xs: "6px 12px", sm: "8px 16px", md: "10px 20px", lg: "12px 24px" },
                            minWidth: { xs: "60px", sm: "80px", md: "100px", lg: "120px" },
                            fontWeight: 600
                        }}
                        onClick={() => navigate(`/search`)}
                    >
                        {t("app.start_searching")}
                    </Button>
                </Stack>
            </Stack >
        </>
    );
};

export default Home;
