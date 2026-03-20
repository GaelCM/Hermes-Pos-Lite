import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { obtenerReporteDetalleVenta } from "@/api/reportesApi/reportesApi";
import { cancelarProductoVentaApi } from "@/api/ventasApi/ventasApi";
import { useCurrentUser } from "@/contexts/currentUser";
import type { DetalleVentaItem } from "@/types/ReporteVentasT";
import {
    Package,
    ShoppingCart,
    Calendar,
    Tag,
    Hash,
    ChevronLeft,
    FileText,
    Layers,
    DollarSign,
    Printer,
    Trash2,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { redondearPrecio } from "@/lib/utils";
import "./detalleVenta.css";

export default function DetalleVentaPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const idVenta = searchParams.get("id");
    const cliente = searchParams.get("cliente");

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<DetalleVentaItem[]>([]);
    const { user } = useCurrentUser();

    const fetchDetalle = async () => {
        if (!idVenta) return;
        try {
            setLoading(true);
            const response = await obtenerReporteDetalleVenta(Number(idVenta));
            if (response.success) {
                setItems(response.data);
            } else {
                toast.error(response.message || "Error al obtener el detalle de la venta");
            }
        } catch (error) {
            console.error("Error fetching sale detail:", error);
            toast.error("Error de conexión al servidor");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!idVenta) {
            toast.error("No se proporcionó un ID de venta");
            navigate(-1);
            return;
        }
        fetchDetalle();
    }, [idVenta, navigate]);

    const [dialogOpen, setDialogOpen] = useState<number | null>(null);
    const [cantidadACancelar, setCantidadACancelar] = useState<number>(1);

    const handleCancelarProducto = async (id_detalle: number, nombre: string) => {
        try {
            const res = await cancelarProductoVentaApi(id_detalle, user.id_usuario, cantidadACancelar);
            if (res.success) {
                toast.success(`Producto "${nombre}" ajustado exitosamente`);
                setDialogOpen(null);
                setCantidadACancelar(1);
                await fetchDetalle();
            } else {
                toast.error(res.message || "Error al cancelar el producto");
            }
        } catch (error) {
            console.error("Error al cancelar producto:", error);
            toast.error("Error al procesar el ajuste");
        }
    };

    const totalVenta = redondearPrecio(items.reduce((acc, item) => acc + Number(item.subtotal), 0));
    const totalProductos = items.reduce((acc, item) => acc + Number(item.cantidad), 0);
    const saleInfo = items.length > 0 ? items[0] : null;

    const reimprimirTicket = async () => {
        if (!saleInfo) { toast.error("No hay información de la venta para imprimir"); return; }
        try {
            // @ts-ignore
            const api = window["electron-api"];
            const printerName = await api?.getConfig("printer_device");
            if (printerName) {
                const printerCut = (await api?.getConfig("printer_cut")) !== false;
                const ticketData = {
                    printerName,
                    sucursal: saleInfo.nombre_sucursal ? "Sucursal " + saleInfo.nombre_sucursal : "Sucursal",
                    id_sucursal: user.id_sucursal,
                    direccion_sucursal: user.direccion_sucursal,
                    telefono_sucursal: user.telefono_sucursal,
                    usuario: saleInfo.nombre_usuario,
                    cliente: saleInfo.id_cliente ? `Cliente: ${cliente}` : "Público General",
                    folio: saleInfo.id_venta,
                    fecha: saleInfo.fecha_venta ? new Date(saleInfo.fecha_venta) : new Date(),
                    productos: items?.map((p: any) => ({
                        cantidad: p.cantidad,
                        nombre: `${p.nombre_producto} ${p.nombre_unidad}`,
                        importe: p.subtotal
                    })) || [],
                    total: totalVenta,
                    pagoCon: saleInfo.monto_recibido,
                    cambio: Math.max(0, saleInfo.cambio || 0),
                    // @ts-ignore
                    ahorro: items.reduce((acc, item) => acc + (item.precio_mayoreo ? ((item.precio_normal || item.precio_unitario) - item.precio_unitario) * item.cantidad : 0), 0) || 0,
                    // @ts-ignore
                    turno: saleInfo.id_turno || "0",
                    cortar: printerCut
                };
                // @ts-ignore
                await api?.printTicketVentaEscPos(ticketData);
                toast.success("Ticket enviado a imprimir");
            } else {
                toast.error("No se ha configurado una impresora en ajustes");
            }
        } catch (e) {
            console.error("Error al reimprimir ticket:", e);
            toast.error("Error al conectar con la impresora");
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
    };

    /* ---- Loading ---- */
    if (loading) {
        return (
            <div className="dv-skeleton-wrap">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                    <div className="dv-skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
                    <div className="dv-skeleton" style={{ width: 280, height: 36 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="dv-skeleton" style={{ height: 110 }} />
                    ))}
                </div>
                <div className="dv-skeleton" style={{ height: 380 }} />
            </div>
        );
    }

    const isCompletada = saleInfo?.estado_venta === 1;

    return (
        <div className="dv-page">
            <div className="dv-container">

                {/* ---- Header ---- */}
                <div className="dv-header">
                    <div className="dv-header-left">
                        <button className="dv-back-btn" onClick={() => navigate(-1)}>
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <div className="dv-title">Detalle de Venta</div>
                            <div className="dv-subtitle">Registro de transacción #{idVenta}</div>
                        </div>
                        <button className="dv-btn-print" onClick={reimprimirTicket}>
                            <Printer size={16} /> Reimprimir Ticket
                        </button>
                    </div>
                    <div className="dv-header-actions">
                        <span className="dv-badge-id"><Hash size={12} /> ID: {idVenta}</span>
                        <span className="dv-badge-date"><Calendar size={12} /> {formatDate(saleInfo?.fecha_venta)}</span>
                    </div>
                </div>

                {/* ---- Info Grid ---- */}
                <div className="dv-info-grid">
                    {/* Info general */}
                    <div className="dv-info-card">
                        <div className="dv-info-card-title">
                            <FileText size={18} /> Información General
                        </div>
                        <div className="dv-info-fields">
                            <div>
                                <div className="dv-info-field-label">Vendedor</div>
                                <div className="dv-info-field-value">{saleInfo?.nombre_usuario || "N/A"}</div>
                            </div>
                            <div>
                                <div className="dv-info-field-label">Sucursal</div>
                                <div className="dv-info-field-value">{saleInfo?.nombre_sucursal || "N/A"}</div>
                            </div>
                            <div>
                                <div className="dv-info-field-label">Método Pago</div>
                                <span className="dv-badge-pago">{saleInfo?.metodo_pago_descripcion || "Efectivo"}</span>
                            </div>
                            <div>
                                <div className="dv-info-field-label">Cliente</div>
                                <div className="dv-info-field-value">#{saleInfo?.id_cliente || "General"}</div>
                                <div className="dv-info-field-value">{cliente}</div>
                            </div>
                        </div>
                    </div>

                    {/* Estado Card */}
                    <div className={`dv-estado-card ${isCompletada ? 'completada' : 'cancelada'}`}>
                        <div className="dv-estado-top">
                            <div className="dv-estado-icon-wrap">
                                <DollarSign size={24} color="#fff" />
                            </div>
                            <span className="dv-estado-badge">
                                {isCompletada ? "Completada" : "Cancelada"}
                            </span>
                        </div>
                        <div>
                            <div className="dv-estado-label">Total de la Venta</div>
                            <div className="dv-estado-total">{formatCurrency(totalVenta)}</div>
                        </div>
                    </div>
                </div>

                {/* ---- KPI Grid ---- */}
                <div className="dv-kpi-grid">
                    <div className="dv-kpi-card">
                        <div className="dv-kpi-head emerald">
                            <span className="dv-kpi-head-title">Subtotal Total</span>
                            <span className="dv-kpi-head-icon emerald"><DollarSign size={16} color="#15803d" /></span>
                        </div>
                        <div className="dv-kpi-body">
                            <div className="dv-kpi-value emerald">{formatCurrency(totalVenta)}</div>
                            <div className="dv-kpi-desc">Monto acumulado de los items</div>
                        </div>
                    </div>
                    <div className="dv-kpi-card">
                        <div className="dv-kpi-head blue">
                            <span className="dv-kpi-head-title">Cant. Artículos</span>
                            <span className="dv-kpi-head-icon blue"><ShoppingCart size={16} color="#1d4ed8" /></span>
                        </div>
                        <div className="dv-kpi-body">
                            <div className="dv-kpi-value blue">{totalProductos}</div>
                            <div className="dv-kpi-desc">Unidades totales vendidas</div>
                        </div>
                    </div>
                    <div className="dv-kpi-card">
                        <div className="dv-kpi-head amber">
                            <span className="dv-kpi-head-title">Recibido</span>
                            <span className="dv-kpi-head-icon amber"><Tag size={16} color="#b45309" /></span>
                        </div>
                        <div className="dv-kpi-body">
                            <div className="dv-kpi-value amber">{formatCurrency(saleInfo?.monto_recibido || 0)}</div>
                            <div className="dv-kpi-desc">Monto entregado por cliente</div>
                        </div>
                    </div>
                    <div className="dv-kpi-card">
                        <div className="dv-kpi-head purple">
                            <span className="dv-kpi-head-title">Cambio</span>
                            <span className="dv-kpi-head-icon purple"><Layers size={16} color="#7e22ce" /></span>
                        </div>
                        <div className="dv-kpi-body">
                            <div className="dv-kpi-value purple">{formatCurrency(saleInfo?.cambio || 0)}</div>
                            <div className="dv-kpi-desc">Monto devuelto al cliente</div>
                        </div>
                    </div>
                </div>

                {/* ---- Products Table ---- */}
                <div className="dv-table-card">
                    <div className="dv-table-header">
                        <div className="dv-table-header-title">
                            <Package size={20} /> Productos en la Venta
                        </div>
                        <span className="dv-table-count">{items.length} registros</span>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="dv-products-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th className="text-center">Cantidad</th>
                                    <th className="text-right">Precio Unit.</th>
                                    <th className="text-center">Tipo</th>
                                    <th className="text-right">Subtotal</th>
                                    {saleInfo?.estado_venta !== 0 && <th className="text-center">Ajuste</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id_detalle_venta}>
                                        <td>
                                            <div className="dv-product-cell">
                                                <div className="dv-product-icon">
                                                    <Package size={16} color="#6b7280" />
                                                </div>
                                                <span className="dv-product-name">
                                                    {item.nombre_producto} {item.nombre_unidad}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="dv-badge-cat">{item.nombre_categoria}</span>
                                        </td>
                                        <td className="text-center">
                                            {item.cantidad} {item.nombre_unidad}
                                        </td>
                                        <td className="text-right">
                                            {formatCurrency(item.precio_unitario)}
                                        </td>
                                        <td className="text-center">
                                            {item.precio_mayoreo
                                                ? <span className="dv-badge-mayoreo">Mayoreo</span>
                                                : <span className="dv-badge-menudeo">Menudeo</span>
                                            }
                                        </td>
                                        <td className="text-right">
                                            <span className="dv-subtotal">{formatCurrency(item.subtotal)}</span>
                                        </td>
                                        {saleInfo?.estado_venta !== 0 && (
                                            <td className="text-center">
                                                <button
                                                    className="dv-btn-remove"
                                                    onClick={() => {
                                                        setDialogOpen(item.id_detalle_venta);
                                                        setCantidadACancelar(1);
                                                    }}
                                                >
                                                    <Trash2 size={13} /> REMOVER
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {items.length === 0 && (
                            <div className="dv-table-empty">
                                <div className="dv-table-empty-icon">
                                    <FileText size={26} color="#6b7280" />
                                </div>
                                <p>No se encontraron productos para esta venta.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer totals */}
                    <div className="dv-footer">
                        <div className="dv-totals">
                            <div className="dv-total-row">
                                <span>Subtotal</span>
                                <span>{formatCurrency(totalVenta)}</span>
                            </div>
                            <div className="dv-total-row">
                                <span>Artículos totales</span>
                                <span>{totalProductos}</span>
                            </div>
                            <div className="dv-total-main">
                                <span className="dv-total-main-label">Total</span>
                                <span className="dv-total-main-value">{formatCurrency(totalVenta)}</span>
                            </div>
                            <div className="dv-pago-row">
                                <div>
                                    <div className="dv-pago-label">Entrega</div>
                                    <div className="dv-pago-val-entrega">{formatCurrency(saleInfo?.monto_recibido || 0)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="dv-pago-label">Cambio</div>
                                    <div className="dv-pago-val-cambio">{formatCurrency(saleInfo?.cambio || 0)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* ---- Dialog Confirmar Cancelación ---- */}
            {dialogOpen !== null && (() => {
                const item = items.find(i => i.id_detalle_venta === dialogOpen);
                if (!item) return null;
                return (
                    <div className="dv-dialog-overlay" onClick={() => setDialogOpen(null)}>
                        <div className="dv-dialog" onClick={(e) => e.stopPropagation()}>
                            <div className="dv-dialog-title">
                                <AlertCircle size={20} /> ¿Ajustar Venta?
                            </div>
                            <div className="dv-dialog-desc">
                                Estás por devolver/cancelar el producto <strong>"{item.nombre_producto}"</strong>.
                            </div>

                            {Number(item.cantidad) > 1 ? (
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 900, color: '#374151', textTransform: 'uppercase', marginBottom: 8 }}>
                                        Cantidad a devolver (Máx: {item.cantidad})
                                    </div>
                                    <div className="dv-qty-controls">
                                        <button
                                            className="dv-qty-btn"
                                            onClick={() => setCantidadACancelar(Math.max(1, cantidadACancelar - 1))}
                                            disabled={cantidadACancelar <= 1}
                                        >−</button>
                                        <span className="dv-qty-value">{cantidadACancelar}</span>
                                        <button
                                            className="dv-qty-btn"
                                            onClick={() => setCantidadACancelar(Math.min(Number(item.cantidad), cantidadACancelar + 1))}
                                            disabled={cantidadACancelar >= Number(item.cantidad)}
                                        >+</button>
                                    </div>
                                    <div className="dv-dialog-note">
                                        Se restarán <span>{formatCurrency(Number(item.precio_unitario) * cantidadACancelar)}</span> del total.
                                    </div>
                                </div>
                            ) : (
                                <div className="dv-dialog-note">
                                    Se regresará el stock y se restará <span>{formatCurrency(item.subtotal)}</span> del total.
                                </div>
                            )}

                            <div className="dv-dialog-footer">
                                <button className="dv-btn-cancel-dialog" onClick={() => setDialogOpen(null)}>
                                    Cancelar
                                </button>
                                <button
                                    className="dv-btn-confirm"
                                    onClick={() => handleCancelarProducto(item.id_detalle_venta, item.nombre_producto)}
                                >
                                    Confirmar Devolución
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
