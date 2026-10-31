import { ReactNode } from 'react';
import { Box, Chip, Stack, Typography, useTheme } from '@mui/material';

type PageHeaderProps = {
    icon?: ReactNode;
    title: string;
    subtitle?: string;
    count?: number;
    actions?: ReactNode;
    // Tighter spacing for pages that must fit on one screen.
    dense?: boolean;
};

// Consistent title row for top-level pages; actions wrap below on phones.
function PageHeader({ icon, title, subtitle, count, actions, dense = false }: PageHeaderProps) {
    const theme = useTheme();

    return (
        <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            gap={2}
            sx={dense ? { my: 2 } : { mt: { xs: 2, md: 3 }, mb: { xs: 2, md: 3 } }}
        >
            <Stack direction="row" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
                {icon && (
                    <Box
                        aria-hidden
                        sx={{
                            display: 'grid',
                            placeItems: 'center',
                            width: { xs: 38, md: 44 },
                            height: { xs: 38, md: 44 },
                            flexShrink: 0,
                            borderRadius: '12px',
                            backgroundColor: `${theme.palette.primary.main}22`,
                            '& .MuiSvgIcon-root': { fontSize: { xs: 22, md: 26 } },
                        }}
                    >
                        {icon}
                    </Box>
                )}
                <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" gap={1}>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
                            {title}
                        </Typography>
                        {count !== undefined && (
                            <Chip label={count} size="small" color="primary" sx={{ fontWeight: 800 }} />
                        )}
                    </Stack>
                    {subtitle && (
                        <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
            </Stack>
            {actions && (
                <Stack direction="row" gap={1} sx={{ ml: { sm: 'auto' }, flexWrap: 'wrap' }}>
                    {actions}
                </Stack>
            )}
        </Stack>
    );
}

export default PageHeader;
