import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import Logo1 from '../assets/Logo1.png';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.email.trim(), values.password);
      window.location.href = '/';
    } catch (err: any) {
      console.error('Login error:', err);
      const code = err?.code || err?.message || '';
      if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password')) {
        message.error('Correo o contraseña incorrectos');
      } else if (code.includes('auth/user-disabled')) {
        message.error('Cuenta deshabilitada. Contacta al administrador.');
      } else if (code.includes('auth/invalid-email')) {
        message.error('Correo electrónico inválido');
      } else {
        message.error('Error al iniciar sesión. Verifica tu conexión.');
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
      backgroundSize: '160%',
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
          <Text type="secondary">Inicia sesión con tu correo</Text>
        </div>

        <Form name="login" onFinish={onFinish} layout="vertical">
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Ingresa tu correo' }, { type: 'email', message: 'Correo inválido' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="Correo electrónico" size="large" />
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
