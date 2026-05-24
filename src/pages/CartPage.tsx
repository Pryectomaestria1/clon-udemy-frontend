import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link, useNavigate } from 'react-router-dom';
import type { ApiClient } from '../api';
import { useCartContext } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';

interface CartPageProps {
  api: ApiClient;
}

export function CartPage({ api }: CartPageProps) {
  const { cart, setCart } = useCartContext();
  const { user, isAuthenticated, loginWithRedirect } = useAuth0();
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
      showToast('Por favor inicia sesión para completar la compra.', 'error');
      loginWithRedirect();
      return;
    }

    if (cart.length === 0) {
      showToast('Tu carrito está vacío.', 'error');
      return;
    }

    if (cardNumber.length < 15) return showToast('Número de tarjeta inválido para la simulación.', 'error');
    if (cvv.length < 3) return showToast('Código de seguridad CVV inválido.', 'error');
    if (!expiryDate) return showToast('Fecha de vencimiento es requerida.', 'error');
    if (!cardHolder) return showToast('El nombre del titular es requerido.', 'error');

    setIsProcessing(true);
    try {
      const userId = user?.sub || 'user-anon';
      const courseIds = cart.map(item => item.id);

      await api.post('/sales/checkout', {
        userId,
        courseIds,
        amount: totalPrice,
        cardNumber,
        expiryDate,
        cvv,
        cardHolder
      });

      showToast('¡Compra exitosa! Todos los cursos han sido añadidos a tu aula virtual.', 'success');
      setCart([]);
      navigate('/my-courses');
    } catch (err) {
      console.error(err);
      showToast('Error al conectar con la pasarela de pagos.', 'error');
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
