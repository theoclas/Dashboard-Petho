import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Space, DatePicker, Divider } from 'antd';
import { Pie, Column, Line } from '@ant-design/charts';
import {
  ShoppingCartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  TruckOutlined,
  WarningOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { getDashboardStats, getCpaStats } from '../api';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Stats {
  total: number;
  entregados: number;
  devoluciones: number;
  enProceso: number;
  totalVentas: number;
  totalGanancia: number;
  totalCartera: number;
  sinMapear: number;
  daily?: any[];
}

interface CpaStats {
  totalCpa: number;
  totalGasto: number;
  totalUtilidadCpa: number;
  totalVentasCpa: number;
  totalConversacionesCpa: number;
  dailyCpa: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [cpaStats, setCpaStats] = useState<CpaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<keyof Stats>('total');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params: { startDate?: string; endDate?: string } = {};
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].startOf('day').toISOString();
        params.endDate = dateRange[1].endOf('day').toISOString();
      }
      
      const [calc, cpaCalc] = await Promise.all([
        getDashboardStats(params),
        getCpaStats(params)
      ]);
      setStats(calc);
      setCpaStats(cpaCalc);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [dateRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!stats) return null;

  const cards = [
    {
      title: 'Total Pedidos',
      value: stats.total,
      dataKey: 'total',
      icon: <ShoppingCartOutlined />,
      color: '#1890ff',
    },
    {
      title: 'Entregados',
      value: stats.entregados,
      dataKey: 'entregados',
      icon: <CheckCircleOutlined />,
      color: '#52c41a',
      suffix: `(${((stats.entregados / (stats.total || 1)) * 100).toFixed(1)}%)`,
    },
    {
      title: 'Devoluciones',
      value: stats.devoluciones,
      dataKey: 'devoluciones',
      icon: <CloseCircleOutlined />,
      color: '#ff4d4f',
      suffix: `(${((stats.devoluciones / (stats.total || 1)) * 100).toFixed(1)}%)`,
    },
    {
      title: 'En Proceso',
      value: stats.enProceso,
      dataKey: 'enProceso',
      icon: <TruckOutlined />,
      color: '#faad14',
      suffix: `(${((stats.enProceso / (stats.total || 1)) * 100).toFixed(1)}%)`,
    },
    {
      title: 'Total Ventas',
      value: stats.totalVentas,
      dataKey: 'totalVentas',
      icon: <DollarOutlined />,
      color: '#13c2c2',
      prefix: '$',
      isMoney: true,
    },
    {
      title: 'Ganancia Total',
      value: stats.totalCartera,
      dataKey: 'totalCartera',
      icon: <DollarOutlined />,
      color: '#52c41a',
      prefix: '$',
      isMoney: true,
    },
    {
      title: 'Ganancia Proyectada',
      value: stats.totalGanancia,
      dataKey: 'totalGanancia',
      icon: <DollarOutlined />,
      color: '#722ed1',
      prefix: '$',
      isMoney: true,
    },
    {
      title: 'Sin Mapear',
      value: stats.sinMapear,
      dataKey: 'sinMapear',
      icon: <WarningOutlined />,
      color: '#faad14',
    },
    {
      title: 'CPA Total',
      value: cpaStats?.totalCpa || 0,
      dataKey: 'cpa_only',
      icon: <BarChartOutlined />,
      color: '#eb2f96',
      prefix: '$',
      isMoney: true,
      isCpa: true,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>📊 Dashboard</Title>
        <Space>
          <Text type="secondary">Filtrar por fecha:</Text>
          <RangePicker
            value={dateRange as [Dayjs, Dayjs]}
            onChange={(dates) => {
              if (dates) {
                setDateRange(dates as [Dayjs | null, Dayjs | null]);
              }
            }}
            format="DD/MM/YYYY"
            allowClear={false}
          />
        </Space>
      </div>
      <Row gutter={[16, 16]}>
        {cards.map((card) => (
          <Col xs={24} sm={12} md={8} lg={6} key={card.title}>
            <Card
              hoverable
              onClick={() => {
                if (!card.isCpa) {
                  setSelectedMetric(card.dataKey as keyof Stats);
                }
              }}
              style={{
                borderTop: `3px solid ${card.color}`,
                cursor: card.isCpa ? 'default' : 'pointer',
                border: (!card.isCpa && selectedMetric === card.dataKey) ? `2px solid ${card.color}` : `1px solid rgba(255,255,255,0.06)`,
                transform: (!card.isCpa && selectedMetric === card.dataKey) ? 'scale(1.02)' : 'none',
                transition: 'all 0.3s ease',
                background: (!card.isCpa && selectedMetric === card.dataKey) ? 'rgba(255,255,255,0.05)' : undefined
              }}
            >
              <Statistic
                title={card.title}
                value={card.value}
                prefix={card.icon}
                suffix={card.suffix}
                precision={card.isMoney ? 0 : undefined}
                formatter={(v) =>
                  card.isMoney
                    ? `$${Number(v).toLocaleString()}`
                    : Number(v).toLocaleString()
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {stats.daily && stats.daily.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Card 
            title={`Evolución Diaria: ${cards.find(c => c.dataKey === selectedMetric)?.title}`} 
            style={{ background: '#141428', border: '1px solid rgba(255,255,255,0.06)' }}
            styles={{ header: { borderBottom: '1px solid rgba(255,255,255,0.06)' } }}
          >
            <Line
              data={stats.daily}
              xField="date"
              yField={selectedMetric as string}
              color={cards.find(c => c.dataKey === selectedMetric)?.color || '#6366f1'}
              area={{
                 style: {
                   fill: 'l(270) 0:#ffffff 1:transparent',
                   fillOpacity: selectedMetric ? 0.2 : 0, 
                 }
              }}
              smooth
              point={{ size: 4, shape: 'circle' }}
              tooltip={{
                formatter: (datum: any) => {
                  const activeCard = cards.find(c => c.dataKey === selectedMetric);
                  const val = datum[selectedMetric];
                  return {
                    name: activeCard?.title || 'Valor',
                    value: activeCard?.isMoney ? `$${Number(val).toLocaleString()}` : val
                  };
                }
              }}
            />
          </Card>
        </div>
      )}

      {cpaStats?.dailyCpa && cpaStats.dailyCpa.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Card 
            title="Evolución Diaria: CPA" 
            style={{ background: '#141428', border: '1px solid rgba(255,255,255,0.06)' }}
            styles={{ header: { borderBottom: '1px solid rgba(255,255,255,0.06)' } }}
          >
            <Line
              data={cpaStats.dailyCpa}
              xField="date"
              yField="cpa"
              color="#eb2f96"
              area={{
                 style: {
                   fill: 'l(270) 0:#ffffff 1:transparent',
                   fillOpacity: 0.2, 
                 }
              }}
              smooth
              point={{ size: 4, shape: 'circle' }}
              tooltip={{
                formatter: (datum: any) => {
                  return {
                    name: 'CPA',
                    value: `$${Number(datum.cpa).toLocaleString()}`
                  };
                }
              }}
            />
          </Card>
        </div>
      )}

      <Divider style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card 
            title="Distribución de Estados" 
            style={{ background: '#141428', border: '1px solid rgba(255,255,255,0.06)' }}
            styles={{ header: { borderBottom: '1px solid rgba(255,255,255,0.06)' } }}
          >
            <Pie
              data={[
                { type: 'Entregados', value: stats.entregados },
                { type: 'Devoluciones', value: stats.devoluciones },
                { type: 'En Proceso', value: stats.enProceso },
                { type: 'Sin Mapear', value: stats.sinMapear },
              ]}
              angleField="value"
              colorField="type"
              color={['#52c41a', '#ff4d4f', '#faad14', '#13c2c2']}
              radius={0.8}
              innerRadius={0.6}
              label={{
                text: 'value',
                style: {
                  fill: '#fff',
                  fontWeight: 'bold',
                },
              }}
              legend={{
                color: {
                  position: 'bottom',
                  layout: 'horizontal',
                }
              }}
            />
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card 
            title="Resumen Financiero" 
            style={{ background: '#141428', border: '1px solid rgba(255,255,255,0.06)' }}
            styles={{ header: { borderBottom: '1px solid rgba(255,255,255,0.06)' } }}
          >
            <Column
              data={[
                { name: 'Ventas', value: stats.totalVentas },
                { name: 'Ganancia (Proyección)', value: stats.totalGanancia },
                { name: 'Cartera (Real)', value: stats.totalCartera },
              ]}
              xField="name"
              yField="value"
              colorField="name"
              color={['#13c2c2', '#722ed1', '#52c41a']}
              label={{
                text: (d: any) => `$${Number(d.value).toLocaleString()}`,
                position: 'top',
                style: {
                  fill: '#fff',
                  opacity: 0.8,
                },
              }}
              legend={false}
              tooltip={{
                name: 'Monto',
                valueFormatter: (v) => `$${Number(v).toLocaleString()}`,
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
