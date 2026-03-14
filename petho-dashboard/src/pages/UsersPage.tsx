import { useState, useEffect } from 'react';
import { Table, Button, Typography, Select, Tag, message, Popconfirm } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../api';

const { Title } = Typography;
const { Option } = Select;

interface User {
  id: number;
  email: string;
  username: string;
  role: 'ADMIN' | 'OPERADOR' | 'LECTOR';
  is_active: boolean;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch {
      message.error('Error al cargar la lista de usuarios');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (id: number, payload: { role?: string; is_active?: boolean }) => {
    try {
      await api.patch(`/users/${id}`, payload);
      message.success('Usuario actualizado');
      fetchUsers();
    } catch {
      message.error('Error al actualizar usuario');
    }
  };

  const columns: ColumnsType<User> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Usuario', dataIndex: 'username', width: 150 },
    { title: 'Email', dataIndex: 'email', width: 220 },
    {
      title: 'Fecha Registro',
      dataIndex: 'created_at',
      width: 150,
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      width: 150,
      render: (v: string, record: User) => (
        <Select
          value={v}
          style={{ width: 120 }}
          onChange={(newRole) => handleUpdateUser(record.id, { role: newRole })}
        >
          <Option value="ADMIN">Admin</Option>
          <Option value="OPERADOR">Operador</Option>
          <Option value="LECTOR">Lector</Option>
        </Select>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'is_active',
      width: 120,
      align: 'center',
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'red'}>{v ? 'ACTIVO' : 'INACTIVO'}</Tag>
      ),
    },
    {
      title: 'Acciones',
      width: 150,
      render: (_, record: User) => (
        <Popconfirm
          title={`¿${record.is_active ? 'Desactivar' : 'Activar'} este usuario?`}
          onConfirm={() => handleUpdateUser(record.id, { is_active: !record.is_active })}
          okText="Sí"
          cancelText="No"
        >
          <Button
            size="small"
            danger={record.is_active}
            type={record.is_active ? 'default' : 'primary'}
          >
            {record.is_active ? 'Desactivar' : 'Activar'}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>👥 Administración de Usuarios</Title>
        <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
          Recargar
        </Button>
      </div>
      <Table<User>
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
}
