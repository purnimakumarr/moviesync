import { Alert, AlertColor, Box, Snackbar } from "@mui/material"

type NotificationProps = {
    message: string;
    severity: AlertColor;
    open: boolean;
    handleClose: () => void;
}

const Notification = function ({ message, severity, open, handleClose }: NotificationProps) {
    const vertical = 'bottom', horizontal = 'center';

    const isValidSeverity = (value: string): value is AlertColor =>
        ["error", "warning", "info", "success"].includes(value);

    return <Box sx={{ width: 'fit-content' }}>
        <Snackbar sx={{ mb: '5rem' }} anchorOrigin={{ vertical, horizontal }} key={vertical + horizontal} open={open} autoHideDuration={8000} onClose={handleClose}>
            <Alert
                onClose={handleClose}
                severity={isValidSeverity(severity) ? severity : "info"}
                variant="filled"
                sx={{ width: '100%' }}
            >
                {message}
            </Alert>
        </Snackbar>
    </Box>
}

export default Notification;