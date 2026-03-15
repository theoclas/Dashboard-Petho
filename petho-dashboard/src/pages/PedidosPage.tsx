import { useState, useEffect, useCallback } from 'react';
import {
  Table, Input, Tag, Button, Space, Typography,
  Tooltip, message, InputNumber, DatePicker,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined,
  EditOutlined, SaveOutlined, CloseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getPedidos, updatePedido, getProductosDetalle, remapearEstados } from '../api';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

interface Pedido {
  id: number;
  id_dropi: string;
  fecha: string;
  cliente: string;
  transportadora: string;
  estado_operativo: string;
  guia: string;
  departamento: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  notas: string;
  producto: string;
  venta: number;
  ganancia_calc: number;
  flete: number;
  costo_devolucion_estimado: number;
  costo_proveedor: number;
  cartera: number;
  cartera_aplicada: number;
  estado_cartera: string;
  estado_unificado: string;
  estatus_original: string;
  ultimo_mov: string;
  fecha_ult_mov: string;
  dias_desde_ult_mov: number;
  notas_manuales: string;
}

interface ProductoDetalle {
  id: number;
  pedido_id_dropi: string;
  producto_nombre: string;
  cantidad: number;
  precio_proveedor: number;
  sku: string;
  variacion: string;
}

const estadoColors: Record<string, string> = {
  ENTREGADO: 'green',
  DEVOLUCION: 'red',
  'DEVOLUCIÓN': 'red',
  'EN REPARTO': 'blue',
  NOVEDAD: 'orange',
  OFICINA: 'purple',
  'OFICINA 1': 'volcano',
  CANCELADO: 'default',
  'SIN MAPEAR': 'gold',
  DESPACHADA: 'cyan',
  'EN RUTA': 'geekblue',
};

