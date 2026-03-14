import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import Logo1 from '../assets/Logo1.png';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = { ...values, username: values.username?.trim() };
      const { data } = await api.post('/auth/login', payload);
      login(data.access_token, data.user);
      window.location.href = '/';
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.status === 401) {
        message.error(err.response.data.message || 'Credenciales incorrectas o usuario inactivo');
      } else if (err.response?.status === 400) {
        message.error('Datos incompletos o inválidos');
      } else {
        message.error('Error de conexión al iniciar sesión');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: `url(${Logo1})`,
      backgroundColor: '#0f0f23',
      backgroundPosition: 'center center',
      backgroundSize: '160%', // Este valor ajusta qué tan cerca se ve
      backgroundRepeat: 'no-repeat',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(15, 15, 35, 0.85)',
        zIndex: 0
      }} />
      <Card 
        style={{ 
          width: 400, 
          background: 'rgba(20, 20, 40, 0.15)', 
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)', 
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          zIndex: 1 
        }}
        styles={{ body: { padding: '32px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#6366f1', margin: 0 }}>PETHO</Title>
          <Text type="secondary">Inicia sesión en tu cuenta</Text>
        </div>

        <Form name="login" onFinish={onFinish} layout="vertical">
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Ingresa tu usuario' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nombre de usuario" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Ingresa tu contraseña' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Contraseña" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} size="large" loading={loading}>
              Ingresar
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              ¿No tienes cuenta? <a href="/register" style={{ color: '#6366f1' }}>Regístrate</a>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}
