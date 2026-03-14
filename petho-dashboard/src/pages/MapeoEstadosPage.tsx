import { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, Space, Typography, message, Popconfirm, Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getMapeoEstados, createMapeoEstado, updateMapeoEstado, deleteMapeoEstado } from '../api';

const { Title } = Typography;

interface MapeoEstado {
  id: number;
  transportadora: string;
  estatus_original: string;
  ultimo_movimiento: string;
  estado_unificado: string;
}

export default function MapeoEstadosPage() {
  const [data, setData] = useState<MapeoEstado[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MapeoEstado | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getMapeoEstados();
      setData(Array.isArray(result) ? result : []);
    } catch {
      message.error('Error cargando mapeo de estados');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: MapeoEstado) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMapeoEstado(id);
      message.success('Mapeo eliminado');
      fetchData();
    } catch {
      message.error('Error eliminando mapeo');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        await updateMapeoEstado(editingRecord.id, values);
        message.success('Mapeo actualizado');
      } else {
        await createMapeoEstado(values);
        message.success('Mapeo creado');
      }
      setModalOpen(false);
      fetchData();
    } catch {
      /* validation error */
    }
  };

  const columns = [
    {
      title: 'Transportadora',
      dataIndex: 'transportadora',
      width: 180,
    },
    {
      title: 'Estatus Original',
      dataIndex: 'estatus_original',
      width: 200,
    },
    {
      title: 'Último Movimiento',
      dataIndex: 'ultimo_movimiento',
      width: 200,
    },
    {
      title: 'Estado Unificado',
      dataIndex: 'estado_unificado',
      width: 150,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Acciones',
      width: 120,
      render: (_: unknown, record: MapeoEstado) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="¿Eliminar?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>🔧 Mapeo de Estados</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Agregar Mapeo
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{ pageSize: 50 }}
      />

      <Modal
        title={editingRecord ? 'Editar Mapeo' : 'Nuevo Mapeo'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="transportadora" label="Transportadora">
            <Input placeholder="Ej: INTERRAPIDISIMO" />
          </Form.Item>
          <Form.Item name="estatus_original" label="Estatus Original" rules={[{ required: true }]}>
            <Input placeholder="Ej: admitida" />
          </Form.Item>
          <Form.Item name="ultimo_movimiento" label="Último Movimiento">
            <Input placeholder="(Opcional)" />
          </Form.Item>
          <Form.Item name="estado_unificado" label="Estado Unificado" rules={[{ required: true }]}>
            <Input placeholder="Ej: ENTREGADO, DEVOLUCION, OFICINA..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