export default function PedidosPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Pedido[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [filters, setFilters] = useState({
    estado_unificado: '',
    transportadora: '',
    ciudad: '',
    id_dropi: '',
    startDate: '',
    endDate: '',
  });
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Pedido>>({});
  const [expandedProducts, setExpandedProducts] = useState<Record<string, ProductoDetalle[]>>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit, sortField, sortOrder };
      if (filters.estado_unificado) params.estado_unificado = filters.estado_unificado;
      if (filters.transportadora) params.transportadora = filters.transportadora;
      if (filters.ciudad) params.ciudad = filters.ciudad;
      if (filters.id_dropi) params.id_dropi = filters.id_dropi;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const result = await getPedidos(params);
      setData(result.data);
      setTotal(result.total);
      setSelectedRowKeys([]); // Limpiar selección al recargar datos
    } catch {
      message.error('Error cargando pedidos');
    }
    setLoading(false);
  }, [page, limit, filters, sortField, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (record: Pedido) => {
    setEditingId(record.id);
    setEditData({ ...record });
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      // Solo enviar campos editables (no enviar id, created_at, updated_at, etc.)
      const editableFields: (keyof Pedido)[] = [
        'cliente', 'notas', 'notas_manuales', 'telefono', 'direccion', 'ciudad',
        'departamento', 'transportadora', 'guia', 'estado_operativo',
        'estado_unificado', 'estado_cartera',
      ];
      const payload: Record<string, unknown> = {};
      for (const field of editableFields) {
        if (editData[field] !== undefined) {
          payload[field] = editData[field];
        }
      }
      await updatePedido(editingId, payload);
      message.success('Pedido actualizado');
      setEditingId(null);
      fetchData();
    } catch {
      message.error('Error al guardar');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const loadProducts = async (idDropi: string) => {
    if (expandedProducts[idDropi]) return;
    try {
      const prods = await getProductosDetalle(idDropi);
      const items = Array.isArray(prods) ? prods : prods.data || prods.value || [];
      setExpandedProducts((prev) => ({ ...prev, [idDropi]: items }));
    } catch {
      message.error('Error cargando productos');
    }
  };

  const renderEditable = (
    field: keyof Pedido,
    record: Pedido,
    type: 'text' | 'number' = 'text',
  ) => {
    if (user?.role === 'LECTOR') return record[field]; // Lector solo puede leer

    if (editingId === record.id) {
      if (type === 'number') {
        return (
          <InputNumber
            size="small"
            value={editData[field] as number}
            onChange={(v) => setEditData({ ...editData, [field]: v })}
            style={{ width: '100%' }}
          />
        );
      }
      return (
        <Input
          size="small"
          value={editData[field] as string}
          onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
        />
      );
    }
    return record[field];
  };

  const getColumnSearchProps = (title: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          placeholder={`Buscar ${title}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Buscar
          </Button>
          <Button
            onClick={() => {
              clearFilters && clearFilters();
              confirm();
            }}
            size="small"
            style={{ width: 90 }}
          >
            Limpiar
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
  });

  const columns: ColumnsType<Pedido> = [
    {
      title: 'ID Dropi',
      dataIndex: 'id_dropi',
      width: 100,
      fixed: 'left',
      sorter: true,
      ...getColumnSearchProps('ID Dropi'),
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      width: 100,
      sorter: true,
      render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Cliente',
      dataIndex: 'cliente',
      width: 180,
      render: (_, r) => renderEditable('cliente', r),
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      width: 120,
      render: (_, r) => renderEditable('telefono', r),
    },
    {
      title: 'Ciudad',
      dataIndex: 'ciudad',
      width: 130,
      sorter: true,
      ...getColumnSearchProps('Ciudad'),
    },
    {
      title: 'Mis Notas',
      dataIndex: 'notas_manuales',
      width: 200,
      ellipsis: { showTitle: false },
      render: (v: string, r: Pedido) => {
        if (editingId === r.id && user?.role !== 'LECTOR') {
          return (
            <Input.TextArea
              size="small"
              value={editData.notas_manuales as string}
              onChange={(e) => setEditData({ ...editData, notas_manuales: e.target.value })}
              rows={2}
              placeholder="Escribe tus notas aquí..."
            />
          );
        }
        return (
          <Tooltip title={v}>
            <span>{v || '-'}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Transportadora',
      dataIndex: 'transportadora',
      width: 140,
      sorter: true,
      ...getColumnSearchProps('Transportadora'),
    },
    {
      title: 'Guía',
      dataIndex: 'guia',
      width: 140,
    },
    {
      title: 'Operativo',
      dataIndex: 'estado_operativo',
      width: 130,
      render: (v: string) => (
        <Tag color={estadoColors[v] || 'default'}>{v || '-'}</Tag>
      ),
    },
    {
      title: 'Venta',
      dataIndex: 'venta',
      width: 100,
      align: 'right',
      render: (v: number) => `$${Number(v || 0).toLocaleString()}`,
    },
    {
      title: 'Ganancia',
      dataIndex: 'ganancia_calc',
      width: 100,
      align: 'right',
      render: (v: number) => {
        const num = Number(v || 0);
        return (
          <Text type={num >= 0 ? 'success' : 'danger'}>
            ${num.toLocaleString()}
          </Text>
        );
      },
    },
    {
      title: 'Flete',
      dataIndex: 'flete',
      width: 90,
      align: 'right',
      render: (v: number) => `$${Number(v || 0).toLocaleString()}`,
    },
    {
      title: 'Cartera',
      dataIndex: 'cartera',
      width: 100,
      align: 'right',
      render: (v: number) => {
        const num = Number(v || 0);
        return (
          <Text type={num >= 0 ? 'success' : 'danger'}>
            ${num.toLocaleString()}
          </Text>
        );
      },
    },
    {
      title: 'Est. Cartera',
      dataIndex: 'estado_cartera',
      width: 90,
      render: (v: string) => v === 'OK' ? <Tag color="green">OK</Tag> : '-',
    },
    {
      title: 'Días últ. mov',
      dataIndex: 'dias_desde_ult_mov',
      width: 90,
      align: 'center',
      render: (v: number) => {
        if (!v && v !== 0) return '-';
        return <Tag color={v > 5 ? 'red' : v > 2 ? 'orange' : 'green'}>{v}</Tag>;
      },
    },
    {
      title: 'Notas Dropi',
      dataIndex: 'notas',
      width: 200,
      ellipsis: { showTitle: false },
      render: (v: string, r: Pedido) => {
        if (editingId === r.id && user?.role !== 'LECTOR') {
          return (
            <Input.TextArea
              size="small"
              value={editData.notas as string}
              onChange={(e) => setEditData({ ...editData, notas: e.target.value })}
              rows={2}
            />
          );
        }
        return (
          <Tooltip title={v}>
            <span>{v || '-'}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Estado Dropi',
      dataIndex: 'estatus_original',
      width: 140,
      render: (v: string) => <Text type="secondary">{v || '-'}</Text>,
    },
    {
      title: 'Últ. Mov. Dropi',
      dataIndex: 'ultimo_mov',
      width: 150,
      ellipsis: { showTitle: false },
      render: (v: string) => (
        <Tooltip title={v}>
          <Text type="secondary">{v || '-'}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Estado Asignado',
      dataIndex: 'estado_unificado',
      width: 150,
      ...getColumnSearchProps('Estado'),
      render: (v: string) => (
        <Tag color={estadoColors[v] || 'default'}>{v || '-'}</Tag>
      ),
    },
    {
      title: 'Acciones',
      width: 100,
      fixed: 'right',
      render: (_, record) => {
        if (editingId === record.id) {
          return (
            <Space size="small">
              <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSave} />
              <Button size="small" icon={<CloseOutlined />} onClick={handleCancel} />
            </Space>
          );
        }
        return (
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
        );
      },
    },
  ];

  const selectedRows = data.filter((r) => selectedRowKeys.includes(r.id));
  const sumVenta = selectedRows.reduce((s, r) => s + Number(r.venta || 0), 0);
  const sumGanancia = selectedRows.reduce((s, r) => s + Number(r.ganancia_calc || 0), 0);
  const sumFlete = selectedRows.reduce((s, r) => s + Number(r.flete || 0), 0);
  const sumCartera = selectedRows.reduce((s, r) => s + Number(r.cartera || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>📋 Pedidos</Title>
        <Space wrap>
          <DatePicker.RangePicker
            placeholder={['Desde', 'Hasta']}
            format="DD/MM/YYYY"
            value={
              filters.startDate && filters.endDate
                ? [dayjs(filters.startDate), dayjs(filters.endDate)]
                : null
            }
            onChange={(dates) => {
              const d0 = dates?.[0];
              const d1 = dates?.[1];
              if (!d0 || !d1) {
                setFilters((f) => ({ ...f, startDate: '', endDate: '' }));
              } else {
                setFilters((f) => ({
                  ...f,
                  startDate: d0.format('YYYY-MM-DD'),
                  endDate: d1.format('YYYY-MM-DD'),
                }));
              }
              setPage(1);
            }}
          />
          {user?.role !== 'LECTOR' && (
            <Button 
              type="primary"
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await remapearEstados();
                  message.success(`Estados actualizados: ${res.remapeados} remapeados.`);
                  fetchData();
                } catch {
                  message.error('Error al automapear estados');
                  setLoading(false);
                }
              }}
            >
              Sincronizar Estados
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            Recargar
          </Button>
          <Text type="secondary">{total.toLocaleString()} resultados</Text>
        </Space>
      </div>

      <Table<Pedido>
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        size="small"
        scroll={{ x: 2000 }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        summary={() =>
          selectedRowKeys.length > 0 ? (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={9}>
                  <Text strong>
                    Total ({selectedRowKeys.length} fila{selectedRowKeys.length !== 1 ? 's' : ''} seleccionada
                    {selectedRowKeys.length !== 1 ? 's' : ''})
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="right">
                  <Text strong>${sumVenta.toLocaleString()}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="right">
                  <Text strong type={sumGanancia >= 0 ? 'success' : 'danger'}>
                    ${sumGanancia.toLocaleString()}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} align="right">
                  <Text strong>${sumFlete.toLocaleString()}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={12} align="right">
                  <Text strong type={sumCartera >= 0 ? 'success' : 'danger'}>
                    ${sumCartera.toLocaleString()}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13} colSpan={7} />
              </Table.Summary.Row>
            </Table.Summary>
          ) : null
        }
        pagination={{
          current: page,
          pageSize: limit,
          total,
          showSizeChanger: true,
          pageSizeOptions: [25, 50, 100, 200, 800],
          showTotal: (t) => `Total: ${t.toLocaleString()}`,
        }}
        onChange={(pagination, tableFilters: any, sorter: any, extra) => {
          if (extra.action === 'paginate') {
            setPage(pagination.current || 1);
            setLimit(pagination.pageSize || 25);
            setSelectedRowKeys([]); // Limpiar selección al cambiar página
          } else {
            setPage(1); // Mover a primera página al filtrar u ordenar
            
            if (sorter.field && sorter.order) {
              setSortField(sorter.field);
              setSortOrder(sorter.order === 'ascend' ? 'ASC' : 'DESC');
            } else {
              setSortField('id');
              setSortOrder('DESC');
            }

            setFilters((prev) => ({
              ...prev,
              id_dropi: tableFilters.id_dropi?.[0] || '',
              estado_unificado: tableFilters.estado_unificado?.[0] || '',
              transportadora: tableFilters.transportadora?.[0] || '',
              ciudad: tableFilters.ciudad?.[0] || '',
            }));
            setSelectedRowKeys([]); // Limpiar selección al filtrar u ordenar
          }
        }}
        expandable={{
          expandedRowRender: (record) => {
            const prods = expandedProducts[record.id_dropi];
            if (!prods) return <Text type="secondary">Cargando productos...</Text>;
            if (prods.length === 0) return <Text type="secondary">Sin productos</Text>;
            return (
              <Table
                size="small"
                pagination={false}
                dataSource={prods}
                rowKey="id"
                columns={[
                  { title: 'Producto', dataIndex: 'producto_nombre', width: 300 },
                  { title: 'SKU', dataIndex: 'sku', width: 100 },
                  { title: 'Variación', dataIndex: 'variacion', width: 150 },
                  { title: 'Cantidad', dataIndex: 'cantidad', width: 80, align: 'center' as const },
                  {
                    title: 'Precio Prov.',
                    dataIndex: 'precio_proveedor',
                    width: 120,
                    align: 'right' as const,
                    render: (v: number) => `$${Number(v || 0).toLocaleString()}`,
                  },
                ]}
              />
            );
          },
          onExpand: (expanded, record) => {
            if (expanded) loadProducts(record.id_dropi);
          },
        }}
        rowClassName={(record) => {
          if (record.estado_unificado === 'ENTREGADO') return 'row-entregado';
          if (record.estado_unificado?.includes('DEVOLUCION')) return 'row-devolucion';
          return '';
        }}
      />
    </div>
  );
}
