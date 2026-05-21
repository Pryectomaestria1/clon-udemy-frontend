import { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import './index.css';

const API_URL = 'http://localhost:3000/v1';

const ToastContext = createContext<any>(null);

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: toast.type === 'error' ? '#d93025' : toast.type === 'success' ? '#105942' : '#2d2f31',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'all 0.3s ease'
        }}>
          {toast.type === 'success' && <span style={{ color: '#56e39f', fontWeight: 'bold', marginRight: '5px' }}>✓</span>}
          {toast.type === 'error' && <span style={{ color: '#ff5c5c', fontWeight: 'bold', marginRight: '5px' }}>✗</span>}
          {toast.type === 'info' && <span style={{ color: '#5cd6ff', fontWeight: 'bold', marginRight: '5px' }}>i</span>}
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

function Navigation({ cartCount, isInstructor }: { cartCount: number; isInstructor: boolean }) {
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

function HomePage({ cart, setCart }: { cart: any[]; setCart: React.Dispatch<React.SetStateAction<any[]>> }) {
  const [courses, setCourses] = useState<any[]>([]);
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const showToast = useToast();

  const isInstructor =
    user?.['https://udemyclone.com/roles']?.includes('Instructor') ||
    (user?.sub && localStorage.getItem(`role_${user.sub}`) === 'Instructor');

  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/courses`)
      .then(res => res.json())
      .then(data => {
        setCourses(data || []);
      })
      .catch(err => {
        console.error("Error consultando cursos del backend:", err);
      });
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      getAccessTokenSilently().then(token => {
        fetch(`${API_URL}/enrollments/my-courses/${user.sub}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.enrollments)) {
            setEnrolledCourseIds(data.enrollments.map((e: any) => e.courseId));
          }
        })
        .catch(console.error);
      });
    }
  }, [isAuthenticated, user]);

  const handleAddToCart = (course: any) => {
    if (cart.some(item => item.id === course.id)) {
      showToast("Este curso ya está en tu carrito.", "error");
      return;
    }
    setCart([...cart, course]);
    showToast("Curso añadido al carrito", "success");
  };

  const currentUserId = user?.sub || user?.name || user?.email;
  
  const myTaughtCourses = courses.filter(c => c.instructorId === currentUserId);
  const myBoughtCourses = courses.filter(c => enrolledCourseIds.includes(c.id) && c.instructorId !== currentUserId);
  const availableCourses = courses.filter(c => !enrolledCourseIds.includes(c.id) && c.instructorId !== currentUserId);

  const renderCourseGrid = (courseList: any[]) => (
    <div className="course-grid">
      {courseList.map(course => {
        const isOwner = user && course.instructorId === currentUserId;
        const inCart = cart.some(item => item.id === course.id);

        return (
          <div key={course.id} className="course-card" style={{ border: '1px solid #d1d7dc', padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#fff' }}>
            {course.coverImage ? (
              <img src={course.coverImage} alt={course.title} style={{ width: '100%', height: '130px', objectFit: 'cover' }} />
            ) : (
              <div style={{ height: '130px', background: 'linear-gradient(135deg, #6e30a4 0%, #a435f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '18px', textAlign: 'center', padding: '10px' }}>
                {course.title}
              </div>
            )}
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#2d2f31', marginTop: '10px' }}>{course.title}</h3>
            <p className="instructor">Instructor: {course.instructor?.name || course.instructorId}</p>
            <div style={{ marginTop: 'auto', paddingTop: '15px' }}>
              <p className="price" style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 12px' }}>${course.price.toFixed(2)}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {isOwner ? (
                  <Link
                    to={`/instructor?courseId=${course.id}`}
                    style={{ flex: 1, textDecoration: 'none', textAlign: 'center', backgroundColor: '#2d2f31', color: 'white', padding: '10px', fontWeight: 'bold', fontSize: '13px' }}
                  >
                    Editar Curso
                  </Link>
                ) : enrolledCourseIds.includes(course.id) ? (
                  <Link
                    to={`/course/${course.id}`}
                    style={{ flex: 1, textDecoration: 'none', textAlign: 'center', backgroundColor: '#2d2f31', color: 'white', padding: '10px', fontWeight: 'bold', fontSize: '13px' }}
                  >
                    Entrar al Curso
                  </Link>
                ) : inCart ? (
                  <Link
                    to="/cart"
                    style={{ flex: 1, textDecoration: 'none', textAlign: 'center', backgroundColor: '#2d2f31', color: 'white', padding: '10px', fontWeight: 'bold', fontSize: '13px' }}
                  >
                    Ver en Carrito
                  </Link>
                ) : (
                  <button
                    onClick={() => handleAddToCart(course)}
                    style={{ flex: 1, backgroundColor: '#a435f0', color: 'white', border: 'none', padding: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Añadir al Carrito
                  </button>
                )}
                <Link
                  to={`/course/${course.id}`}
                  style={{ textDecoration: 'none', textAlign: 'center', backgroundColor: '#fff', color: '#2d2f31', border: '1px solid #2d2f31', padding: '10px', fontWeight: 'bold', fontSize: '13px', width: '90px' }}
                >
                  Detalles
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      <div className="hero" style={{ margin: '30px 0', padding: '48px', display: 'flex', background: '#f7f9fa', alignItems: 'center' }}>
        <div style={{ maxWidth: '600px' }}>
          <h1 style={{ fontSize: '38px', fontWeight: 'bold', color: '#2d2f31', lineHeight: '1.2' }}>
            Aprende sin límites
          </h1>
          <p style={{ fontSize: '16px', color: '#2d2f31', marginTop: '15px', lineHeight: '1.5' }}>
            Esta interfaz interactúa directamente con un backend de microservicios NestJS comunicados por gRPC, utilizando bases de datos PostgreSQL reales en Docker.
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed #d1d7dc', borderRadius: '6px' }}>
          <h3 style={{ fontSize: '20px', color: '#2d2f31' }}>La base de datos PostgreSQL está vacía</h3>
          <p style={{ color: '#6a6f73', margin: '10px 0 20px' }}>
            No se encontraron cursos activos en el microservicio de catálogo.
          </p>
          {isAuthenticated ? (
            isInstructor ? (
              <Link to="/instructor" style={{ backgroundColor: '#a435f0', color: 'white', textDecoration: 'none', padding: '12px 24px', fontWeight: 'bold', display: 'inline-block' }}>
                Crear el primer curso
              </Link>
            ) : (
              <Link to="/become-instructor" style={{ backgroundColor: '#2d2f31', color: 'white', textDecoration: 'none', padding: '12px 24px', fontWeight: 'bold', display: 'inline-block' }}>
                Conviértete en Instructor para subir un curso
              </Link>
            )
          ) : (
            <button onClick={() => navigate('/become-instructor')} style={{ backgroundColor: '#2d2f31', color: 'white', border: 'none', padding: '12px 24px', fontWeight: 'bold', cursor: 'pointer' }}>
              Iniciar sesión y crear curso
            </button>
          )}
        </div>
      ) : (
        <>
          {isAuthenticated && myBoughtCourses.length > 0 && (
            <>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '40px 0 20px', color: '#105942' }}>Tus Cursos Comprados</h2>
              {renderCourseGrid(myBoughtCourses)}
            </>
          )}

          {isAuthenticated && isInstructor && myTaughtCourses.length > 0 && (
            <>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '40px 0 20px', color: '#2d2f31' }}>Cursos Impartidos por Ti</h2>
              {renderCourseGrid(myTaughtCourses)}
            </>
          )}

          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '40px 0 20px' }}>Cursos Disponibles</h2>
          {availableCourses.length > 0 ? (
            renderCourseGrid(availableCourses)
          ) : (
            <p style={{ color: '#6a6f73' }}>No hay más cursos disponibles por el momento.</p>
          )}
        </>
      )}
    </div>
  );
}

