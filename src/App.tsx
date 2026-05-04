import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Register from './Register';
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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

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
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>Hola, {user.name}</span>
              <button onClick={logout} style={{ border: '1px solid black', background: 'none', padding: '8px 12px', cursor: 'pointer' }}>Cerrar sesión</button>
            </div>
          ) : (
            <>
              <Link to="/login" style={{ textDecoration: 'none', color: 'black', border: '1px solid black', padding: '8px 12px' }}>Iniciar sesión</Link>
              <Link to="/register" style={{ textDecoration: 'none', color: 'white', backgroundColor: 'black', padding: '8px 12px' }}>Regístrate</Link>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App
