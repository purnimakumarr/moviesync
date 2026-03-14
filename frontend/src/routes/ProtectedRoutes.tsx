import { Navigate, Outlet } from "react-router-dom";
import { useIsAuthenticated } from "../auth/authHooks";

const ProtectedRoutes = () => {
    const isAuthenticated = useIsAuthenticated();
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    return <Outlet />;
};

export default ProtectedRoutes;
