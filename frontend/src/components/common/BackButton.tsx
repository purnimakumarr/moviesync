import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { IconButton, useTheme } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const BackButton = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <IconButton sx={{
            alignItems: 'center',
            width: 'fit-content',
            transition: "0.3s",
            display: 'flex',
            gap: '12px',
            marginY: '2rem',
            color: theme.palette.primary.main,
            "&:hover": {
                transform: "scale(1.05)",
                cursor: 'pointer',
                backgroundColor: 'transparent'
            }
        }} onClick={() => navigate(-1)}>
            <ArrowBackIcon />
            <span className="back-text">{t("app.back")}</span>
        </IconButton>
    );
};

export default BackButton;