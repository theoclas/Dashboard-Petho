import { useState, useCallback } from 'react';
import { Steps, Upload, Button, Alert, Card, Typography, Space, Result } from 'antd';
import { InboxOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { importFile } from '../api';

const { Dragger } = Upload;
const { Title, Text } = Typography;

interface StepResult {
  imported: number;
  errors: string[];
}

const IMPORT_STEPS = [
  {
    key: 'cartera',
    title: 'Cartera',
    endpoint: 'cartera' as const,
    description: 'Sube el archivo de cartera (HISTORIAL DE CARTERA)',
    required: true,
  },
  {
    key: 'productos',
    title: 'Productos',
    endpoint: 'productos' as const,
    description: 'Sube el archivo de productos exportado de Dropi',
    required: true,
  },
  {
    key: 'pedidos',
    title: 'Pedidos',
    endpoint: 'pedidos' as const,
    description: 'Sube el archivo de pedidos (se importa al final para calcular campos)',
    required: true,
  },
];

export default function ImportWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<(StepResult | null)[]>(
    IMPORT_STEPS.map(() => null),
  );
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = useCallback(
    async (file: File) => {
      const step = IMPORT_STEPS[currentStep];
      setLoading(true);
      setProgress(0);

      try {
        const result = await importFile(step.endpoint, file, setProgress);
        const newResults = [...results];
        newResults[currentStep] = result;
        setResults(newResults);

        // Avanzar al siguiente paso automáticamente
        if (currentStep < IMPORT_STEPS.length - 1) {
          setTimeout(() => setCurrentStep(currentStep + 1), 1500);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        const newResults = [...results];
        newResults[currentStep] = { imported: 0, errors: [msg] };
        setResults(newResults);
      } finally {
        setLoading(false);
      }

      return false; // Prevent default upload
    },
    [currentStep, results],
  );

  const handleSkip = () => {
    if (!IMPORT_STEPS[currentStep].required) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setResults(IMPORT_STEPS.map(() => null));
    setLoading(false);
    setProgress(0);
  };

  const allDone = currentStep === IMPORT_STEPS.length - 1 && results[currentStep] !== null;

  return (
    <div>
      <Title level={3}>📥 Importar datos de Dropi</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Los archivos se importan en orden: Cartera → Productos → Pedidos
      </Text>

      <Steps
        current={currentStep}
        items={IMPORT_STEPS.map((step, i) => ({
          title: step.title,
          description: results[i]
            ? `✅ ${results[i]!.imported} importados`
            : step.required
              ? 'Requerido'
              : 'Opcional',
          icon: loading && i === currentStep ? <LoadingOutlined /> : undefined,
        }))}
        style={{ marginBottom: 32 }}
      />

      {allDone ? (
        <Result
          status="success"
          title="¡Importación completada!"
          subTitle={`Se importaron todos los archivos correctamente.`}
          extra={
            <Button type="primary" onClick={handleReset}>
              Nueva importación
            </Button>
          }
        >
          <div style={{ textAlign: 'left' }}>
            {IMPORT_STEPS.map((step, i) => (
              results[i] && (
                <div key={step.key} style={{ marginBottom: 8 }}>
                  <Text strong>{step.title}:</Text>{' '}
                  <Text>{results[i]!.imported} registros importados</Text>
                  {results[i]!.errors.length > 0 && (
                    <Text type="warning"> ({results[i]!.errors.length} errores)</Text>
                  )}
                </div>
              )
            ))}
          </div>
        </Result>
      ) : (
        <Card
          title={
            <Space>
              <span>{IMPORT_STEPS[currentStep].title}</span>
              {!IMPORT_STEPS[currentStep].required && (
                <Text type="secondary">(opcional)</Text>
              )}
            </Space>
          }
          extra={
            !IMPORT_STEPS[currentStep].required && (
              <Button onClick={handleSkip}>Omitir →</Button>
            )
          }
        >
          <Text style={{ display: 'block', marginBottom: 16 }}>
            {IMPORT_STEPS[currentStep].description}
          </Text>

          {results[currentStep] ? (
            <Alert
              type={results[currentStep]!.errors.length > 0 ? 'warning' : 'success'}
              icon={<CheckCircleOutlined />}
              showIcon
              message={`${results[currentStep]!.imported} registros importados`}
              description={
                results[currentStep]!.errors.length > 0
                  ? `${results[currentStep]!.errors.length} errores encontrados`
                  : 'Sin errores'
              }
              style={{ marginBottom: 16 }}
            />
          ) : (
            <Dragger
              accept=".xlsx,.xls"
              showUploadList={false}
              beforeUpload={handleUpload}
              disabled={loading}
              style={{ padding: '20px 0' }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                {loading
                  ? `Importando... ${progress}%`
                  : 'Haz clic o arrastra tu archivo Excel aquí'}
              </p>
              <p className="ant-upload-hint">Archivo .xlsx exportado desde Dropi</p>
            </Dragger>
          )}
        </Card>
      )}
    </div>
  );
}
