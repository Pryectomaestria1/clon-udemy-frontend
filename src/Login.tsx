import { useAuth0 } from '@auth0/auth0-react';

export default function Login() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '48px', border: '1px solid #d1d7dc', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
      <img 
        src="https://www.udemy.com/staticback/menu/main-menu/logo-udemy.svg" 
        alt="Udemy" 
        style={{ width: '100px', marginBottom: '24px' }} 
      />
      <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 'bold' }}>Bienvenido de nuevo</h2>
      <p style={{ marginBottom: '32px', color: '#6a6f73' }}>Inicia sesión para continuar tu aprendizaje en la plataforma.</p>
      
      <button 
        onClick={() => loginWithRedirect({ authorizationParams: { prompt: 'login' } })}
        style={{ 
          backgroundColor: '#a435f0', 
          color: 'white', 
          padding: '16px 32px', 
          border: 'none', 
          fontWeight: 'bold', 
          cursor: 'pointer',
          width: '100%',
          fontSize: '16px'
        }}
      >
        Iniciar sesión con SSO
      </button>

      <div style={{ marginTop: '24px', borderTop: '1px solid #d1d7dc', paddingTop: '24px', fontSize: '14px' }}>
        Al iniciar sesión, aceptas nuestras Condiciones de uso y nuestra Política de privacidad.
      </div>
    </div>
  );
}