function CourseDetailPage({ cart, setCart }: { cart: any[]; setCart: React.Dispatch<React.SetStateAction<any[]>> }) {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<any>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const navigate = useNavigate();
  const showToast = useToast();

  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/courses/${id}`)
      .then(res => res.json())
      .then(data => {
        setCourse(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsEnrolled(false);
      return;
    }

    if (course && user && course.instructorId === (user.sub || user.name || user.email)) {
      setIsEnrolled(true);
      return;
    }

    if (user?.sub && id) {
      getAccessTokenSilently().then(token => {
        fetch(`${API_URL}/enrollments/my-courses/${user.sub}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.enrollments)) {
            const enrollment = data.enrollments.find((e: any) => e.courseId === id);
            if (enrollment) {
              setIsEnrolled(true);
              setEnrollmentId(enrollment.enrollmentId);
              setCompletedLessons(enrollment.completedLessons || []);
            } else {
              setIsEnrolled(false);
            }
          } else {
            setIsEnrolled(false);
          }
        })
        .catch(err => {
          console.error(err);
          setIsEnrolled(false);
        });
      });
    }
  }, [isAuthenticated, user, id, course]);

  const handleAddToCart = () => {
    if (!course) return;
    if (cart.some(item => item.id === course.id)) {
      showToast("Este curso ya está en tu carrito.", "error");
      return;
    }
    setCart([...cart, course]);
    showToast("Curso añadido al carrito", "success");
  };

  const handleCompleteLesson = async (lessonId: string) => {
    if (!enrollmentId) return;
    try {
      const token = await getAccessTokenSilently();
      await fetch(`${API_URL}/enrollments/${enrollmentId}/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedCompleted = [...completedLessons, lessonId];
      setCompletedLessons(updatedCompleted);
      
      if (totalLessons > 0 && updatedCompleted.length === totalLessons) {
        showToast("¡Felicitaciones! Has completado el 100% del curso con éxito.", "success");
      } else {
        showToast("Lección marcada como terminada", "success");
      }
    } catch (err) {
      showToast("Error al completar la lección", "error");
    }
  };

  const totalLessons = course?.modules?.reduce((acc: number, mod: any) => acc + (mod.lessons?.length || 0), 0) || 0;
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;

  if (loading) {
    return <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}><h3>Cargando detalles del curso...</h3></div>;
  }

  if (!course) {
    return <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}><h3>Curso no encontrado</h3></div>;
  }

  const inCart = cart.some(item => item.id === course.id);

  return (
    <div className="container" style={{ padding: '40px 20px', paddingBottom: '80px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
        
        {/* Lado izquierdo */}
        <div>
          {course.coverImage && (
            <div style={{ marginBottom: '20px' }}>
              <img src={course.coverImage} alt={course.title} style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #d1d7dc' }} />
            </div>
          )}
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#2d2f31' }}>{course.title}</h2>
          <p style={{ color: '#6a6f73', margin: '10px 0 20px' }}>Impartido por: <strong>{course.instructor?.name || course.instructorId}</strong></p>

          {isEnrolled && totalLessons > 0 && (
            <>
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f7f9fa', borderRadius: '6px', border: '1px solid #d1d7dc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#2d2f31' }}>Tu progreso</span>
                  <span style={{ fontWeight: 'bold', color: '#a435f0' }}>{progressPercentage}% completado</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#d1d7dc', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${progressPercentage}%`, height: '100%', backgroundColor: '#a435f0', transition: 'width 0.3s ease' }}></div>
                </div>
              </div>

              {progressPercentage === 100 && (
                <div style={{
                  background: 'linear-gradient(135deg, #105942 0%, #1c8c64 100%)',
                  color: '#fff',
                  padding: '24px',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  boxShadow: '0 4px 12px rgba(16,89,66,0.15)',
                  textAlign: 'center'
                }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0' }}>¡Felicitaciones!</h3>
                  <p style={{ fontSize: '14px', margin: 0, opacity: 0.9 }}>Has completado satisfactoriamente el 100% de este curso. ¡Sigue con este excelente ritmo de aprendizaje!</p>
                </div>
              )}
            </>
          )}

          <div style={{ border: '1px solid #d1d7dc', padding: '20px', backgroundColor: '#f7f9fa', marginBottom: '30px', borderRadius: '4px' }}>
            <h4 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#2d2f31' }}>Descripción del Curso:</h4>
            <p style={{ color: '#2d2f31', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {course.description || "Este curso no cuenta con una descripción detallada por el momento."}
            </p>
          </div>

          {/* Reproductor de Video Real */}
          {activeVideo ? (
            <div style={{ backgroundColor: '#000', padding: '10px', borderRadius: '6px', marginBottom: '30px' }}>
              <video 
                src={activeVideo} 
                controls 
                autoPlay 
                style={{ width: '100%', maxHeight: '450px', borderRadius: '4px' }}
              />
              <button 
                onClick={() => setActiveVideo(null)} 
                style={{ backgroundColor: '#f7f9fa', border: '1px solid #d1d7dc', color: '#2d2f31', padding: '6px 12px', marginTop: '10px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cerrar Reproductor
              </button>
            </div>
          ) : (
            <div style={{ height: '300px', background: 'linear-gradient(135deg, #1e1f29 0%, #2d2f31 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '15px', borderRadius: '6px', marginBottom: '30px' }}>
              <span style={{ fontSize: '18px' }}>Selecciona una lección para iniciar la reproducción</span>
              <span style={{ fontSize: '12px', color: '#a435f0' }}>Vídeo reproducido directamente desde PostgreSQL + Servidor local</span>
            </div>
          )}

          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Programa del Curso</h3>
          {(!course.modules || course.modules.length === 0) ? (
            <p style={{ color: '#6a6f73' }}>El instructor aún no ha estructurado los módulos de este curso.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {course.modules.map((mod: any) => (
                <div key={mod.id} style={{ border: '1px solid #d1d7dc', padding: '20px', backgroundColor: '#f7f9fa' }}>
                  <div style={{ borderBottom: '1px solid #d1d7dc', paddingBottom: '10px', marginBottom: '10px' }}>
                    <h4 style={{ fontWeight: 'bold', fontSize: '16px', color: '#2d2f31', margin: 0 }}>
                      {mod.title}
                    </h4>
                    {mod.description && (
                      <p style={{ fontSize: '13px', color: '#6a6f73', margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>
                        {mod.description}
                      </p>
                    )}
                  </div>
                  {(!mod.lessons || mod.lessons.length === 0) ? (
                    <p style={{ fontSize: '13px', color: '#6a6f73' }}>Sin lecciones creadas todavía.</p>
                  ) : (
                    <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                      {mod.lessons.map((les: any) => {
                        const isCompleted = completedLessons.includes(les.id);
                        return (
                          <li key={les.id} style={{ padding: '15px 0', borderBottom: '1px dashed #e4e6e8' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '14px', color: '#2d2f31', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {les.title}
                                  {isCompleted && <span style={{ color: '#105942', fontSize: '12px', fontWeight: 'normal' }}>(Completada)</span>}
                                </span>
                                {les.description && (
                                  <p style={{ fontSize: '12px', color: '#6a6f73', margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>
                                    {les.description}
                                  </p>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                {les.videoUrl ? (
                                  isEnrolled ? (
                                    <button
                                      onClick={() => setActiveVideo(les.videoUrl)}
                                      style={{ backgroundColor: '#a435f0', color: 'white', border: 'none', padding: '6px 14px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                                    >
                                      Ver clase
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '12px', color: '#6a6f73', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      Bloqueado
                                    </span>
                                  )
                                ) : (
                                  <span style={{ fontSize: '12px', color: '#6a6f73', fontStyle: 'italic' }}>Sin video</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Recursos de la lección (PDF, Audio, Zip...) */}
                            {isEnrolled && les.resources && les.resources.length > 0 && (
                              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #d1d7dc', paddingTop: '10px' }}>
                                <span style={{ fontSize: '11px', color: '#6a6f73', fontWeight: 'bold' }}>Material descargable adjunto:</span>
                                {les.resources.map((res: any) => (
                                  <a
                                    key={res.id}
                                    href={res.fileUrl}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      textDecoration: 'none',
                                      color: '#a435f0',
                                      fontSize: '13px',
                                      fontWeight: 'bold',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px'
                                    }}
                                  >
                                    Descargar [{res.fileType.toUpperCase()}]: {res.title}
                                  </a>
                                ))}
                              </div>
                            )}

                            {isEnrolled && !isCompleted && (
                              <div style={{ marginTop: '10px' }}>
                                <button
                                  onClick={() => handleCompleteLesson(les.id)}
                                  style={{ backgroundColor: '#fff', border: '1px solid #2d2f31', color: '#2d2f31', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                  Marcar como Terminada
                                </button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lado derecho: Tarjeta de Compra */}
        <div style={{ border: '1px solid #d1d7dc', padding: '24px', alignSelf: 'start', position: 'sticky', top: '20px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
          <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#2d2f31' }}>${course.price.toFixed(2)}</span>
          <p style={{ fontSize: '13px', color: '#6a6f73', margin: '10px 0 20px' }}>Garantía de reembolso de 30 días</p>
          
          {isEnrolled ? (
            <div style={{ textAlign: 'center', backgroundColor: '#e6f2ed', padding: '15px', color: '#105942', fontWeight: 'bold', border: '1px solid #c2e2d4', marginBottom: '12px' }}>
              ¡Ya estás inscrito en este curso!
            </div>
          ) : inCart ? (
            <button 
              onClick={() => navigate('/cart')}
              style={{ width: '100%', backgroundColor: '#2d2f31', color: 'white', border: 'none', padding: '14px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginBottom: '12px' }}
            >
              Ver en el Carrito
            </button>
          ) : (
            <button 
              onClick={handleAddToCart}
              style={{ width: '100%', backgroundColor: '#a435f0', color: 'white', border: 'none', padding: '14px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginBottom: '12px' }}
            >
              Añadir al Carrito
            </button>
          )}
          <p style={{ fontSize: '12px', textAlign: 'center', color: '#6a6f73' }}>Acceso de por vida a los videos y recursos</p>
        </div>
      </div>
    </div>
  );
}

function BecomeInstructorPage() {
  const { user, isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const [bio, setBio] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [terms, setTerms] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const navigate = useNavigate();
  const showToast = useToast();

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Conviértete en Instructor</h2>
        <p style={{ margin: '15px 0 25px', color: '#6a6f73' }}>Debes tener una cuenta registrada para poder postularte como maestro en la plataforma.</p>
        <button 
          onClick={() => loginWithRedirect()}
          style={{ backgroundColor: '#a435f0', color: 'white', border: 'none', padding: '12px 24px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Iniciar sesión para continuar
        </button>
      </div>
    );
  }

  const alreadyInstructor =
    user?.['https://udemyclone.com/roles']?.includes('Instructor') ||
    (user?.sub && localStorage.getItem(`role_${user.sub}`) === 'Instructor');

  if (alreadyInstructor) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold' }}>¡Ya eres Instructor!</h2>
        <p style={{ margin: '15px 0 25px', color: '#6a6f73' }}>Ya tienes acceso al panel de instructor para crear y gestionar tus cursos.</p>
        <button 
          onClick={() => navigate('/instructor')}
          style={{ backgroundColor: '#a435f0', color: 'white', border: 'none', padding: '12px 24px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Ir al Panel de Instructor
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terms) {
      showToast("Debes aceptar los términos y condiciones.", "error");
      return;
    }
    
    setUpgrading(true);
    try {
      const token = await getAccessTokenSilently();
      
      const res = await fetch(`${API_URL}/users/become-instructor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        if (user?.sub) {
          localStorage.setItem(`role_${user.sub}`, 'Instructor');
          window.dispatchEvent(new Event('instructor-role-changed'));
        }
        
        await getAccessTokenSilently().catch(() => {});

        showToast("¡Felicitaciones! Has sido promovido a Instructor. Ahora puedes subir cursos.", "success");
        navigate('/instructor');
      } else {
        showToast("Hubo un error al procesar el ascenso en el microservicio de autenticación.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error al conectar con el servidor.", "error");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '600px', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold' }}>Enseña en Udemy Clone</h2>
        <p style={{ color: '#6a6f73', marginTop: '10px' }}>Completa tu registro de instructor para empezar a subir tus cursos en PostgreSQL.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ border: '1px solid #d1d7dc', padding: '30px', background: '#fff' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Área de Especialización</label>
          <input 
            type="text" 
            placeholder="Ej. Desarrollo Web, Inteligencia Artificial, Finanzas" 
            required 
            value={specialty} 
            onChange={e => setSpecialty(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid #8a8d91', outline: 'none' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Biografía profesional corta</label>
          <textarea 
            rows={4} 
            placeholder="Cuéntale a tus estudiantes sobre tu experiencia y conocimientos..." 
            required 
            value={bio} 
            onChange={e => setBio(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid #8a8d91', outline: 'none', resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <input 
            type="checkbox" 
            id="terms" 
            checked={terms} 
            onChange={e => setTerms(e.target.checked)} 
            style={{ marginTop: '4px' }} 
          />
          <label htmlFor="terms" style={{ fontSize: '14px', color: '#2d2f31', cursor: 'pointer' }}>
            Acepto las normas del instructor y la política de monetización del clon de Udemy.
          </label>
        </div>

        <button 
          type="submit" 
          disabled={upgrading}
          style={{
            backgroundColor: '#a435f0',
            color: 'white',
            border: 'none',
            padding: '14px',
            width: '100%',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: upgrading ? 'not-allowed' : 'pointer',
            opacity: upgrading ? 0.7 : 1
          }}
        >
          {upgrading ? 'Procesando ascenso...' : 'Completar y Convertirse en Instructor'}
        </button>
      </form>
    </div>
  );
}

function InstructorDashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  
  // States para agregar módulo y lección
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [activeAddingLessonModuleId, setActiveAddingLessonModuleId] = useState<string | null>(null);
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);
  const [uploadingResourceId, setUploadingResourceId] = useState<string | null>(null);

  // States para editar curso
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // States para editar módulos
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState('');
  const [editModuleDescription, setEditModuleDescription] = useState('');

  // States para editar lecciones
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonDescription, setEditLessonDescription] = useState('');

  const { user, getAccessTokenSilently } = useAuth0();
  const showToast = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const courseIdFromUrl = searchParams.get('courseId');

  const fetchInstructorCourses = async (autoSelectId?: string) => {
    try {
      const res = await fetch(`${API_URL}/courses`);
      const data = await res.json();
      const instName = user?.sub || user?.name || user?.email || '';
      const filtered = (data || []).filter((c: any) => c.instructorId === instName);
      setCourses(filtered);
      setLoading(false);

      // Si hay un courseId en la URL, lo seleccionamos automáticamente
      const targetId = autoSelectId || courseIdFromUrl;
      if (targetId) {
        selectCourseToManage(targetId);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructorCourses();
  }, [user, courseIdFromUrl]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${API_URL}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          instructorId: user?.sub || user?.name || user?.email || 'Instructor Anon'
        })
      });

      if (res.ok) {
        const createdCourse = await res.json();

        // Upload cover image if selected
        if (coverImageFile && createdCourse.id) {
          const formData = new FormData();
          formData.append('file', coverImageFile);
          await fetch(`${API_URL}/courses/${createdCourse.id}/cover`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          });
        }

        showToast("¡Curso guardado con éxito en PostgreSQL!", "success");
        setTitle('');
        setDescription('');
        setPrice(0);
        setCoverImageFile(null);
        setCoverPreview(null);
        fetchInstructorCourses();
      } else {
        showToast("Error al guardar el curso. Revisa los microservicios gRPC.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error al conectar con el servidor.", "error");
    }
  };

  const selectCourseToManage = async (courseId: string) => {
    try {
      const res = await fetch(`${API_URL}/courses/${courseId}`);
      const data = await res.json();
      setSelectedCourse(data);
      setEditTitle(data.title || '');
      setEditDescription(data.description || '');
    } catch (err) {
      showToast("Error al cargar los detalles del curso.", "error");
    }
  };

  const handleUpdateCourseInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${API_URL}/courses/${selectedCourse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: editTitle, description: editDescription })
      });
      if (res.ok) {
        showToast("Información del curso actualizada con éxito.", "success");
        fetchInstructorCourses(selectedCourse.id);
      } else {
        showToast("Error al actualizar la información del curso.", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !moduleTitle) return;
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${API_URL}/courses/${selectedCourse.id}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: moduleTitle, description: moduleDescription })
      });
      if (res.ok) {
        setModuleTitle('');
        setModuleDescription('');
        selectCourseToManage(selectedCourse.id);
      } else {
        showToast("Error al agregar módulo.", "error");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddLesson = async (e: React.FormEvent, moduleId: string) => {
    e.preventDefault();
    if (!lessonTitle) return;
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${API_URL}/modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: lessonTitle, description: lessonDescription })
      });
      if (res.ok) {
        setLessonTitle('');
        setLessonDescription('');
        selectCourseToManage(selectedCourse.id);
      } else {
        showToast("Error al agregar lección.", "error");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateModule = async (moduleId: string) => {
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${API_URL}/modules/${moduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: editModuleTitle, description: editModuleDescription })
      });
      if (res.ok) {
        showToast("Módulo actualizado con éxito.", "success");
        setEditingModuleId(null);
        selectCourseToManage(selectedCourse.id);
      } else {
        showToast("Error al actualizar el módulo.", "error");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateLesson = async (lessonId: string) => {
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${API_URL}/lessons/${lessonId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: editLessonTitle, description: editLessonDescription })
      });
      if (res.ok) {
        showToast("Lección actualizada con éxito.", "success");
        setEditingLessonId(null);
        selectCourseToManage(selectedCourse.id);
      } else {
        showToast("Error al actualizar la lección.", "error");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, lessonId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLessonId(lessonId);
    try {
      const token = await getAccessTokenSilently();
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/lessons/${lessonId}/video`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`¡Video subido con éxito!\nURL del Stream: ${data.videoUrl}`, "success");
        selectCourseToManage(selectedCourse.id);
      } else {
        showToast("Error en la subida del video.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error de conexión al subir.", "error");
    } finally {
      setUploadingLessonId(null);
    }
  };

  const handleResourceUpload = async (e: React.ChangeEvent<HTMLInputElement>, lessonId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResourceId(lessonId);
    try {
      const token = await getAccessTokenSilently();
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/lessons/${lessonId}/resources`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        showToast("¡Archivo de recurso adjuntado con éxito!", "success");
        selectCourseToManage(selectedCourse.id);
      } else {
        showToast("Error al subir el archivo adjunto.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error al conectar con el servidor.", "error");
    } finally {
      setUploadingResourceId(null);
    }
  };

  return (
    <div className="container" style={{ padding: '30px 20px', paddingBottom: '80px' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '35px' }}>Panel de Control del Instructor</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
        
        {/* Lado Izquierdo: Crear curso e historial */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ border: '1px solid #d1d7dc', padding: '24px', background: '#fff' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>1. Crear Nuevo Curso</h3>
            <form onSubmit={handleCreateCourse}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>Título</label>
                <input
                  type="text"
                  required
                  value={title}
                  placeholder="Ej. Curso Completo de React"
                  onChange={e => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #8a8d91', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>Descripción</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  placeholder="Escribe de qué trata tu curso..."
                  onChange={e => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #8a8d91', outline: 'none', resize: 'vertical' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>Precio ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px', border: '1px solid #8a8d91', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>Imagen de Portada (opcional)</label>
                {coverPreview && (
                  <div style={{ marginBottom: '10px' }}>
                    <img src={coverPreview} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #d1d7dc' }} />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCoverImageFile(file);
                      setCoverPreview(URL.createObjectURL(file));
                    }
                  }}
                  style={{ width: '100%', padding: '8px', border: '1px solid #8a8d91', fontSize: '13px' }}
                />
              </div>
              <button type="submit" style={{ backgroundColor: '#a435f0', color: 'white', padding: '12px 24px', border: 'none', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
                Publicar Curso
              </button>
            </form>
          </div>

          <div style={{ border: '1px solid #d1d7dc', padding: '24px', background: '#fff' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>Tus Cursos Publicados</h3>
            {loading ? (
              <p>Cargando tus cursos...</p>
            ) : courses.length === 0 ? (
              <p style={{ color: '#6a6f73', fontSize: '13px' }}>Aún no has publicado ningún curso con esta cuenta.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {courses.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => {
                      setSearchParams({ courseId: c.id });
                      selectCourseToManage(c.id);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      background: selectedCourse?.id === c.id ? '#f7f9fa' : '#fff',
                      border: '1px solid #d1d7dc',
                      cursor: 'pointer',
                      borderLeft: selectedCourse?.id === c.id ? '4px solid #a435f0' : '1px solid #d1d7dc'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{c.title}</div>
                    <div style={{ fontSize: '12px', color: '#6a6f73', marginTop: '4px' }}>Precio: ${c.price}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lado Derecho: Editor de estructura de modulos y lecciones */}
        <div>
          {selectedCourse ? (
            <div style={{ border: '1px solid #d1d7dc', padding: '30px', backgroundColor: '#fff' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#2d2f31', marginBottom: '8px' }}>
                Editar: {selectedCourse.title}
              </h3>
              <p style={{ color: '#6a6f73', fontSize: '13px', marginBottom: '25px' }}>
                ID del curso: {selectedCourse.id}
              </p>

              {/* Editar Información Básica */}
              <form onSubmit={handleUpdateCourseInfo} style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #d1d7dc' }}>
                <h4 style={{ fontWeight: 'bold', marginBottom: '15px' }}>Información Básica</h4>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>Título del Curso</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid #8a8d91', outline: 'none' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>Descripción</label>
                  <textarea
                    rows={4}
                    required
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid #8a8d91', outline: 'none', resize: 'vertical' }}
                  />
                </div>
                <button type="submit" style={{ backgroundColor: '#2d2f31', color: '#fff', border: 'none', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Guardar Cambios
                </button>
              </form>

              {/* Agregar Módulo */}
              <h4 style={{ fontWeight: 'bold', marginBottom: '15px' }}>Estructura del Curso</h4>
              <form onSubmit={handleAddModule} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #d1d7dc', paddingBottom: '20px' }}>
                <input 
                  type="text" 
                  required 
                  placeholder="Nombre de la nueva sección/módulo" 
                  value={moduleTitle} 
                  onChange={e => setModuleTitle(e.target.value)} 
                  style={{ padding: '10px', border: '1px solid #8a8d91', outline: 'none' }}
                />
                <textarea 
                  placeholder="Descripción de la sección/módulo (opcional)" 
                  value={moduleDescription} 
                  onChange={e => setModuleDescription(e.target.value)} 
                  style={{ padding: '10px', border: '1px solid #8a8d91', outline: 'none', resize: 'vertical' }}
                  rows={2}
                />
                <button type="submit" style={{ backgroundColor: '#2d2f31', color: '#fff', border: 'none', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-start' }}>
                  Añadir Módulo
                </button>
              </form>

              {/* Render de Módulos */}
              <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Secciones y Clases</h4>
              {(!selectedCourse.modules || selectedCourse.modules.length === 0) ? (
                <p style={{ color: '#6a6f73', fontSize: '14px', fontStyle: 'italic' }}>Este curso aún no tiene módulos. Escribe el título de uno arriba para comenzar.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {selectedCourse.modules.map((mod: any) => (
                    <div key={mod.id} style={{ border: '1px solid #e4e6e8', padding: '20px', backgroundColor: '#f7f9fa' }}>
                      
                      {editingModuleId === mod.id ? (
                        <div style={{ marginBottom: '15px', padding: '15px', border: '1px solid #a435f0', backgroundColor: '#fff' }}>
                          <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Título del Módulo</label>
                            <input
                              type="text"
                              value={editModuleTitle}
                              onChange={e => setEditModuleTitle(e.target.value)}
                              style={{ width: '100%', padding: '8px', border: '1px solid #8a8d91', outline: 'none' }}
                            />
                          </div>
                          <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Descripción del Módulo</label>
                            <textarea
                              value={editModuleDescription}
                              onChange={e => setEditModuleDescription(e.target.value)}
                              style={{ width: '100%', padding: '8px', border: '1px solid #8a8d91', outline: 'none', resize: 'vertical' }}
                              rows={2}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleUpdateModule(mod.id)} style={{ backgroundColor: '#a435f0', color: 'white', border: 'none', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                              Guardar Módulo
                            </button>
                            <button onClick={() => setEditingModuleId(null)} style={{ backgroundColor: '#e4e6e8', color: '#2d2f31', border: 'none', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2d2f31' }}>
                              {mod.title}
                            </div>
                            {mod.description && (
                              <p style={{ fontSize: '13px', color: '#6a6f73', margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>
                                {mod.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setEditingModuleId(mod.id);
                              setEditModuleTitle(mod.title || '');
                              setEditModuleDescription(mod.description || '');
                            }}
                            style={{ backgroundColor: 'transparent', color: '#a435f0', border: '1px solid #a435f0', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            Editar Módulo
                          </button>
                        </div>
                      )}

                      {/* Lista de Lecciones */}
                      {mod.lessons && mod.lessons.map((les: any) => (
                        <div key={les.id} style={{ backgroundColor: '#fff', border: '1px solid #e4e6e8', padding: '20px', borderRadius: '4px', marginBottom: '12px' }}>
                          
                          {editingLessonId === les.id ? (
                            <div style={{ marginBottom: '15px', padding: '15px', border: '1px solid #a435f0', backgroundColor: '#fff' }}>
                              <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Título de la Clase</label>
                                <input
                                  type="text"
                                  value={editLessonTitle}
                                  onChange={e => setEditLessonTitle(e.target.value)}
                                  style={{ width: '100%', padding: '8px', border: '1px solid #8a8d91', outline: 'none' }}
                                />
                              </div>
                              <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Descripción de la Clase</label>
                                <textarea
                                  value={editLessonDescription}
                                  onChange={e => setEditLessonDescription(e.target.value)}
                                  style={{ width: '100%', padding: '8px', border: '1px solid #8a8d91', outline: 'none', resize: 'vertical' }}
                                  rows={2}
                                />
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleUpdateLesson(les.id)} style={{ backgroundColor: '#a435f0', color: 'white', border: 'none', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                                  Guardar Clase
                                </button>
                                <button onClick={() => setEditingLessonId(null)} style={{ backgroundColor: '#e4e6e8', color: '#2d2f31', border: 'none', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                              <div>
                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{les.title}</span>
                                {les.description && (
                                  <p style={{ fontSize: '13px', color: '#6a6f73', margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>
                                    {les.description}
                                  </p>
                                )}
                                {les.videoUrl ? (
                                  <div style={{ fontSize: '11px', color: 'green', marginTop: '4px' }}>
                                    ✓ Video cargado (.mp4)
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '11px', color: '#b4690e', marginTop: '4px' }}>
                                    Falta cargar el video (.mp4)
                                  </div>
                                )}
                              </div>
                              
                              <button
                                onClick={() => {
                                  setEditingLessonId(les.id);
                                  setEditLessonTitle(les.title || '');
                                  setEditLessonDescription(les.description || '');
                                }}
                                style={{ backgroundColor: 'transparent', color: '#a435f0', border: '1px solid #a435f0', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                Editar Clase
                              </button>
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {/* Botón de Video */}
                              {uploadingLessonId === les.id ? (
                                <span style={{ fontSize: '12px', color: '#a435f0', fontWeight: 'bold' }}>Subiendo Video...</span>
                              ) : (
                                <label style={{
                                  backgroundColor: '#a435f0',
                                  color: '#fff',
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  borderRadius: '2px'
                                }}>
                                  {les.videoUrl ? 'Reemplazar Video' : 'Subir Video (.mp4)'}
                                  <input 
                                    type="file" 
                                    accept="video/mp4" 
                                    onChange={e => handleVideoUpload(e, les.id)} 
                                    style={{ display: 'none' }} 
                                  />
                                </label>
                              )}

                              {/* Botón de Recursos adicionales */}
                              {uploadingResourceId === les.id ? (
                                <span style={{ fontSize: '12px', color: '#2d2f31', fontWeight: 'bold' }}>Adjuntando...</span>
                              ) : (
                                <label style={{
                                  backgroundColor: '#fff',
                                  color: '#2d2f31',
                                  border: '1px solid #2d2f31',
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  borderRadius: '2px'
                                }}>
                                  Adjuntar Material (PDF, Zip, Audio...)
                                  <input 
                                    type="file" 
                                    accept=".pdf,.zip,.rar,.mp3,.wav,.pdf,.docx,.txt"
                                    onChange={e => handleResourceUpload(e, les.id)} 
                                    style={{ display: 'none' }} 
                                  />
                                </label>
                              )}
                            </div>
                          </div>

                          {/* Lista de Recursos del instructor */}
                          {les.resources && les.resources.length > 0 && (
                            <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f7f9fa', borderLeft: '3px solid #2d2f31' }}>
                              <span style={{ fontSize: '11px', color: '#6a6f73', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Archivos Adjuntos:</span>
                              {les.resources.map((res: any) => (
                                <div key={res.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#2d2f31', padding: '3px 0' }}>
                                  <span>{res.title} ({res.fileType.toUpperCase()})</span>
                                  <a href={res.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#a435f0', textDecoration: 'none', fontWeight: 'bold' }}>Descargar</a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Añadir Lección */}
                      {activeAddingLessonModuleId === mod.id ? (
                        <form onSubmit={e => handleAddLesson(e, mod.id)} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px', backgroundColor: '#fff', padding: '15px', border: '1px solid #d1d7dc' }}>
                          <h5 style={{ fontWeight: 'bold', margin: '0 0 10px 0', fontSize: '13px' }}>Nueva Clase en {mod.title}</h5>
                          <input 
                            type="text" 
                            required 
                            placeholder="Nombre de la nueva clase/lección" 
                            value={lessonTitle}
                            onChange={e => setLessonTitle(e.target.value)}
                            style={{ padding: '8px', border: '1px solid #8a8d91', fontSize: '13px', outline: 'none' }}
                          />
                          <textarea 
                            placeholder="Descripción de la clase (opcional)" 
                            value={lessonDescription}
                            onChange={e => setLessonDescription(e.target.value)}
                            style={{ padding: '8px', border: '1px solid #8a8d91', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                            rows={2}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="submit" style={{ backgroundColor: '#2d2f31', color: '#fff', border: 'none', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>
                              Guardar Clase
                            </button>
                            <button type="button" onClick={() => setActiveAddingLessonModuleId(null)} style={{ backgroundColor: '#e4e6e8', color: '#2d2f31', border: 'none', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveAddingLessonModuleId(mod.id);
                            setLessonTitle('');
                            setLessonDescription('');
                          }}
                          style={{ backgroundColor: '#2d2f31', color: '#fff', border: 'none', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}
                        >
                          + Añadir Clase
                        </button>
                      )}

                    </div>
                  ))}
                </div>
              )}

            </div>
          ) : (
            <div style={{ height: '400px', border: '1px dashed #d1d7dc', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6a6f73', textAlign: 'center', padding: '20px' }}>
              <div>
                <h3>Gestor de Estructura y Contenidos</h3>
                <p style={{ marginTop: '10px' }}>Selecciona uno de tus cursos de la lista de la izquierda para agregarle módulos, clases y subir sus videos reales.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const { user, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    async function fetchMyCourses() {
      try {
        const token = await getAccessTokenSilently();
        const userId = user?.sub;
        if (!userId) return;

        const res = await fetch(`${API_URL}/enrollments/my-courses/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.enrollments) setEnrollments(data.enrollments);
      } catch (e) {
        console.error("Error cargando inscripciones:", e);
      }
    }
    fetchMyCourses();
  }, [user, getAccessTokenSilently]);

  return (
    <div className="container" style={{ padding: '30px 20px', paddingBottom: '60px' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px' }}>Mi Aprendizaje</h2>
      {enrollments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', border: '1px solid #d1d7dc' }}>
          <p style={{ color: '#6a6f73' }}>Aún no estás inscrito en ningún curso.</p>
          <Link to="/" style={{ color: '#a435f0', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', marginTop: '10px' }}>
            Explorar cursos de la base de datos
          </Link>
        </div>
      ) : (
        <div className="course-grid">
          {enrollments.map((enr, idx) => (
            <div key={idx} style={{ border: '1px solid #d1d7dc', padding: '16px', background: '#fff', display: 'flex', flexDirection: 'column' }}>
              {enr.coverImage ? (
                <img src={enr.coverImage} alt={enr.title || enr.courseId} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
              ) : (
                <div style={{ height: '100px', background: '#2d2f31', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', textAlign: 'center', padding: '10px' }}>
                  {enr.title || enr.courseId}
                </div>
              )}
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginTop: '10px' }}>{enr.title || "Curso cargado de la DB"}</h3>
              <p style={{ fontSize: '12px', color: '#6a6f73', margin: '5px 0 15px' }}>Progreso: {enr.progress}%</p>
              <div style={{ background: '#f7f9fa', height: '8px', width: '100%', borderRadius: '4px', overflow: 'hidden', marginBottom: '15px' }}>
                <div style={{ background: '#a435f0', height: '100%', width: `${enr.progress}%` }}></div>
              </div>
              <Link
                to={`/course/${enr.courseId}`}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  backgroundColor: '#a435f0',
                  color: '#fff',
                  padding: '10px',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  fontSize: '14px',
                  marginTop: 'auto'
                }}
              >
                Entrar al Aula Virtual
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CartPage({ cart, setCart }: { cart: any[]; setCart: React.Dispatch<React.SetStateAction<any[]>> }) {
  const { user, isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const showToast = useToast();

  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const totalPrice = cart.reduce((sum, item) => sum + (item.price || 0), 0);

  const handleRemove = (courseId: string) => {
    setCart(cart.filter(item => item.id !== courseId));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast("Por favor inicia sesión para completar la compra.", "error");
      loginWithRedirect();
      return;
    }

    if (cart.length === 0) {
      showToast("Tu carrito está vacío.", "error");
      return;
    }

    if (cardNumber.length < 15) return showToast("Número de tarjeta inválido para la simulación.", "error");
    if (cvv.length < 3) return showToast("Código de seguridad CVV inválido.", "error");
    if (!expiryDate) return showToast("Fecha de vencimiento es requerida.", "error");
    if (!cardHolder) return showToast("El nombre del titular es requerido.", "error");

    setIsProcessing(true);
    try {
      const token = await getAccessTokenSilently();
      const userId = user?.sub || 'user-anon';
      const courseIds = cart.map(item => item.id);

      const res = await fetch(`${API_URL}/sales/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          courseIds,
          amount: totalPrice,
          cardNumber,
          expiryDate,
          cvv,
          cardHolder
        })
      });

      if (res.ok) {
        showToast("¡Compra exitosa! Todos los cursos han sido añadidos a tu aula virtual.", "success");
        setCart([]); // Vaciar el carrito
        navigate('/my-courses');
      } else {
        const errorData = await res.json();
        showToast(`Error al procesar el pago: ${errorData.message || 'Verifica los detalles.'}`, "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error al conectar con la pasarela de pagos.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container" style={{ padding: '30px 20px', paddingBottom: '80px' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px' }}>Carrito de Compras</h2>
      
      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px solid #d1d7dc', backgroundColor: '#f7f9fa' }}>
          <h3 style={{ fontSize: '20px', margin: '15px 0 10px', color: '#2d2f31' }}>Tu carrito está vacío</h3>
          <p style={{ color: '#6a6f73', marginBottom: '20px' }}>
            Explora nuestra amplia variedad de cursos de tecnología y añade algunos a tu aprendizaje.
          </p>
          <Link to="/" style={{ backgroundColor: '#a435f0', color: 'white', textDecoration: 'none', padding: '12px 24px', fontWeight: 'bold', display: 'inline-block' }}>
            Buscar Cursos
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
          
          {/* Lista de cursos en el carrito */}
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#2d2f31' }}>
              {cart.length} {cart.length === 1 ? 'Curso' : 'Cursos'} en el carrito
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '20px', padding: '16px', border: '1px solid #d1d7dc', backgroundColor: '#fff', borderRadius: '4px' }}>
                  {item.coverImage ? (
                    <img src={item.coverImage} alt={item.title} style={{ width: '120px', height: '80px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '120px', height: '80px', background: 'linear-gradient(135deg, #6e30a4 0%, #a435f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '12px', textAlign: 'center', padding: '5px' }}>
                      {item.title}
                    </div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontWeight: 'bold', fontSize: '16px', color: '#2d2f31', margin: '0 0 5px' }}>{item.title}</h4>
                      <p style={{ fontSize: '12px', color: '#6a6f73', margin: 0 }}>Por {item.instructor?.name || item.instructorId}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                      <button 
                        onClick={() => navigate(`/course/${item.id}`)}
                        style={{ background: 'none', border: 'none', color: '#a435f0', fontWeight: 'bold', cursor: 'pointer', padding: 0, fontSize: '13px' }}
                      >
                        Ver detalles
                      </button>
                      <button 
                        onClick={() => handleRemove(item.id)}
                        style={{ background: 'none', border: 'none', color: '#d93025', fontWeight: 'bold', cursor: 'pointer', padding: 0, fontSize: '13px' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d2f31' }}>
                    ${item.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulario de Checkout / Pago */}
          <div style={{ border: '1px solid #d1d7dc', padding: '24px', backgroundColor: '#fff', borderRadius: '4px', alignSelf: 'start' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', color: '#2d2f31' }}>Resumen del Pedido</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: '#2d2f31', borderBottom: '1px solid #d1d7dc', paddingBottom: '15px', marginBottom: '20px' }}>
              <span>Total:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>

            <form onSubmit={handleCheckout}>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '15px', color: '#2d2f31', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Datos de Pago (Simulación gRPC)
              </h4>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>Nombre en la Tarjeta</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej. Juan Pérez" 
                  value={cardHolder} 
                  onChange={e => setCardHolder(e.target.value)} 
                  style={{ width: '100%', padding: '10px', border: '1px solid #8a8d91', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>Número de Tarjeta</label>
                <input 
                  type="text" 
                  required 
                  placeholder="4111 2222 3333 4444" 
                  value={cardNumber} 
                  onChange={e => setCardNumber(e.target.value)} 
                  style={{ width: '100%', padding: '10px', border: '1px solid #8a8d91', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>Vencimiento</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="MM/AA" 
                    value={expiryDate} 
                    onChange={e => setExpiryDate(e.target.value)} 
                    style={{ width: '100%', padding: '10px', border: '1px solid #8a8d91', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>CVV</label>
                  <input 
                    type="password" 
                    required 
                    maxLength={4}
                    placeholder="123" 
                    value={cvv} 
                    onChange={e => setCvv(e.target.value)} 
                    style={{ width: '100%', padding: '10px', border: '1px solid #8a8d91', outline: 'none' }}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isProcessing}
                style={{ 
                  width: '100%', 
                  backgroundColor: '#a435f0', 
                  color: 'white', 
                  border: 'none', 
                  padding: '14px', 
                  fontWeight: 'bold', 
                  fontSize: '16px', 
                  cursor: 'pointer', 
                  transition: 'background-color 0.2s' 
                }}
              >
                {isProcessing ? 'Procesando Pago...' : 'Confirmar Compra'}
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}

function App() {
  const { isLoading, isAuthenticated, user, getAccessTokenSilently } = useAuth0();
  const [cart, setCart] = useState<any[]>(() => {
    const saved = localStorage.getItem('udemy_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [isInstructor, setIsInstructor] = useState(() => {
    const sub = user?.sub;
    return user?.['https://udemyclone.com/roles']?.includes('Instructor') ||
      (sub ? localStorage.getItem(`role_${sub}`) === 'Instructor' : false);
  });

  // Re-check instructor role when user changes
  useEffect(() => {
    if (user) {
      const fromClaim = user['https://udemyclone.com/roles']?.includes('Instructor');
      const fromStorage = user.sub ? localStorage.getItem(`role_${user.sub}`) === 'Instructor' : false;
      setIsInstructor(fromClaim || fromStorage);
    }
  }, [user]);

  // Listen for instructor role change event from BecomeInstructorPage
  useEffect(() => {
    const handleRoleChange = () => setIsInstructor(true);
    window.addEventListener('instructor-role-changed', handleRoleChange);
    return () => window.removeEventListener('instructor-role-changed', handleRoleChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('udemy_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const syncUserProfile = async () => {
        try {
          const token = await getAccessTokenSilently();
          const getFriendlyName = (u: any) => {
            if (!u) return 'Usuario Demo';
            if (u.name && !u.name.includes('@')) {
              return u.name;
            }
            if (u.nickname) {
              return u.nickname;
            }
            return u.name || u.email || 'Usuario Demo';
          };
          const name = getFriendlyName(user);
          
          await fetch(`${API_URL}/users/profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: name,
              avatarUrl: user.picture || ''
            })
          });
        } catch (error) {
          console.error('Failed to sync user profile:', error);
        }
      };
      syncUserProfile();
    }
  }, [isAuthenticated, user, getAccessTokenSilently]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <h3 style={{ color: '#2d2f31' }}>Cargando Autenticación...</h3>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <Navigation cartCount={cart.length} isInstructor={isInstructor} />
        <Routes>
          <Route path="/" element={<HomePage cart={cart} setCart={setCart} />} />
          <Route path="/course/:id" element={<CourseDetailPage cart={cart} setCart={setCart} />} />
          <Route path="/become-instructor" element={<BecomeInstructorPage />} />
          <Route path="/instructor" element={<InstructorDashboard />} />
          <Route path="/my-courses" element={<MyCoursesPage />} />
          <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
