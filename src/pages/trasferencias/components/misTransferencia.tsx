

import { enviarTransferenciasApi, obtenerTransferenciasApi, obtenerTransferenciasPendientesApi } from "@/api/transferenciasApi/transferenciasApi";
import { useCurrentUser } from "@/contexts/currentUser";
import type { TablaTransferenciasProps, TransferenciasPendientesProps } from "@/types/ComponentsT";
import type { TransferenciaDTO } from "@/types/Transferencias";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { ArrowRightLeft, Ban, CheckCircle, Clock, Eye, Package, PackageCheck, Send, XCircle } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import DialogConfirmarAceptarTranseferencia from "./dialogConfirmarAceptarTranseferencia";





// ====================================
// COMPONENTES UI
// ====================================
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'pending' | 'transit' | 'received' | 'cancelled';
}
const Badge = ({ children, variant = 'default' }: BadgeProps) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    pending: 'badge-pending',
    transit: 'badge-transit',
    received: 'badge-received',
    cancelled: 'badge-cancelled'
  };

  return (
    <span className={`status-badge ${variants[variant]}`}>
      {children}
    </span>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
}
const Card = ({ children, className = '' }: CardProps) => (
  <div className={`transfer-card ${className}`}>
    <div className="transfer-card-content">
      {children}
    </div>
  </div>
);

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}
const Button = ({ children, variant = 'default', size = 'md', onClick, className = '', disabled = false }: ButtonProps) => {
  const variants = {
    default: 'btn-primary',
    outline: 'bg-white border text-gray-700 hover:bg-gray-50',
    ghost: 'btn-ghost',
    success: 'btn-success',
    danger: 'btn-danger'
  };

  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'px-4 py-2',
    lg: 'px-6 py-3'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`action-btn ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};


interface TabItem {
  id: string | number;
  icon?: ReactNode;
  label: ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string | number;
  onChange: (id: string | number) => void;
}

const Tabs = ({ tabs, activeTab, onChange }: TabsProps) => {
  return (
    <div className="transfer-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`transfer-tab-btn ${activeTab === tab.id ? "active" : ""}`}
        >
          {tab.icon}
          {tab.label}
          {tab.count && tab.count > 0 && (
            <span className="tab-count">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

// ====================================
// FUNCIONES AUXILIARES
// ====================================

const getEstadoBadge = (estado: string | number) => {
  const estados: Record<string, { variant: BadgeProps['variant']; icon: React.ReactNode; text: string }> = {
    pendiente: { variant: 'pending', icon: <Clock className="w-3 h-3" />, text: 'Pendiente' },
    en_transito: { variant: 'transit', icon: <Send className="w-3 h-3" />, text: 'En Tránsito' },
    recibida: { variant: 'received', icon: <CheckCircle className="w-3 h-3" />, text: 'Recibida' },
    cancelada: { variant: 'cancelled', icon: <XCircle className="w-3 h-3" />, text: 'Cancelada' }
  };

  const config = estados[estado as keyof typeof estados] || estados.pendiente;

  return (
    <Badge variant={config.variant}>
      <span className="flex items-center gap-1">
        {config.icon}
        {config.text}
      </span>
    </Badge>
  );
};

const formatFecha = (fecha: string | number | Date) => {
  if (!fecha) return '-';
  const date = new Date(fecha);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ====================================
// COMPONENTE: TABLA DE TRANSFERENCIAS
// ====================================

const TablaTransferencias = ({ transferencias, onEnviar, onCancelar, onVerDetalle, mostrarAcciones = true, loading }: TablaTransferenciasProps) => {
  return (
    <div className="transfer-table-container">

      {loading ? (
        <div className="text-center p-35">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando sucursales...</p>
        </div>
      )
        : (
          <table className="transfer-table">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left">
                  ID
                </th>
                <th className="px-6 py-3 text-left">
                  Estado
                </th>
                <th className="px-6 py-3 text-left">
                  Origen → Destino
                </th>
                <th className="px-6 py-3 text-left">
                  Fecha Envío
                </th>
                <th className="px-6 py-3 text-left">
                  Productos
                </th>
                <th className="px-6 py-3 text-left">
                  Motivo
                </th>
                {mostrarAcciones && (
                  <th className="px-6 py-3 text-right">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transferencias.map((transferencia: TransferenciaDTO) => (
                <tr key={transferencia.id_transferencia} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{transferencia.id_transferencia}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getEstadoBadge(transferencia.estado)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{transferencia.sucursal_origen}</span>
                      <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{transferencia.sucursal_destino}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Por: {transferencia.usuario_origen}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFecha(transferencia.fecha_creacion)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span className="font-medium">{transferencia.total_productos} productos</span>
                      <span className="text-xs text-gray-500">{transferencia.total_piezas} piezas</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {transferencia.motivo}
                  </td>
                  {mostrarAcciones && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onVerDetalle(transferencia.id_transferencia)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {transferencia.estado === 'pendiente' && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => onEnviar(transferencia.id_transferencia)}
                            >
                              <Send className="w-4 h-4" />
                              Enviar
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => onCancelar(transferencia.id_transferencia)}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          </>
                        )}

                        {transferencia.estado === 'en_transito' && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                          >
                            <Ban className="w-4 h-4" />
                            Enviada
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}



      {transferencias.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay transferencias para mostrar</p>
        </div>
      )}
    </div>
  );
};

// ====================================
// COMPONENTE: TRANSFERENCIAS PENDIENTES DE RECIBIR
// ====================================

const TransferenciasPendientesRecibir = ({ transferencias, onRecibir }: TransferenciasPendientesProps) => {



  return (
    <div className="space-y-4">
      {transferencias.map((transferencia: TransferenciaDTO) => (
        <Card key={transferencia.id_transferencia} className="pending-card">
          <div className="pending-info">
            <div className="pending-header">
              <div className="bg-blue-100 p-2 rounded-lg">
                <PackageCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Transferencia #{transferencia.id_transferencia}
                </h3>
                <p className="text-sm text-gray-500">
                  De: <span className="font-medium text-gray-700">{transferencia.sucursal_origen}</span>
                </p>
              </div>
            </div>

            <div className="pending-grid">
              <div>
                <p className="info-label">Enviado por</p>
                <p className="info-value">{transferencia.usuario_origen}</p>
              </div>
              <div>
                <p className="info-label">Fecha de envío</p>
                <p className="info-value">{formatFecha(transferencia.fecha_envio)}</p>
              </div>
              <div>
                <p className="info-label">Productos</p>
                <p className="info-value">
                  {transferencia.total_productos} productos ({transferencia.total_piezas} piezas)
                </p>
              </div>
              <div>
                <p className="info-label">Estado</p>
                {getEstadoBadge(transferencia.estado)}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <p className="info-label">Motivo</p>
              <p className="text-sm text-gray-700">{transferencia.motivo}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 ml-6">
            <Button
              variant="success"
              onClick={() => onRecibir(transferencia.id_transferencia)}
            >
              <PackageCheck className="w-4 h-4" />
              Recibir
            </Button>
          </div>
        </Card>
      ))}

      {transferencias.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <PackageCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay transferencias pendientes
            </h3>
            <p className="text-gray-500">
              Cuando otras sucursales envíen productos, aparecerán aquí para que los recibas
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

// ====================================
// COMPONENTE PRINCIPAL
// ====================================

export default function MisTransferencias() {
  const timeZone = 'America/Mexico_City';
  const now = new Date();
  const zonedDate = toZonedTime(now, timeZone);
  const fechaFormateada = format(zonedDate, 'yyyy-MM-dd');
  const [tabActiva, setTabActiva] = useState('todas');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [fechaDesde, setFechaDesde] = useState<string>(fechaFormateada);
  const [fechaHasta, setFechaHasta] = useState<string>(fechaFormateada);
  const [transferencias, setTransferencias] = useState<TransferenciaDTO[]>([]);
  const [transferenciasPendientes, setTransferenciasPendientes] = useState<TransferenciaDTO[]>([]);
  const [idTransferencia, setIdTransferencia] = useState<number>(0);

  const { user } = useCurrentUser();
  // Simular datos del usuario


  useEffect(() => {
    obtenerTransferenciasApi(user.id_usuario, user.id_rol, fechaDesde, fechaHasta).then(res => {
      if (res.success) {
        setTransferencias(res.data);
      } else {
        setTransferencias([]);
      }
    });

    obtenerTransferenciasPendientesApi(user.id_sucursal).then(res => {
      if (res.success) {
        setTransferenciasPendientes(res.data);
      } else {
        setTransferenciasPendientes([]);
      }
    });

  }, [fechaDesde, fechaHasta]);


  // Filtrar transferencias según el rol
  const transferenciasVisibles = user.id_rol === 1
    ? transferencias
    : transferencias.filter(t =>
      t.id_sucursal_origen === user.id_sucursal
    );

  // Handlers
  const handleEnviar = async (id: number) => {
    const res = await enviarTransferenciasApi(id, user.id_usuario);
    if (res.success) {

      toast.success("Transferencia enviada correctamente", {
        description: "La transferencia ha sido enviada y está en tránsito."
      });
      obtenerTransferenciasApi(user.id_usuario, user.id_rol, fechaDesde, fechaHasta).then(res => {
        if (res.success) {
          setTransferencias(res.data);
        } else {
          setTransferencias([]);
        }
      });

    } else {
      toast.error("Error al enviar la transferencia", {
        description: res.message
      });
    }
  };

  const handleCancelar = (id: number) => {
    console.log('Cancelar transferencia:', id);
    alert(`Cancelando transferencia #${id}`);
  };

  const handleVerDetalle = (id: number) => {
    setIdTransferencia(id);
    setIsOpen(true);
  };

  const handleRecibir = (id: number) => {
    setIsOpen(true);
    setIdTransferencia(id);
  };

  const tabs = [
    {
      id: 'todas',
      label: 'Todas las Transferencias',
      icon: <Package className="w-4 h-4" />,
      count: transferenciasVisibles.length
    },
    {
      id: 'pendientes-recibir',
      label: 'Por Recibir',
      icon: <PackageCheck className="w-4 h-4" />,
      count: transferenciasPendientes.length
    }
  ];

  return (
    <div className="p-0">
      <DialogConfirmarAceptarTranseferencia isOpen={isOpen} setIsOpen={setIsOpen} idTransferencia={idTransferencia} />
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2 transferencias-header-content">
            <div className="bg-blue-100 p-2 rounded-lg">
              <ArrowRightLeft className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Transferencias de Productos
            </h1>
          </div>
          <p className="text-gray-600 text-center">
            {user.id_rol === 1
              ? 'Vista de administrador - Todas las sucursales'
              : `Transferencias de ${user.sucursal}`
            }
          </p>
        </div>

        {/* Tabs */}
        <Card className="mb-6">
          <Tabs
            tabs={tabs}
            activeTab={tabActiva}
            onChange={() => { setTabActiva(tabActiva === 'todas' ? 'pendientes-recibir' : 'todas') }}
          />
        </Card>

        {/* Contenido según tab activa */}
        {tabActiva === 'todas' && (
          <Card>

            <div>
              <section className="transfer-filters">
                <div className="date-input-group">
                  <p className="font-bold text-primary">Fecha desde</p>
                  <input type="date" className="date-input" defaultValue={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                </div>
                <div className="date-input-group">
                  <p className="font-bold text-primary">Fecha hasta</p>
                  <input type="date" className="date-input" defaultValue={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                </div>
              </section>

            </div>

            <TablaTransferencias
              transferencias={transferenciasVisibles}
              onEnviar={handleEnviar}
              onCancelar={handleCancelar}
              onVerDetalle={handleVerDetalle}
              loading={loading}
              setLoading={setLoading}
            />
          </Card>
        )}

        {tabActiva === 'pendientes-recibir' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Transferencias Pendientes de Recibir
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Productos enviados desde otras sucursales esperando tu confirmación
              </p>
            </div>
            <TransferenciasPendientesRecibir
              transferencias={transferenciasPendientes}
              onRecibir={handleRecibir}
            />
          </div>
        )}
      </div>
    </div>
  );
};




