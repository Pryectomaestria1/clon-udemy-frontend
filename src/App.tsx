import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Login from './Login';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  instructor: {
    name: string;
  }
}

function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    fetch('http://localhost:3000/v1/courses')
      .then(res => res.json())
      .then(data => {
        setCourses(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching courses:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container" style={{ position: 'relative' }}>
          <div className="hero-content">
            <h1>Aprende algo nuevo todos los días</h1>
            <p>Descubre cursos desde $12.99. La oferta termina el 5 de mayo.</p>
          </div>
          <div style={{
            position: 'absolute',
            top: '-40px',
            right: '0',
            width: '100%',
            height: '400px',
            backgroundColor: '#ddd',
            backgroundImage: 'url("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 1
          }}></div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container" style={{ paddingBottom: '100px' }}>
        <h2 style={{ marginTop: '48px', fontSize: '24px' }}>Una amplia selección de cursos</h2>
        <p style={{ color: '#6a6f73', marginBottom: '24px' }}>Elige entre más de 210,000 cursos en vídeo en línea.</p>

        {loading ? (
          <p>Cargando cursos...</p>
        ) : (
          <div className="course-grid">
            {courses.length > 0 ? (
              courses.map(course => (
                <div key={course.id} className="course-card">
                  <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80" alt={course.title} />
                  <h3>{course.title}</h3>
                  <p className="instructor">{course.instructor?.name || 'Instructor Invitado'}</p>
                  <div className="rating">
                    <span>4.5</span>
                    <span style={{ color: '#b4690e' }}>★★★★★</span>
                    <span style={{ color: '#6a6f73', fontWeight: 'normal' }}>(12,430)</span>
                  </div>
                  <p className="price">${course.price}</p>
                  <span className="bestseller-badge">Lo más vendido</span>
                </div>
              ))
            ) : (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="course-card">
                  <img src={`https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80`} alt="Curso" />
                  <h3>Desarrollo Web Fullstack con NestJS y React</h3>
                  <p className="instructor">Gabo MV</p>
                  <div className="rating">
                    <span>4.8</span>
                    <span style={{ color: '#b4690e' }}>★★★★★</span>
                    <span style={{ color: '#6a6f73', fontWeight: 'normal' }}>(2,150)</span>
                  </div>
                  <p className="price">$12.99</p>
                  <span className="bestseller-badge">Lo más vendido</span>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  const { user, isAuthenticated, logout, isLoading, loginWithRedirect } = useAuth0();

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando...</div>;
  }

  return (
    <Router>
      <nav className="navbar">
        <Link to="/" className="logo">Udemy</Link>
        <div className="search-bar">
          <input type="text" placeholder="Buscar cualquier cosa" />
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', fontSize: '14px', fontWeight: '500' }}>
          <span>Udemy Business</span>
          <span>Enseña en Udemy</span>
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: '600', color: '#2d2f31' }}>Hola, {user.name || user.nickname || user.email}</span>
              <button 
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} 
                style={{ border: '1px solid #2d2f31', background: 'white', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={() => loginWithRedirect({ authorizationParams: { prompt: 'login' } })} 
                style={{ backgroundColor: 'white', color: '#2d2f31', border: '1px solid #2d2f31', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
              >
                Iniciar sesión
              </button>
              <button 
                onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup', prompt: 'login' } })} 
                style={{ backgroundColor: '#2d2f31', color: 'white', border: '1px solid #2d2f31', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
              >
                Regístrate
              </button>
            </>
          )}

        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  );
}


export default App
