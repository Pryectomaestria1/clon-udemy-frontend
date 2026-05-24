import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ApiClient } from '../api';
import { useCartContext } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import type { Course, Enrollment, Lesson, Module, Resource } from '../types/models';

interface CourseDetailPageProps {
  api: ApiClient;
  publicApi: ApiClient;
}

export function CourseDetailPage({ api, publicApi }: CourseDetailPageProps) {
  const { cart, setCart } = useCartContext();
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth0();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const navigate = useNavigate();
  const showToast = useToast();

  useEffect(() => {
    if (!id) return;
    publicApi.get<Course>(`/courses/${id}`)
      .then(data => {
        setCourse(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id, publicApi]);

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
      api.get<{ enrollments?: Enrollment[] }>(`/enrollments/my-courses/${user.sub}`)
        .then(data => {
          if (data && Array.isArray(data.enrollments)) {
            const enrollment = data.enrollments.find((e: Enrollment) => e.courseId === id);
            if (enrollment) {
              setIsEnrolled(true);
              setEnrollmentId(enrollment.enrollmentId ?? null);
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
    }
  }, [api, isAuthenticated, user, id, course]);

  const handleAddToCart = () => {
    if (!course) return;
    if (cart.some(item => item.id === course.id)) {
      showToast('Este curso ya está en tu carrito.', 'error');
      return;
    }
    setCart([...cart, course]);
    showToast('Curso añadido al carrito', 'success');
  };

  const handleCompleteLesson = async (lessonId: string) => {
    if (!enrollmentId) return;
    try {
      await api.post(`/enrollments/${enrollmentId}/lessons/${lessonId}/complete`);
      const updatedCompleted = [...completedLessons, lessonId];
      setCompletedLessons(updatedCompleted);

      if (totalLessons > 0 && updatedCompleted.length === totalLessons) {
        showToast('¡Felicitaciones! Has completado el 100% del curso con éxito.', 'success');
      } else {
        showToast('Lección marcada como terminada', 'success');
      }
    } catch (err) {
      showToast('Error al completar la lección', 'error');
    }
  };

  const totalLessons = course?.modules?.reduce((acc: number, mod: Module) => acc + (mod.lessons?.length || 0), 0) || 0;
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
              {course.description || 'Este curso no cuenta con una descripción detallada por el momento.'}
            </p>
          </div>

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
              {course.modules.map((mod: Module) => (
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
                      {mod.lessons.map((les: Lesson) => {
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
                                      onClick={() => setActiveVideo(les.videoUrl ?? null)}
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

                            {isEnrolled && les.resources && les.resources.length > 0 && (
                              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #d1d7dc', paddingTop: '10px' }}>
                                <span style={{ fontSize: '11px', color: '#6a6f73', fontWeight: 'bold' }}>Material descargable adjunto:</span>
                                {les.resources.map((res: Resource) => (
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
