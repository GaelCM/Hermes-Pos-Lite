

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
          <span className="uppercase tracking-wider">{tab.label}</span>
          {tab.count && tab.count > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === tab.id ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
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
    <div className="overflow-x-auto">
      {loading ? (
        <div className="text-center p-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 font-bold text-slate-600">Cargando transferencias...</p>
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
              {mostrarAcciones && <th className="text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {transferencias.map((transferencia: TransferenciaDTO) => (
              <tr key={transferencia.id_transferencia}>
                <td className="font-black text-blue-600">
                  #{transferencia.id_transferencia}
                </td>
                <td>
                  {getEstadoBadge(transferencia.estado)}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">{transferencia.sucursal_origen}</span>
                    <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                    <span className="text-sm font-black text-slate-900">{transferencia.sucursal_destino}</span>
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">
                    Operador: {transferencia.usuario_origen}
                  </div>
                </td>
                <td className="text-xs font-bold text-slate-600">
                  {formatFecha(transferencia.fecha_creacion)}
                </td>
                <td>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900">{transferencia.total_productos} Ítems</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{transferencia.total_piezas} piezas totales</span>
                  </div>
                </td>
                <td className="text-xs font-medium text-slate-600 max-w-[150px] truncate">
                  {transferencia.motivo || '---'}
                </td>
                {mostrarAcciones && (
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <button className="btn-action btn-eye" title="Ver Detalle" onClick={() => onVerDetalle(transferencia.id_transferencia)}>
                        <Eye className="w-4 h-4" />
                      </button>

                      {transferencia.estado === 'pendiente' && (
                        <>
                          <button className="btn-action btn-send" title="Enviar Transferencia" onClick={() => onEnviar(transferencia.id_transferencia)}>
                            <Send className="w-4 h-4" />
                          </button>
                          <button className="btn-action btn-ban" title="Cancelar" onClick={() => onCancelar(transferencia.id_transferencia)}>
                            <Ban className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {(transferencia.estado === 'en_transito' || transferencia.estado === 'recibida') && onImprimir && (
                        <button className="btn-action btn-print" title="Imprimir Ticket" onClick={() => onImprimir(transferencia.id_transferencia)}>
                          <Printer className="w-4 h-4" />
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
        <div className="text-center py-20 bg-slate-50/50">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Sin Registros</h3>
          <p className="text-slate-400 text-sm font-bold">No se encontraron transferencias en este rango.</p>
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {transferencias.map((transferencia: TransferenciaDTO) => (
        <Card key={transferencia.id_transferencia} className="p-6 pending-card border-l-4 border-l-blue-500">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                  <PackageCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Traspaso #{transferencia.id_transferencia}
                  </h3>
                  <p className="text-sm font-bold text-slate-500">
                    Origen: <span className="text-blue-600">{transferencia.sucursal_origen}</span>
                  </p>
                </div>
              </div>
              {getEstadoBadge(transferencia.estado)}
            </div>

            <div className="grid grid-cols-2 gap-y-4 mb-6 bg-slate-50/80 p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Enviado por</p>
                <p className="text-sm font-bold text-slate-800">{transferencia.usuario_origen}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Carga total</p>
                <p className="text-sm font-black text-slate-800">{transferencia.total_productos} Ítems</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Fecha Envío</p>
                <p className="text-xs font-bold text-slate-700">{formatFecha(transferencia.fecha_envio)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Piezas</p>
                <p className="text-sm font-bold text-slate-800">{transferencia.total_piezas} unidades</p>
              </div>
            </div>

            <div className="mb-6 flex-1">
              <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Observaciones</p>
              <div className="p-3 bg-white border border-dashed border-slate-200 rounded-lg text-sm text-slate-600 italic">
                "{transferencia.motivo || 'Sin comentarios adicionales'}"
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                className="flex-1 btn-recibir flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all text-sm"
                onClick={() => onRecibir(transferencia.id_transferencia)}
              >
                <PackageCheck className="w-5 h-5" />
                CONFIRMAR RECEPCIÓN
              </button>
              <button
                className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                onClick={() => onCancelar(transferencia.id_transferencia)}
                title="Rechazar/Cancelar"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </Card>
      ))}

      {transferencias.length === 0 && (
        <div className="lg:col-span-2">
          <Card className="p-20 text-center bg-slate-100/30 border-dashed">
            <PackageCheck className="w-20 h-20 text-slate-200 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-slate-300 uppercase tracking-tighter mb-2">
              Bandeja de Entrada Vacía
            </h3>
            <p className="text-slate-400 font-bold max-w-sm mx-auto">
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
        const printerName = localStorage.getItem("printer_device");

        if (!printerName) {
          toast.error("No se ha configurado una impresora en ajustes");
          return;
        }

        const ticketData = {
          printerName,
          id_transferencia: transfer.id_transferencia,
          sucursal_origen: transfer.sucursal_origen,
          sucursal_destino: transfer.sucursal_destino,
          usuario_origen: transfer.usuario_origen,
          fecha: transfer.fecha_envio || transfer.fecha_creacion,
          productos: transfer.productos, // [{ nombre_producto, nombre_presentacion, cantidad_enviada }]
          motivo: transfer.motivo,
          cortar: localStorage.getItem("printer_cut") !== "false"
        };

        // @ts-ignore
        await window["electron-api"]?.printTicketTransferenciaEscPos(ticketData);
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
    <div className="p-2">
      <DialogConfirmarAceptarTranseferencia isOpen={isOpen} setIsOpen={setIsOpen} idTransferencia={idTransferencia} />
      <DialogConfirmarCancelacion
        isOpen={isOpenCancel}
        setIsOpen={setIsOpenCancel}
        onConfirm={handleConfirmarCancelacion}
        idTransferencia={idTransferencia}
        loading={loadingCancel}
      />
      <div className="mx-auto">
        {/* Tabs Filter Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <Tabs
            tabs={tabs}
            activeTab={tabActiva}
            onChange={(id) => setTabActiva(id as string)}
          />

          {tabActiva === 'todas' && (
            <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-xl border border-slate-200 shadow-sm self-end md:self-auto mb-4 md:mb-0">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <input
                  type="date"
                  className="date-input-aero text-xs"
                  defaultValue={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                />
              </div>
              <span className="text-slate-400 font-black">—</span>
              <input
                type="date"
                className="date-input-aero text-xs"
                defaultValue={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Contenido Principal */}
        <div className="mt-4">
          {tabActiva === 'todas' ? (
            <div className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm">
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




