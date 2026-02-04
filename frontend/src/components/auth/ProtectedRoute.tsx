import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
    // Check if token exists
    const token = localStorage.getItem('token');

    if (!token) {
        // If not authenticated, redirect to login page
        return <Navigate to="/login" replace />;
    }

    // If authenticated, render child routes
    return <Outlet />;
};
