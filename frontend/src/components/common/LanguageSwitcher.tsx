import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Select, MenuItem, SelectChangeEvent, Tooltip, useMediaQuery, useTheme, ListItem, ListItemButton, Menu, ListItemIcon, ListItemText } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";

const LANGUAGE_FLAGS: Record<string, string> = { en: '🇬🇧', hi: '🇮🇳', it: '🇮🇹', ja: '🇯🇵', fr: '🇫🇷' };

const LanguageSwitcher = () => {
    const { i18n, t } = useTranslation();
    const theme = useTheme();

    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (event?: React.SyntheticEvent | object, lang?: string) => {
        if (event && "stopPropagation" in event) event.stopPropagation();
        setAnchorEl(null);
        if (lang) i18n.changeLanguage(lang);
    };

    return isMobile ? (
        <>
            {/* Mobile Version - Drawer Menu */}
            <ListItem disablePadding>
                <ListItemButton onClick={handleClick}>
                    <ListItemIcon sx={{
                        color: theme.palette.iconsColor
                    }}><LanguageIcon /></ListItemIcon>
                    <ListItemText sx={{
                        color: theme.palette.iconsColor
                    }} primary={t("header.switch_language")} />
                </ListItemButton>
            </ListItem>
            <Menu anchorEl={anchorEl} open={open} onClose={(event,) => handleClose(event)} keepMounted>
                <MenuItem onClick={(event) => handleClose(event, "en")}>🇬🇧 English</MenuItem>
                <MenuItem onClick={(event) => handleClose(event, "hi")}>🇮🇳 हिंदी</MenuItem>
                <MenuItem onClick={(event) => handleClose(event, "it")}>🇮🇹 Italiano</MenuItem>
                <MenuItem onClick={(event) => handleClose(event, "ja")}>🇯🇵 日本語</MenuItem>
                <MenuItem onClick={(event) => handleClose(event, "fr")}>🇫🇷 Français</MenuItem>
            </Menu>
        </>
    ) : (
        /* Desktop Version */
        <Tooltip title={t("header.switch_language")} placement="left">
            <Select
                sx={{ borderRadius: '12px' }}
                value={i18n.language}
                onChange={(event: SelectChangeEvent<string>) => i18n.changeLanguage(event.target.value as string)}
                // Compact in the header: flag and language code.
                renderValue={(value) => {
                    const code = value.split('-')[0];
                    return `${LANGUAGE_FLAGS[code] ?? ''} ${code.toUpperCase()}`;
                }}
                inputProps={{ 'aria-label': t("header.switch_language") }}
                size="small"
            >
                <MenuItem value="en">🇬🇧 English</MenuItem>
                <MenuItem value="hi">🇮🇳 हिंदी</MenuItem>
                <MenuItem value="it">🇮🇹 Italiano</MenuItem>
                <MenuItem value="ja">🇯🇵 日本語</MenuItem>
                <MenuItem value="fr">🇫🇷 Français</MenuItem>
            </Select>
        </Tooltip>
    );
};

export default LanguageSwitcher;
