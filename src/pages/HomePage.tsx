import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link, useNavigate } from 'react-router-dom';
import type { ApiClient } from '../api';
import { useToast } from '../contexts/ToastContext';
import { useCartContext } from '../contexts/CartContext';

interface HomePageProps {
  isInstructor: boolean;
  api: ApiClient;
  publicApi: ApiClient;
}

export function HomePage({ isInstructor, api, publicApi }: HomePageProps) {
  const { cart, setCart } = useCartContext();
  const [courses, setCourses] = useState<any[]>([]);
  const { user, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const showToast = useToast();

  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);

  useEffect(() => {
    publicApi.get<any[]>('/courses')
      .then(data => {
        setCourses(data || []);
      })
      .catch(err => {
        console.error('Error consultando cursos del backend:', err);
      });
  }, [publicApi]);

  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      api.get<{ enrollments?: any[] }>(`/enrollments/my-courses/${user.sub}`)
        .then(data => {
          if (data && Array.isArray(data.enrollments)) {
            setEnrolledCourseIds(data.enrollments.map((e: any) => e.courseId));
          }
        })
        .catch(console.error);
    }
  }, [api, isAuthenticated, user]);

  const handleAddToCart = (course: any) => {
    if (cart.some(item => item.id === course.id)) {
      showToast('Este curso ya está en tu carrito.', 'error');
      return;
    }
    setCart([...cart, course]);
    showToast('Curso añadido al carrito', 'success');
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
