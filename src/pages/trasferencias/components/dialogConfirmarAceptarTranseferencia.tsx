import { obtenerDetalleTransferenciaApi, recibirYAutorizarTransferenciaApi } from "@/api/transferenciasApi/transferenciasApi";
import { useCurrentUser } from "@/contexts/currentUser";
import type { DetalleTransferenciaDTO } from "@/types/Transferencias";
import { format } from "date-fns";
import { ArrowRight, Calendar, MapPin, Package, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import "./dialogTransferencias.css";

interface DialogProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    idTransferencia: number;
}

export default function DialogConfirmarAceptarTranseferencia({ isOpen, setIsOpen, idTransferencia }: DialogProps) {

    const [detalleTransferencia, setDetalleTransferencia] = useState<DetalleTransferenciaDTO | null>(null);
    const [loading, setLoading] = useState(false);
    const { user } = useCurrentUser();

    useEffect(() => {
        if (isOpen && idTransferencia) {
            setLoading(true);
            obtenerDetalleTransferenciaApi(idTransferencia).then((res) => {
                if (res.success) {
                    setDetalleTransferencia(res.data);
                } else {
                    setDetalleTransferencia(null);
                }
            }).finally(() => {
                setLoading(false);
            });
        }
    }, [isOpen, idTransferencia]);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "-";
        return format(new Date(dateString), "dd/MM/yyyy HH:mm");
    };

    const recibirYautorizar = async () => {
        setLoading(true);
        recibirYAutorizarTransferenciaApi(idTransferencia, {
            id_usuario: user.id_usuario,
            aceptar: true,
            productos_recibidos: detalleTransferencia?.productos.map((producto) => ({
                id_producto: producto.id_producto,
                cantidad_recibida: producto.cantidad_enviada,
            }))
        }).then((res) => {
            if (res.success) {
                toast.success("Transferencia recibida exitosamente", { description: res.message });
                setIsOpen(false);
            } else {
                toast.error("Error al recibir la transferencia", { description: res.message });
            }
        }).finally(() => {
            setLoading(false);
        });
    };

    if (!isOpen) return null;

    return (
        <div className="dtf-overlay" onClick={() => !loading && setIsOpen(false)}>
            <div className="dtf-dialog dtf-dialog-lg" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="dtf-header">
                    <div className="dtf-header-row">
                        <div className="dtf-icon-wrap blue">
                            <Package size={20} color="#1d4ed8" />
                        </div>
                        <div>
                            <div className="dtf-title">Detalle de Transferencia #{idTransferencia}</div>
                        </div>
                    </div>
                    <div className="dtf-desc">
                        Revisa cuidadosamente los productos y cantidades antes de aceptar la transferencia.
                    </div>
                </div>

                {/* Body */}
                <div className="dtf-body">
                    {loading ? (
                        <div className="dtf-loading">
                            <div className="dtf-spinner" />
                        </div>
                    ) : detalleTransferencia ? (
                        <>
                            {/* Origen / Destino */}
                            <div className="dtf-info-grid">
                                <div className="dtf-info-card">
                                    <div className="dtf-info-card-head">
                                        <MapPin size={14} /> Origen
                                    </div>
                                    <div className="dtf-info-card-body">
                                        <div className="dtf-info-card-title">{detalleTransferencia.sucursal_origen}</div>
                                        <div className="dtf-info-card-sub">
                                            <User size={12} /> {detalleTransferencia.usuario_origen}
                                        </div>
                                    </div>
                                </div>
                                <div className="dtf-info-card">
                                    <div className="dtf-info-card-head">
                                        <MapPin size={14} /> Destino
                                    </div>
                                    <div className="dtf-info-card-body">
                                        <div className="dtf-info-card-title">{detalleTransferencia.sucursal_destino}</div>
                                        <div className="dtf-info-card-sub">
                                            {detalleTransferencia.usuario_recibe ? (
                                                <><User size={12} /> {detalleTransferencia.usuario_recibe}</>
                                            ) : (
                                                <em>Pendiente de recibir</em>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Meta: fecha, estado, motivo */}
                            <div className="dtf-meta-row">
                                <span className="dtf-meta-badge blue">
                                    <Calendar size={13} />
                                    Enviado: {formatDate(detalleTransferencia.fecha_envio)}
                                </span>
                                <span className="dtf-meta-badge gray">
                                    {detalleTransferencia.estado}
                                </span>
                                {detalleTransferencia.motivo && (
                                    <span className="dtf-meta-badge amber">
                                        "{detalleTransferencia.motivo}"
                                    </span>
                                )}
                            </div>

                            <div className="dtf-divider" />

                            {/* Tabla de productos */}
                            <div className="dtf-table-wrap">
                                <div className="dtf-table-head-row">
                                    <span className="dtf-table-head-label">
                                        <Package size={15} />
                                        Productos ({detalleTransferencia.productos.length})
                                    </span>
                                    <span className="dtf-table-head-total">
                                        Total Piezas: {detalleTransferencia.productos.reduce((acc, p) => acc + p.cantidad_enviada, 0)}
                                    </span>
                                </div>
                                <div className="dtf-products-scroll">
                                    <table className="dtf-products-table">
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th>SKU</th>
                                                <th>Presentación</th>
                                                <th className="text-right">Cant. Enviada</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detalleTransferencia.productos.map((prod) => (
                                                <tr key={prod.id_detalle_transferencia}>
                                                    <td>{prod.nombre_producto}</td>
                                                    <td className="mono">{prod.sku_pieza}</td>
                                                    <td>{prod.nombre_presentacion}</td>
                                                    <td className="text-right">
                                                        <span className="dtf-qty-badge">{prod.cantidad_enviada}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="dtf-empty">
                            No se pudo cargar la información de la transferencia.
                        </div>
                    )}
                </div>

                {/* Footer — solo si está en tránsito */}
                {detalleTransferencia?.estado === "en_transito" && (
                    <div className="dtf-footer">
                        <button
                            className="dtf-btn dtf-btn-outline"
                            onClick={() => setIsOpen(false)}
                            disabled={loading}
                        >
                            Cerrar
                        </button>
                        <button
                            className="dtf-btn dtf-btn-green"
                            onClick={recibirYautorizar}
                            disabled={loading || !detalleTransferencia}
                        >
                            {loading ? (
                                <><div className="dtf-spinner" style={{ width: 18, height: 18, borderWidth: 3 }} /> Procesando...</>
                            ) : (
                                <><ArrowRight size={16} /> Confirmar Recepción</>
                            )}
                        </button>
                    </div>
                )}

                {/* Footer de solo cierre si no está en tránsito */}
                {detalleTransferencia && detalleTransferencia.estado !== "en_transito" && (
                    <div className="dtf-footer">
                        <button className="dtf-btn dtf-btn-outline" onClick={() => setIsOpen(false)}>
                            Cerrar
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}