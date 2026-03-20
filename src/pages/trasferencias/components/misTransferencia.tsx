

import { cancelarTransferenciaApi, enviarTransferenciasApi, obtenerDetalleTransferenciaApi, obtenerTransferenciasApi, obtenerTransferenciasPendientesApi } from "@/api/transferenciasApi/transferenciasApi";
import { useCurrentUser } from "@/contexts/currentUser";
import type { TablaTransferenciasProps, TransferenciasPendientesProps } from "@/types/ComponentsT";
import type { TransferenciaDTO } from "@/types/Transferencias";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { ArrowRightLeft, Ban, CheckCircle, Clock, Eye, Package, PackageCheck, Send, XCircle, Printer, Calendar } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import DialogConfirmarAceptarTranseferencia from "./dialogConfirmarAceptarTranseferencia";
import DialogConfirmarCancelacion from "./dialogConfirmarCancelacion";
import "../transferencias.css";





// ====================================
// COMPONENTES UI
// ====================================
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'pending' | 'transit' | 'received' | 'cancelled';
}
const Badge = ({ children, variant = 'default' }: BadgeProps) => {
  const variantClass = `badge-${variant}`;
  return (
    <span className={`badge-aero ${variantClass}`}>
      {children}
    </span>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
}
const Card = ({ children, className = '' }: CardProps) => (
  <div className={`aero-card ${className}`}>
    {children}
  </div>
);

// Button component removed as it's no longer used


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
    <div className="tabs-container">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`tab-btn-aero ${activeTab === tab.id ? "active" : ""}`}
        >
          {tab.icon}
          <span className="mtf-tab-label">{tab.label}</span>
          {tab.count !== undefined && tab.count > 0 && (
            <span className={`mtf-tab-badge ${activeTab === tab.id ? "active" : ""}`}>
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

const TablaTransferencias = ({ transferencias, onEnviar, onCancelar, onVerDetalle, onImprimir, mostrarAcciones = true, loading }: Omit<TablaTransferenciasProps, 'setLoading'>) => {
  return (
    <div className="mtf-table-container">
      {loading ? (
        <div className="mtf-loading-state">
          <div className="mtf-spinner-large"></div>
          <p>Cargando transferencias...</p>
        </div>
      ) : (
        <table className="aero-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Estado</th>
              <th>Movimiento</th>
              <th>Fecha</th>
              <th>Productos</th>
              <th>Nota</th>
              {mostrarAcciones && <th className="mtf-text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {transferencias.map((transferencia: TransferenciaDTO) => (
              <tr key={transferencia.id_transferencia}>
                <td className="mtf-cell-id">
                  #{transferencia.id_transferencia}
                </td>
                <td>
                  {getEstadoBadge(transferencia.estado)}
                </td>
                <td>
                  <div className="mtf-cell-movimiento">
                    <span>{transferencia.sucursal_origen}</span>
                    <ArrowRightLeft size={12} />
                    <span>{transferencia.sucursal_destino}</span>
                  </div>
                  <div className="mtf-cell-operador">
                    Operador: {transferencia.usuario_origen}
                  </div>
                </td>
                <td className="mtf-cell-fecha">
                  {formatFecha(transferencia.fecha_creacion)}
                </td>
                <td>
                  <div className="mtf-cell-productos">
                    <span className="mtf-prod-items">{transferencia.total_productos} Ítems</span>
                    <span className="mtf-prod-piezas">{transferencia.total_piezas} piezas totales</span>
                  </div>
                </td>
                <td className="mtf-cell-nota">
                  {transferencia.motivo || '---'}
                </td>
                {mostrarAcciones && (
                  <td>
                    <div className="mtf-cell-acciones">
                      <button className="btn-action btn-eye" title="Ver Detalle" onClick={() => onVerDetalle(transferencia.id_transferencia)}>
                        <Eye size={16} />
                      </button>

                      {transferencia.estado === 'pendiente' && (
                        <>
                          <button className="btn-action btn-send" title="Enviar Transferencia" onClick={() => onEnviar(transferencia.id_transferencia)}>
                            <Send size={16} />
                          </button>
                          <button className="btn-action btn-ban" title="Cancelar" onClick={() => onCancelar(transferencia.id_transferencia)}>
                            <Ban size={16} />
                          </button>
                        </>
                      )}
                      {(transferencia.estado === 'en_transito' || transferencia.estado === 'recibida') && onImprimir && (
                        <button className="btn-action btn-print" title="Imprimir Ticket" onClick={() => onImprimir(transferencia.id_transferencia)}>
                          <Printer size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && transferencias.length === 0 && (
        <div className="mtf-empty-state">
          <Package size={64} className="mtf-empty-icon-sm" />
          <h3 className="mtf-empty-title-sm">Sin Registros</h3>
          <p className="mtf-empty-desc-sm">No se encontraron transferencias en este rango.</p>
        </div>
      )}
    </div>
  );
};

// ====================================
// COMPONENTE: TRANSFERENCIAS PENDIENTES DE RECIBIR
// ====================================

const TransferenciasPendientesRecibir = ({ transferencias, onRecibir, onCancelar }: TransferenciasPendientesProps) => {
  return (
    <div className="mtf-pendientes-grid">
      {transferencias.map((transferencia: TransferenciaDTO) => (
        <Card key={transferencia.id_transferencia} className="mtf-pendiente-card">
          <div className="mtf-pendiente-inner">
            <div className="mtf-pendiente-header">
              <div className="mtf-pendiente-title-wrap">
                <div className="mtf-pendiente-icon">
                  <PackageCheck size={24} />
                </div>
                <div>
                  <h3 className="mtf-pendiente-title">
                    Traspaso #{transferencia.id_transferencia}
                  </h3>
                  <p className="mtf-pendiente-origen">
                    Origen: <span>{transferencia.sucursal_origen}</span>
                  </p>
                </div>
              </div>
              {getEstadoBadge(transferencia.estado)}
            </div>

            <div className="mtf-pendiente-stats">
              <div className="mtf-stat-box">
                <p className="mtf-stat-label">Enviado por</p>
                <p className="mtf-stat-val">{transferencia.usuario_origen}</p>
              </div>
              <div className="mtf-stat-box">
                <p className="mtf-stat-label">Carga total</p>
                <p className="mtf-stat-val text-black">{transferencia.total_productos} Ítems</p>
              </div>
              <div className="mtf-stat-box">
                <p className="mtf-stat-label">Fecha Envío</p>
                <p className="mtf-stat-val">{formatFecha(transferencia.fecha_envio)}</p>
              </div>
              <div className="mtf-stat-box">
                <p className="mtf-stat-label">Piezas</p>
                <p className="mtf-stat-val">{transferencia.total_piezas} unidades</p>
              </div>
            </div>

            <div className="mtf-pendiente-obs">
              <p className="mtf-obs-label">Observaciones</p>
              <div className="mtf-obs-box">
                "{transferencia.motivo || 'Sin comentarios adicionales'}"
              </div>
            </div>

            <div className="mtf-pendiente-actions">
              <button
                className="mtf-btn-recibir-large"
                onClick={() => onRecibir(transferencia.id_transferencia)}
              >
                <PackageCheck size={20} />
                CONFIRMAR RECEPCIÓN
              </button>
              <button
                className="mtf-btn-rechazar"
                onClick={() => onCancelar(transferencia.id_transferencia)}
                title="Rechazar/Cancelar"
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>
        </Card>
      ))}

      {transferencias.length === 0 && (
        <div className="mtf-empty-container">
          <Card className="mtf-empty-card">
            <PackageCheck className="mtf-empty-icon" size={80} />
            <h3 className="mtf-empty-title">
              Bandeja de Entrada Vacía
            </h3>
            <p className="mtf-empty-desc">
              No tienes transferencias pendientes por recibir de otras sucursales en este momento.
            </p>
          </Card>
        </div>
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
  const [isOpenCancel, setIsOpenCancel] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [fechaDesde, setFechaDesde] = useState<string>(fechaFormateada);
  const [fechaHasta, setFechaHasta] = useState<string>(fechaFormateada);
  const [transferencias, setTransferencias] = useState<TransferenciaDTO[]>([]);
  const [transferenciasPendientes, setTransferenciasPendientes] = useState<TransferenciaDTO[]>([]);
  const [idTransferencia, setIdTransferencia] = useState<number>(0);

  const { user } = useCurrentUser();
  // Simular datos del usuario


  useEffect(() => {
    setLoading(true);
    const fetchTransferencias = async () => {
      try {
        const res = await obtenerTransferenciasApi(user.id_usuario, user.id_rol, fechaDesde, fechaHasta);
        if (res.success) {
          setTransferencias(res.data);
        } else {
          setTransferencias([]);
        }

        const resPendientes = await obtenerTransferenciasPendientesApi(user.id_sucursal);
        if (resPendientes.success) {
          setTransferenciasPendientes(resPendientes.data);
        } else {
          setTransferenciasPendientes([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTransferencias();
  }, [fechaDesde, fechaHasta]);


  // Filtrar transferencias según el rol
  const transferenciasVisibles = user.id_rol === 1
    ? transferencias
    : transferencias.filter(t =>
      t.id_sucursal_origen === user.id_sucursal
    );

  const handlePrintTransferencia = async (id: number) => {
    try {
      const resDetalle = await obtenerDetalleTransferenciaApi(id);
      if (resDetalle.success) {
        const transfer = resDetalle.data;
        // @ts-ignore
        const api = window["electron-api"];
        const printerName = await api?.getConfig("printer_device");

        if (!printerName) {
          toast.error("No se ha configurado una impresora en ajustes");
          return;
        }

        const printerCut = (await api?.getConfig("printer_cut")) !== false;

        const ticketData = {
          printerName,
          id_transferencia: transfer.id_transferencia,
          sucursal_origen: transfer.sucursal_origen,
          sucursal_destino: transfer.sucursal_destino,
          usuario_origen: transfer.usuario_origen,
          fecha: transfer.fecha_envio || transfer.fecha_creacion,
          productos: transfer.productos, // [{ nombre_producto, nombre_presentacion, cantidad_enviada }]
          motivo: transfer.motivo,
          cortar: printerCut
        };

        // @ts-ignore
        await api?.printTicketTransferenciaEscPos(ticketData);
        toast.success("Ticket de transferencia enviado a imprimir");
      } else {
        toast.error("No se pudo obtener el detalle para imprimir");
      }
    } catch (error) {
      console.error("Error al imprimir transferencia:", error);
      toast.error("Error al intentar imprimir el ticket");
    }
  };

  // Handlers
  const handleEnviar = async (id: number) => {
    const res = await enviarTransferenciasApi(id, user.id_usuario);
    if (res.success) {
      toast.success("Transferencia enviada correctamente", {
        description: "La transferencia ha sido enviada y está en tránsito."
      });

      // Imprimir ticket automáticamente al enviar
      handlePrintTransferencia(id);

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
    setIdTransferencia(id);
    setIsOpenCancel(true);
  };

  const handleConfirmarCancelacion = async () => {
    if (!idTransferencia) return;

    try {
      setLoadingCancel(true);
      const res = await cancelarTransferenciaApi(idTransferencia, user.id_usuario);
      if (res.success) {
        toast.success("Transferencia cancelada", {
          description: res.message
        });

        // Recargar listas
        obtenerTransferenciasApi(user.id_usuario, user.id_rol, fechaDesde, fechaHasta).then(res => {
          if (res.success) setTransferencias(res.data);
        });

        obtenerTransferenciasPendientesApi(user.id_sucursal).then(res => {
          if (res.success) setTransferenciasPendientes(res.data);
        });

        setIsOpenCancel(false);
      } else {
        toast.error("Error al cancelar", { description: res.message });
      }
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    } finally {
      setLoadingCancel(false);
    }
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
    <div className="mtf-main-wrapper">
      <DialogConfirmarAceptarTranseferencia isOpen={isOpen} setIsOpen={setIsOpen} idTransferencia={idTransferencia} />
      <DialogConfirmarCancelacion
        isOpen={isOpenCancel}
        setIsOpen={setIsOpenCancel}
        onConfirm={handleConfirmarCancelacion}
        idTransferencia={idTransferencia}
        loading={loadingCancel}
      />
      <div className="mtf-content-wrap">
        {/* Tabs Filter Section */}
        <div className="mtf-header-controls">
          <Tabs
            tabs={tabs}
            activeTab={tabActiva}
            onChange={(id) => setTabActiva(id as string)}
          />

          {tabActiva === 'todas' && (
            <div className="mtf-date-filter">
              <div className="mtf-date-input-wrap">
                <Calendar size={16} />
                <input
                  type="date"
                  className="date-input-aero"
                  defaultValue={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                />
              </div>
              <span className="mtf-date-sep">—</span>
              <input
                type="date"
                className="date-input-aero"
                defaultValue={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Contenido Principal */}
        <div className="mtf-body-content">
          {tabActiva === 'todas' ? (
            <div className="mtf-card-table">
              <TablaTransferencias
                transferencias={transferenciasVisibles}
                onEnviar={handleEnviar}
                onCancelar={handleCancelar}
                onVerDetalle={handleVerDetalle}
                onImprimir={handlePrintTransferencia}
                loading={loading}
              />
            </div>
          ) : (
            <div>
              <TransferenciasPendientesRecibir
                transferencias={transferenciasPendientes}
                onRecibir={handleRecibir}
                onCancelar={handleCancelar}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};




