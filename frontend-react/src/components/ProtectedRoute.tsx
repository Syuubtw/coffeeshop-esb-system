import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const savedUser = localStorage.getItem('user');

  if (!savedUser) {
    return <Navigate to="/login" replace />;
  }

  let user: any = null;
  try {
    user = JSON.parse(savedUser);
  } catch {
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasRole = user.roles?.some((r: string) => allowedRoles.includes(r));

  if (!hasRole) {
    // Redirect to role-appropriate default page
    if (user.roles?.includes('super_admin')) return <Navigate to="/admin" replace />;
    if (user.roles?.includes('store_manager')) return <Navigate to="/manager" replace />;
    if (user.roles?.includes('cashier')) return <Navigate to="/pos" replace />;
    if (user.roles?.includes('barista')) return <Navigate to="/kds" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
