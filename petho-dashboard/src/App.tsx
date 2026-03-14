import { useState, useMemo } from 'react';
import { Layout, Menu, theme, ConfigProvider, Button, Space } from 'antd';
import {
  DashboardOutlined,
  OrderedListOutlined,
  ImportOutlined,
  SettingOutlined,
  LogoutOutlined,
  TeamOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import PedidosPage from './pages/PedidosPage';
import ImportWizard from './pages/ImportWizard';
import MapeoEstadosPage from './pages/MapeoEstadosPage';
import UsersPage from './pages/UsersPage';
import CpaPage from './pages/CpaPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import esES from 'antd/locale/es_ES';
import LogoSinNombre from './assets/Logosinnombre.png';
import LogoSinFondoCortada from './assets/Logo sin fondo cortada.png';

const { Header, Sider, Content } = Layout;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user } = useAuth();
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { token: themeToken } = theme.useToken();
  const { user, logout } = useAuth();
  
  // React Router
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(() => {
    const path = location.pathname === '/' ? '' : location.pathname.substring(1);
    if (!path || path === 'dashboard') {
      return (user?.role === 'OPERADOR' || user?.role === 'LECTOR') ? 'pedidos' : 'dashboard';
    }
    return path;
  });

  const menuItems = useMemo(() => {
    const items = [];

    if (user?.role !== 'OPERADOR' && user?.role !== 'LECTOR') {
      items.push({ key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' });
    }

    items.push({ key: 'pedidos', icon: <OrderedListOutlined />, label: 'Pedidos' });

    if (user?.role === 'ADMIN' || user?.role === 'OPERADOR') {
      items.push({ key: 'import', icon: <ImportOutlined />, label: 'Importar' });
      items.push({ key: 'cpa', icon: <BarChartOutlined />, label: 'CPA' });
    }

    if (user?.role === 'ADMIN') {
      items.push({ key: 'mapeo', icon: <SettingOutlined />, label: 'Mapeo Estados' });
      items.push({ key: 'usuarios', icon: <TeamOutlined />, label: 'Usuarios' });
    }

    return items;
  }, [user]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (user?.role === 'OPERADOR' || user?.role === 'LECTOR') ? <PedidosPage /> : <DashboardPage />;
      case 'pedidos':
        return <PedidosPage />;
      case 'import':
        return <ImportWizard />;
      case 'mapeo':
        return <MapeoEstadosPage />;
      case 'usuarios':
        return <UsersPage />;
      case 'cpa':
        return <CpaPage />;
      default:
        return (user?.role === 'OPERADOR' || user?.role === 'LECTOR') ? <PedidosPage /> : <DashboardPage />;
    }
  };

  return (
    <ConfigProvider
      locale={esES}
      theme={{
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 8,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        },
        algorithm: theme.darkAlgorithm,
      }}
    >
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{
            background: '#0f0f23',
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '0 16px',
            }}
          >
            {collapsed ? (
              <img src={LogoSinNombre} alt="Petho Logo" style={{ height: 32, width: 'auto' }} />
            ) : (
              <img src={LogoSinFondoCortada} alt="Petho Logo Cortada" style={{ height: 40, width: 'auto', maxWidth: '100%', objectFit: 'contain' }} />
            )}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[currentPage]}
            items={menuItems}
            onClick={({ key }) => setCurrentPage(key)}
            style={{ background: 'transparent', borderRight: 0 }}
          />
        </Sider>
        <Layout>
          <Header
            style={{
              padding: '0 24px',
              background: '#141428',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
            Gestión de pedidos Dropi — J&D
          </span>
          <Space>
            <span style={{ color: '#fff', marginRight: 10 }}>Hola, {user?.username} ({user?.role})</span>
            <Button type="primary" danger icon={<LogoutOutlined />} onClick={logout}>
              Salir
            </Button>
          </Space>
        </Header>
          <Content
            style={{
              margin: 24,
              padding: 24,
              background: themeToken.colorBgContainer,
              borderRadius: themeToken.borderRadius,
              minHeight: 280,
              overflow: 'auto',
            }}
          >
            {renderPage()}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <ConfigProvider
        locale={esES}
        theme={{
          token: {
            colorPrimary: '#6366f1',
            borderRadius: 8,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          },
          algorithm: theme.darkAlgorithm,
        }}
      >
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </AuthProvider>
  );
}

export default App;
