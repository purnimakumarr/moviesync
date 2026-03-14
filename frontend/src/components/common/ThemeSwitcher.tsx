import { useState, useContext } from "react";
import { useTranslation } from "react-i18next";

import { Select, MenuItem, SelectChangeEvent, Tooltip, Stack, useTheme, useMediaQuery, ListItem, ListItemButton, ListItemIcon, ListItemText, Menu } from "@mui/material";
import PaletteIcon from '@mui/icons-material/Palette';

import { ThemeContext } from '../../theme/ThemeContext';

type PaletteKeys = 'classic' | 'fantasy' | 'horror' | 'theatre' | 'indie' | 'melodic_haze';

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
        localStorage.setItem('palette', e.target.value);
        changePalette(e.target.value as PaletteKeys);
    };

    const handleRenderValue = (selected: string) => {
        const selectedItem = themes.find((theme) => theme.value === selected);
        return (
            <Stack direction='row' sx={{ justifyContent: 'center', alignItems: 'center', gap: '0.6rem' }}>
                <PaletteIcon sx={{ fontSize: '2rem', color: 'primary.main' }} />
                <span>{selectedItem ? selectedItem.label : ''}</span>
            </Stack>
        );
    };

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (event?: React.MouseEvent<HTMLElement>, palette?: PaletteKeys) => {
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
                    <MenuItem key={theme.value} onClick={(event) => handleClose(event, theme.value as PaletteKeys)}>
                        {theme.label}
                    </MenuItem>
                ))}
            </Menu>
        </>
    ) : (
        /* Desktop Version */
        <Tooltip title={t("header.switch_theme")} placement="left">
            <Select value={selectedPalette} onChange={handleChangeTheme} renderValue={handleRenderValue} sx={{ borderRadius: '12px' }} size="small">
                <MenuItem value="classic" sx={{ marginY: 2 }}>
                    <Stack gap={1} sx={{ justifyContent: 'center' }}>
                        <span>{t("header.timeless")}</span>
                        <Stack direction='row' gap={3} sx={{
                            justifyContent: 'center', alignItems: 'center', borderRadius: '12px', padding: 2, backgroundColor: theme.palette.secondary.main
                        }}>
                            <span className='theme-color' style={{ backgroundColor: '#1B1B1B' }}></span>
                            <span className='theme-color' style={{ backgroundColor: '#4F4F4F' }}></span>
                            <span className='theme-color' style={{ backgroundColor: '#D1D1D1' }}></span>
                            <span className='theme-color' style={{ backgroundColor: '#f5f5f5' }}></span>
                        </Stack>
                    </Stack>
                </MenuItem>
                <MenuItem value="fantasy" sx={{ marginY: 2 }}>
                    <Stack gap={1} sx={{ justifyContent: 'center' }}>
                        <span>{t("header.enchanted")}</span>
                        <Stack direction='row' gap={3} sx={{
                            justifyContent: 'center', alignItems: 'center', borderRadius: '12px', padding: 2, backgroundColor: theme.palette.secondary.main
                        }}>
                            <span className='theme-color' style={{ backgroundColor: '#4A0E61' }}></span>
                            <span className='theme-color' style={{ backgroundColor: '#7B1FA2' }}></span>
                            <span className='theme-color' style={{ backgroundColor: '#FFDFEF' }}></span>
                            <span className='theme-color' style={{ backgroundColor: '#FFEBEE' }}></span>
                        </Stack>
                    </Stack>
                </MenuItem>
                <MenuItem value="indie" sx={{ marginY: 2 }}>
                    <Stack gap={1} sx={{ justifyContent: 'center' }}>
                        <span>{t("header.indie_flick")}</span>
                        <Stack direction='row' gap={3} sx={{
                            justifyContent: 'center', alignItems: 'center', borderRadius: '12px', padding: 2, backgroundColor: theme.palette.secondary.main
                        }}>
                            <span className='theme-color' style={{ backgroundColor: '#795548' }}></span>
                            <span className='theme-color' style={{ backgroundColor: '#4E342E' }}></span>
                            <span className='theme-color' style={{ backgroundColor: '#D7CCC8' }}></span>
                            <span className='theme-color' style={{ backgroundColor: '#FFEBEE' }}></span>
                        </Stack>
                    </Stack>
                </MenuItem>
                <MenuItem value="theatre" sx={{ marginY: 2 }}>
                    <Stack gap={1} sx={{ justifyContent: 'center' }}>
                        <span>{t("header.broadway_lights")}</span>
                        <Stack direction='row' gap={3} sx={{
                            justifyContent: 'center', alignItems: 'center', borderRadius: '12px', padding: 2, backgroundColor: theme.palette.secondary.main
                        }}>
                            <span className='theme-color' style={{ backgroundColor: '#FF9800' }}></span>
                            <span className='theme-color' style={{ backgroundColor: '#E65100' }}></span>
                            <span className='theme-color' style={{ backgroundColor: '#FFEFD6' }}></span>
                            <span className='theme-color' style={{ backgroundColor: '#FFEBEE' }}></span>
                        </Stack>
                    </Stack>
                </MenuItem>
                <MenuItem value="melodic_haze" sx={{ marginY: 2 }}>
                    <Stack gap={1} sx={{ justifyContent: 'center' }}>
                        <span>{t("header.scarlet_frames")}</span>
                        <Stack direction='row' gap={3} sx={{
                            justifyContent: 'center', alignItems: 'center', borderRadius: '12px', padding: 2, backgroundColor: theme.palette.secondary.main
                        }}>
                            <span className='theme-color' style={{ backgroundColor: '#3D0301' }}></span>
                            <span className='theme-color' style={{ backgroundColor: '#B03052' }}></span>
                            <span className='theme-color' style={{ backgroundColor: '#630F1C' }}></span>
                            <span className='theme-color' style={{ backgroundColor: '#FFEBEE' }}></span>
                        </Stack>
                    </Stack>
                </MenuItem>
                <MenuItem value="horror" sx={{ marginY: 2 }}>
                    <Stack gap={1} sx={{ justifyContent: 'center' }}>
                        <span>{t("header.dark_reel")}</span>
                        <Stack direction='row' gap={3} sx={{
                            justifyContent: 'center', alignItems: 'center', borderRadius: '12px', padding: 2, backgroundColor: theme.palette.secondary.main
                        }}>
                            <span className='theme-color' style={{ backgroundColor: '#B71C1C' }}></span>
                            <span className='theme-color' style={{ backgroundColor: '#212121' }}></span>
                            <span className='theme-color' style={{ backgroundColor: '#484848' }}></span>
                            <span className='theme-color' style={{ backgroundColor: '#000000' }}></span>
                        </Stack>
                    </Stack>
                </MenuItem>
            </Select >
        </Tooltip >
    );
};

export default ThemeSwitcher;
