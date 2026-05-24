import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import type { ApiClient } from '../api';
import { useToast } from '../contexts/ToastContext';
import { getInstructorRole, setStoredRole } from '../utils/roles';

interface BecomeInstructorPageProps {
  api: ApiClient;
}

export function BecomeInstructorPage({ api }: BecomeInstructorPageProps) {
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

  const alreadyInstructor = getInstructorRole(user ?? null);

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
      showToast('Debes aceptar los términos y condiciones.', 'error');
      return;
    }

    setUpgrading(true);
    try {
      await api.post('/users/become-instructor');

      if (user?.sub) {
        setStoredRole(user.sub, 'instructor');
        window.dispatchEvent(new Event('instructor-role-changed'));
      }

      await getAccessTokenSilently().catch(() => {});

      showToast('¡Felicitaciones! Has sido promovido a Instructor. Ahora puedes subir cursos.', 'success');
      navigate('/instructor');
    } catch (err) {
      console.error(err);
      showToast('Hubo un error al procesar el ascenso en el microservicio de autenticación.', 'error');
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
