import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import api from '../api';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await api.post('/auth/register', values);
      message.success('Registro exitoso. Tu cuenta está pendiente de activación por un administrador.', 5);
      setTimeout(() => {
        window.location.href = '/login';
      }, 5000);
    } catch (err: any) {
      if (err.response?.status === 409) {
        message.error('El correo ingresado ya está registrado');
      } else {
        message.error('Error al registrar usuario');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f23' }}>
      <Card style={{ width: 400, background: '#141428', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#6366f1', margin: 0 }}>PETHO</Title>
          <Text type="secondary">Crea una nueva cuenta</Text>
        </div>

        <Form name="register" onFinish={onFinish} layout="vertical">
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Ingresa tu nombre o alias' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nombre o Usuario" size="large" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Ingresa tu correo' }, { type: 'email', message: 'Correo inválido' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="Correo electrónico" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Crea una contraseña' }, { min: 6, message: 'Mínimo 6 caracteres' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Contraseña" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} size="large" loading={loading}>
              Solicitar Registro
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              ¿Ya tienes cuenta? <a href="/login" style={{ color: '#6366f1' }}>Inicia Sesión</a>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}
