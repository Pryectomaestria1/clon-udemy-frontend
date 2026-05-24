import { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import './index.css';
import { getInstructorRole, setStoredRole } from './utils/roles';
import { createApiClient, type ApiClient } from './api';
import { ToastProvider } from './contexts/ToastContext';
import { CartProvider, useCartContext } from './contexts/CartContext';
import { Navigation } from './components/Navigation';
import { BecomeInstructorPage } from './pages/BecomeInstructorPage';
import { CartPage } from './pages/CartPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { HomePage } from './pages/HomePage';
import { InstructorDashboard } from './pages/InstructorDashboard';
import { MyCoursesPage } from './pages/MyCoursesPage';

const publicApi = createApiClient();

function App() {
  const { isLoading, isAuthenticated, user, getAccessTokenSilently } = useAuth0();
  const tokenResolverRef = useRef(getAccessTokenSilently);
  tokenResolverRef.current = getAccessTokenSilently;
  const apiRef = useRef<ApiClient | null>(null);

  if (!apiRef.current) {
    apiRef.current = createApiClient(() => tokenResolverRef.current());
  }

  const api = apiRef.current;
  const [isInstructor, setIsInstructor] = useState(() => getInstructorRole(user ?? null));
  useEffect(() => {
    if (user) {
      setIsInstructor(getInstructorRole(user));
    }
  }, [user]);
  useEffect(() => {
    const handleRoleChange = () => setIsInstructor(true);
    window.addEventListener('instructor-role-changed', handleRoleChange);
    return () => window.removeEventListener('instructor-role-changed', handleRoleChange);
  }, []);
  useEffect(() => {
    if (isAuthenticated && user) {
      const syncUserProfile = async () => {
        try {
          const getFriendlyName = (u: { name?: string; nickname?: string; email?: string } | null | undefined) => {
            if (!u) return 'Usuario Demo';
            if (u.name && !u.name.includes('@')) return u.name;
            if (u.nickname) return u.nickname;
            return u.name || u.email || 'Usuario Demo';
          };
          const name = getFriendlyName(user);
          const data = await api.post<{ role?: string }>('/users/profile', {
            name: name,
            avatarUrl: user.picture || ''
          });
          if (data?.role?.toLowerCase() === 'instructor' && user.sub) {
            setStoredRole(user.sub, 'instructor');
            setIsInstructor(true);
          }
        } catch (error) {
          console.error('Failed to sync user profile:', error);
        }
      };
      syncUserProfile();
    }
  }, [isAuthenticated, user]);
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <h3 style={{ color: '#2d2f31' }}>Cargando Autenticación...</h3>
      </div>
    );
  }
  return (
    <ToastProvider>
      <CartProvider>
        <AppShell isInstructor={isInstructor} api={api} publicApi={publicApi} />
      </CartProvider>
    </ToastProvider>
  );
}
function AppShell({ isInstructor, api, publicApi }: { isInstructor: boolean; api: ApiClient; publicApi: ApiClient }) {
  const { cart } = useCartContext();
  return (
    <Router>
      <Navigation cartCount={cart.length} isInstructor={isInstructor} />
      <Routes>
        <Route path="/" element={<HomePage isInstructor={isInstructor} api={api} publicApi={publicApi} />} />
        <Route path="/course/:id" element={<CourseDetailPage api={api} publicApi={publicApi} />} />
        <Route path="/become-instructor" element={<BecomeInstructorPage api={api} />} />
        <Route path="/instructor" element={<InstructorDashboard api={api} publicApi={publicApi} />} />
        <Route path="/my-courses" element={<MyCoursesPage api={api} />} />
        <Route path="/cart" element={<CartPage api={api} />} />
      </Routes>
    </Router>
  );
}

export default App;
