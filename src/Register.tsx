import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:4000/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      alert('Registro exitoso. Ahora puedes iniciar sesión.');
      navigate('/login');
    } else {
      alert('Error en el registro');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '24px', border: '1px solid #d1d7dc' }}>
      <h2 style={{ marginBottom: '24px' }}>Regístrate y comienza a aprender</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input 
          type="text" placeholder="Nombre completo" required 
          style={{ padding: '12px', border: '1px solid #2d2f31' }}
          onChange={e => setFormData({...formData, name: e.target.value})}
        />
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
        <select 
          style={{ padding: '12px', border: '1px solid #2d2f31' }}
          onChange={e => setFormData({...formData, role: e.target.value})}
        >
          <option value="STUDENT">Estudiante</option>
          <option value="INSTRUCTOR">Instructor</option>
        </select>
        <button type="submit" style={{ 
          backgroundColor: '#a435f0', color: 'white', padding: '12px', 
          border: 'none', fontWeight: 'bold', cursor: 'pointer' 
        }}>
          Registrarse
        </button>
      </form>
      <p style={{ marginTop: '16px', fontSize: '14px', textAlign: 'center' }}>
        ¿Ya tienes una cuenta? <Link to="/login" style={{ color: '#a435f0', fontWeight: 'bold' }}>Inicia sesión</Link>
      </p>
    </div>
  );
}
