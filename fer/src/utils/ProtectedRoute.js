// src/utils/ProtectedRoute.js
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children, allowedRole, auth }) => {
  if (!auth) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRole && auth.role !== allowedRole) {
    return <Navigate to={auth.role === 'admin' ? '/admin/books' : '/user/books'} />;
  }
  
  return children;
};