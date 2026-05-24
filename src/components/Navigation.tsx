import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';

interface NavigationProps {
  cartCount: number;
  isInstructor: boolean;
}

export function Navigation({ cartCount, isInstructor }: NavigationProps) {
  const { user, isAuthenticated, logout, loginWithRedirect } = useAuth0();

  return (
    <nav className="navbar" style={{ backgroundColor: '#fff', borderBottom: '1px solid #d1d7dc' }}>
      <div style={{ display: 'flex', gap: '30px', alignItems: 'center', width: '100%' }}>
        <Link to="/" className="logo" style={{ color: '#a435f0', fontSize: '22px', letterSpacing: '-0.5px' }}>
          Udemy<span style={{ color: '#2d2f31', fontWeight: 300 }}>Clone</span>
        </Link>

        <div className="search-bar" style={{ maxWidth: '500px' }}>
          <input type="text" placeholder="Buscar cualquier curso de tecnología..." />
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginLeft: 'auto' }}>
          <Link to="/cart" style={{ textDecoration: 'none', color: '#2d2f31', display: 'flex', alignItems: 'center', gap: '5px', position: 'relative', marginRight: '15px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Carrito</span>
            {cartCount > 0 && (
              <span style={{
                backgroundColor: '#a435f0',
                color: '#fff',
                borderRadius: '50%',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 'bold',
                position: 'absolute',
                top: '-8px',
                right: '-10px'
              }}>
                {cartCount}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <>
              {isInstructor ? (
                <Link to="/instructor" style={{ textDecoration: 'none', color: '#2d2f31', fontWeight: 'bold' }}>
                  Panel Instructor
                </Link>
              ) : (
                <Link to="/become-instructor" style={{ textDecoration: 'none', color: '#a435f0', fontWeight: 'bold' }}>
                  Enseña en Udemy
                </Link>
              )}
              <Link to="/my-courses" style={{ textDecoration: 'none', color: '#2d2f31' }}>
                Mi aprendizaje
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: '#2d2f31', fontWeight: 600 }}>{user?.name}</span>
                <button
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #2d2f31',
                    color: '#2d2f31',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px'
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => loginWithRedirect({ authorizationParams: { prompt: 'login' } })}
                style={{
                  backgroundColor: 'transparent',
                  color: '#2d2f31',
                  border: '1px solid #2d2f31',
                  padding: '10px 18px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}
                style={{
                  backgroundColor: '#2d2f31',
                  color: 'white',
                  border: 'none',
                  padding: '10px 18px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                Registrarse
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
