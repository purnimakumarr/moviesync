import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { useTranslation } from "react-i18next";

import {
    IconButton, Avatar, Menu, MenuItem, useTheme, Stack,
    Dialog, DialogTitle, DialogContent, DialogContentText,
    DialogActions, Button, useMediaQuery
} from "@mui/material";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';

import { signOutRedirect } from "../../auth/authUtils";

type ProfileMenuProps = {
    firstName: string | null,
    lastName: string | null
}

const ProfileMenu = ({ firstName, lastName }: ProfileMenuProps) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const auth = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [openSignOut, setOpenSignOut] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleProfile = () => {
        navigate("/user");
        handleClose();
    };

    const handleSignOutClose = () => {
        setOpenSignOut(false);
    };

    const handleSignOut = () => {
        handleClose();
        auth.removeUser();
        signOutRedirect();
    };

    return (
        <>
            {/* Avatar Button */}
            <IconButton onClick={handleOpen} sx={{ padding: 0 }}>
                <Avatar
                    sx={{
                        fontWeight: 600,
                        backgroundColor: theme.palette.primary.main,
                        border: `2px solid ${theme.palette.headerIconsBackground}`,
                        width: isMobile ? "42px" : "52px",
                        height: isMobile ? "42px" : "52px",
                        color: theme.palette.text.tertiary,
                        boxShadow: 2,
                        "&:hover": { cursor: "pointer" },
                    }}
                >
                    {firstName && lastName && `${firstName[0][0]}${lastName[0][0]}`}
                </Avatar>
            </IconButton>

            {/* Profile Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                sx={{
                    borderRadius: '12px',
                    boxShadow: 3,
                }}
                id='profile-menu'
            >
                <MenuItem onClick={handleProfile} sx={{ paddingY: isMobile ? 2 : 1 }}>
                    <Stack direction="row" gap={1} sx={{ fontWeight: 500, justifyContent: "center", alignItems: "center" }}>
                        <AccountCircleIcon sx={{ color: theme.palette.primary.main }} />
                        {t("profile.go_to_profile")}
                    </Stack>
                </MenuItem>
                <MenuItem onClick={(event) => {
                    event.stopPropagation();
                    setOpenSignOut(true)
                }} sx={{ paddingY: isMobile ? 2 : 1 }}>
                    <Stack direction="row" gap={1} sx={{ fontWeight: 500, justifyContent: "center", alignItems: "center" }}>
                        <LogoutIcon sx={{ color: theme.palette.primary.main }} />
                        {t("profile.sign_out")}
                    </Stack>
                </MenuItem>
            </Menu>

            {/* Sign Out Confirmation Dialog */}
            <Dialog
                sx={{
                    "& .MuiPaper-root": {
                        backgroundColor: theme.palette.background.default,
                        borderRadius: "12px",
                        color: theme.palette.text.primary,
                    },
                }}
                open={openSignOut}
                onClose={handleSignOutClose}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>{t('profile.confirm_sign_out')}</DialogTitle>
                <DialogContent>
                    <DialogContentText component="div" sx={{ paddingY: 2 }}>
                        {t('profile.sign_out_text')}
                    </DialogContentText>
                    <DialogActions>
                        <Button onClick={handleSignOutClose} color="primary">
                            {t('profile.cancel')}
                        </Button>
                        <Button
                            sx={{
                                backgroundColor: theme.palette.primary.main,
                                "&:hover": { backgroundColor: theme.palette.background.secondary },
                            }}
                            onClick={handleSignOut}
                            variant="contained"
                        >
                            {t('profile.confirm')}
                        </Button>
                    </DialogActions>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ProfileMenu;
