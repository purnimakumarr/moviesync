import { useState, useContext } from "react";
import { useTranslation } from "react-i18next";

import { Select, MenuItem, SelectChangeEvent, Tooltip, Stack, useTheme, useMediaQuery, ListItem, ListItemButton, ListItemIcon, ListItemText, Menu } from "@mui/material";
import PaletteIcon from '@mui/icons-material/Palette';

import { ThemeContext } from '../../theme/ThemeContext';
import { PaletteKey, paletteSwatches } from '../../theme/palettes';


const ThemeSwitcher = () => {
    const themeContext = useContext(ThemeContext);
    const { changePalette, selectedPalette } = themeContext;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const { t } = useTranslation();

    const themes = [
        { value: "melodic_haze", label: t("header.scarlet_frames") },
        { value: 'horror', label: t("header.dark_reel") },
        { value: 'classic', label: t("header.timeless") },
        { value: 'fantasy', label: t("header.enchanted") },
        { value: 'indie', label: t("header.indie_flick") },
        { value: 'theatre', label: t("header.broadway_lights") },
    ];

    const handleChangeTheme = (e: SelectChangeEvent<string>) => {
        changePalette(e.target.value as PaletteKey);
    };

    // Compact in the header: just the palette icon; names show in the menu.
    const handleRenderValue = () => (
        <Stack direction='row' sx={{ justifyContent: 'center', alignItems: 'center' }}>
            <PaletteIcon sx={{ fontSize: '1.5rem', color: 'primary.main' }} />
        </Stack>
    );

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (event?: React.MouseEvent<HTMLElement>, palette?: PaletteKey) => {
        if (event) event.stopPropagation();
        if (palette) changePalette(palette);
        setAnchorEl(null);
    };

    return isMobile ? (
        <>
            {/* Mobile Version - Drawer Menu */}
            <ListItem disablePadding>
                <ListItemButton onClick={handleClick}>
                    <ListItemIcon sx={{
                        color: theme.palette.iconsColor
                    }}><PaletteIcon /></ListItemIcon>
                    <ListItemText sx={{
                        color: theme.palette.iconsColor
                    }} primary={t("header.switch_theme")} />
                </ListItemButton>
            </ListItem>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={() => handleClose()}
                keepMounted
                onClick={(event) => event.stopPropagation()}
            >
                {themes.map((theme) => (
                    <MenuItem key={theme.value} onClick={(event) => handleClose(event, theme.value as PaletteKey)}>
                        {theme.label}
                    </MenuItem>
                ))}
            </Menu>
        </>
    ) : (
        /* Desktop Version */
        <Tooltip title={t("header.switch_theme")} placement="left">
            <Select value={selectedPalette} onChange={handleChangeTheme} renderValue={handleRenderValue} sx={{ borderRadius: '12px' }} size="small" inputProps={{ 'aria-label': t("header.switch_theme") }}>
                {themes.map(({ value, label }) => (
                    <MenuItem key={value} value={value} sx={{ my: 0.5 }}>
                        <Stack gap={1} sx={{ width: '100%' }}>
                            <span>{label}</span>
                            <Stack direction='row' gap={1} aria-hidden>
                                {paletteSwatches(value as PaletteKey).map((colour) => (
                                    <span
                                        key={colour}
                                        className='theme-color'
                                        style={{ backgroundColor: colour, boxShadow: `0 0 0 1px ${theme.palette.divider}` }}
                                    />
                                ))}
                            </Stack>
                        </Stack>
                    </MenuItem>
                ))}
            </Select >
        </Tooltip >
    );
};

export default ThemeSwitcher;
