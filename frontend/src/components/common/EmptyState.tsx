import { ReactNode } from 'react';
import { Box, Button, Stack, Typography, useTheme } from '@mui/material';

type EmptyStateProps = {
    icon: ReactNode;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
};

// Friendly placeholder that always tells the user what to do next.
function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
    const theme = useTheme();

    return (
        <Stack
            alignItems="center"
            textAlign="center"
            gap={1.5}
            sx={{
                py: { xs: 6, md: 10 },
                px: 2,
                mx: 'auto',
                maxWidth: 480,
            }}
        >
            <Box
                aria-hidden
                sx={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 96,
                    height: 96,
                    mb: 1,
                    borderRadius: '50%',
                    color: theme.palette.primary.main,
                    backgroundColor: `${theme.palette.primary.main}1F`,
                    '& .MuiSvgIcon-root': { fontSize: 48 },
                }}
            >
                {icon}
            </Box>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>
                {title}
            </Typography>
            {description && (
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {description}
                </Typography>
            )}
            {actionLabel && onAction && (
                <Button variant="contained" onClick={onAction} sx={{ mt: 1.5 }}>
                    {actionLabel}
                </Button>
            )}
        </Stack>
    );
}

export default EmptyState;
