import { Toaster, toast } from 'sonner';
import { X } from 'lucide-react';

type NotificationSeverity = "error" | "warning" | "info" | "success";

type NotificationToast = {
    message: string;
    severity: NotificationSeverity;
};

type NotificationContextValue = {
    notify: (toast: NotificationToast) => void;
};

const notify = ({ message, severity }: NotificationToast) => {
    const action = (
        <button onClick={() => toast.dismiss()} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={16} />
        </button>
    );

    switch (severity) {
        case "error":
            toast.error(message, { action, duration: Infinity });
            break;
        case "warning":
            toast.warning(message, { action, duration: Infinity });
            break;
        case "success":
            toast.success(message, { action, duration: Infinity });
            break;
        case "info":
        default:
            toast.info(message, { action, duration: Infinity });
            break;
    }
};

export const useNotification = (): NotificationContextValue => {
    return { notify };
};

export const NotificationToaster = () => {
    return (
        <Toaster
            position="top-right"
            offset="88px"
            closeButton={false}
            richColors
        />
    );
};

export default NotificationToaster;