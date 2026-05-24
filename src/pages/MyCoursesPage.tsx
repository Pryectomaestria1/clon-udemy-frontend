import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import type { ApiClient } from '../api';

interface MyCoursesPageProps {
  api: ApiClient;
}

export function MyCoursesPage({ api }: MyCoursesPageProps) {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const { user } = useAuth0();

  useEffect(() => {
    async function fetchMyCourses() {
      try {
        const userId = user?.sub;
        if (!userId) return;

        const data = await api.get<{ enrollments?: any[] }>(`/enrollments/my-courses/${userId}`);
        if (data.enrollments) setEnrollments(data.enrollments);
      } catch (e) {
        console.error('Error cargando inscripciones:', e);
      }
    }
    fetchMyCourses();
  }, [api, user]);

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
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginTop: '10px' }}>{enr.title || 'Curso cargado de la DB'}</h3>
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
