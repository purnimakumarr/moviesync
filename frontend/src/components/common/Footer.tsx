import { useTranslation } from "react-i18next";
import { Box, Typography, useTheme } from "@mui/material";

const Footer = () => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <Box
            component="footer"
            sx={{
                position: 'sticky',
                textAlign: "center",
                py: 2,
                mt: 'auto',
                bottom: 0,
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.text.tertiary,
            }}
        >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                © {new Date().getFullYear()} {t("footer.text")}
            </Typography>
        </Box>
    );
};

export default Footer;

