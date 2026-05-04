import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:3000/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      alert(`Bienvenido, ${data.user.name}`);
      navigate('/');
    } else {
      alert('Credenciales incorrectas');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '24px', border: '1px solid #d1d7dc' }}>
      <h2 style={{ marginBottom: '24px' }}>Inicia sesión en tu cuenta de Udemy</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input 
          type="email" placeholder="Email" required 
          style={{ padding: '12px', border: '1px solid #2d2f31' }}
          onChange={e => setFormData({...formData, email: e.target.value})}
        />
        <input 
          type="password" placeholder="Contraseña" required 
          style={{ padding: '12px', border: '1px solid #2d2f31' }}
          onChange={e => setFormData({...formData, password: e.target.value})}
        />
        <button type="submit" style={{ 
          backgroundColor: '#a435f0', color: 'white', padding: '12px', 
          border: 'none', fontWeight: 'bold', cursor: 'pointer' 
        }}>
          Iniciar sesión
        </button>
      </form>
      <p style={{ marginTop: '16px', fontSize: '14px', textAlign: 'center' }}>
        ¿No tienes una cuenta? <Link to="/register" style={{ color: '#a435f0', fontWeight: 'bold' }}>Regístrate</Link>
      </p>
    </div>
  );
}
