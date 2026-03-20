import type { ReporteVentaDetallado } from "@/types/ReporteVentasT";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    DollarSign,
    Receipt,
    Clock,
    Package,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    Trash,
    Eye,
    Search
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import DialogCancelarVenta from "./DialogCancelarVenta";
import { useCurrentUser } from "@/contexts/currentUser";
import { useNavigate } from "react-router";
import "./tablaVentas.css";

interface TablaVentasProps {
    ventas: ReporteVentaDetallado[];
    loading?: boolean;
    onVentaCancelada?: () => void;
}

type SortField = 'fecha_venta' | 'total_venta' | 'id_venta' | 'cantidad_productos';
type SortDirection = 'asc' | 'desc';

export default function TablaVentas({ ventas, loading = false, onVentaCancelada }: TablaVentasProps) {
    const [sortField, setSortField] = useState<SortField>('fecha_venta');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [expandedVenta, setExpandedVenta] = useState<number | null>(null);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [ventaToCancel, setVentaToCancel] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const { user } = useCurrentUser();
    const navigate = useNavigate();

    useEffect(() => {
        setSelectedIndex(0);
    }, [searchTerm, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const filteredVentas = ventas.filter((venta) =>
        venta.id_venta.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        venta.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedVentas = [...filteredVentas].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        if (sortField === 'fecha_venta') {
            aValue = new Date(a.fecha_venta).getTime();
            bValue = new Date(b.fecha_venta).getTime();
        } else if (typeof aValue === 'string' || typeof bValue === 'string') {
            aValue = Number(aValue);
            bValue = Number(bValue);
        }

        if (sortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    // Keyboard navigation
    useEffect(() => {
        if (sortedVentas.length === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (isCancelDialogOpen) return;
            if (document.activeElement?.tagName === 'INPUT') {
                if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') return;
            }
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => (prev > 0 ? prev - 1 : sortedVentas.length - 1));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => (prev < sortedVentas.length - 1 ? prev + 1 : 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    const selectedVenta = sortedVentas[selectedIndex];
                    if (selectedVenta) {
                        navigate(`/reportes/detalleVenta?id=${selectedVenta.id_venta}&cliente=${selectedVenta.nombre_cliente}`);
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [sortedVentas, selectedIndex, navigate, isCancelDialogOpen]);

    // Auto-scroll to selected row
    useEffect(() => {
        if (tableContainerRef.current && sortedVentas.length > 0) {
            const selectedRow = tableContainerRef.current.querySelector(`[data-index="${selectedIndex}"]`);
            if (selectedRow) {
                selectedRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [selectedIndex, sortedVentas]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

    const formatDate = (dateString: string) =>
        format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });

    const formatTime = (dateString: string) =>
        format(new Date(dateString), "HH:mm:ss", { locale: es });

    const getEstadoConfig = (estado: number) => {
        const estados = {
            1: { label: 'Completada', icon: CheckCircle2, badgeClass: 'tv-badge tv-badge-completada' },
            0: { label: 'Cancelada', icon: XCircle, badgeClass: 'tv-badge tv-badge-cancelada' },
            3: { label: 'Pendiente', icon: AlertCircle, badgeClass: 'tv-badge tv-badge-pendiente' },
        };
        return estados[estado as keyof typeof estados] || estados[3];
    };

    const cancelarVenta = (id_venta: number) => {
        setVentaToCancel(id_venta);
        setIsCancelDialogOpen(true);
    };

    const totalVentas = filteredVentas.reduce((sum, v) => sum + Number(v.total_venta), 0);
    const totalProductos = filteredVentas.reduce((sum, v) => sum + Number(v.cantidad_productos), 0);

    /* ---- Loading ---- */
    if (loading) {
        return (
            <div className="tv-loading">
                <div className="tv-spinner" />
                <p>Cargando ventas...</p>
            </div>
        );
    }

    /* ---- Empty ---- */
    if (ventas.length === 0) {
        return (
            <div className="tv-empty">
                <div className="tv-empty-icon">
                    <Receipt size={28} color="#374151" />
                </div>
                <p className="tv-empty-title">No hay ventas registradas</p>
                <p className="tv-empty-desc">No se encontraron ventas en el período seleccionado</p>
            </div>
        );
    }

    /* ---- Main ---- */
    return (
        <div>
            {/* KPIs */}
            <div className="tv-kpi-grid">
                {/* Total de ventas */}
                <div className="tv-kpi-card">
                    <div className="tv-kpi-header blue">
                        <span className="tv-kpi-title">Total Ventas</span>
                        <span className="tv-kpi-icon blue"><Receipt size={18} color="#1d4ed8" /></span>
                    </div>
                    <div className="tv-kpi-body">
                        <div className="tv-kpi-value blue">{filteredVentas.length}</div>
                        <div className="tv-kpi-label">Transacciones</div>
                    </div>
                </div>

                {/* Ingresos */}
                <div className="tv-kpi-card">
                    <div className="tv-kpi-header green">
                        <span className="tv-kpi-title">Ingresos Totales</span>
                        <span className="tv-kpi-icon green"><TrendingUp size={18} color="#15803d" /></span>
                    </div>
                    <div className="tv-kpi-body">
                        <div className="tv-kpi-value green">{formatCurrency(totalVentas)}</div>
                        <div className="tv-kpi-label">Monto total vendido</div>
                    </div>
                </div>

                {/* Productos */}
                <div className="tv-kpi-card">
                    <div className="tv-kpi-header purple">
                        <span className="tv-kpi-title">Productos Vendidos</span>
                        <span className="tv-kpi-icon purple"><Package size={18} color="#7e22ce" /></span>
                    </div>
                    <div className="tv-kpi-body">
                        <div className="tv-kpi-value purple">{totalProductos}</div>
                        <div className="tv-kpi-label">Unidades totales</div>
                    </div>
                </div>

                {/* Ticket promedio */}
                <div className="tv-kpi-card">
                    <div className="tv-kpi-header amber">
                        <span className="tv-kpi-title">Ticket Promedio</span>
                        <span className="tv-kpi-icon amber"><DollarSign size={18} color="#b45309" /></span>
                    </div>
                    <div className="tv-kpi-body">
                        <div className="tv-kpi-value amber">
                            {formatCurrency(filteredVentas.length > 0 ? totalVentas / filteredVentas.length : 0)}
                        </div>
                        <div className="tv-kpi-label">Promedio por venta</div>
                    </div>
                </div>
            </div>

            {/* Tabla principal */}
            <div className="tv-card">
                {/* Header */}
                <div className="tv-card-header">
                    <div>
                        <div className="tv-card-title">
                            <Receipt size={22} />
                            Listado de Ventas
                        </div>
                        <div className="tv-card-desc">Haz clic en una fila o doble clic para ver el detalle</div>
                    </div>
                    <div className="tv-search-wrap">
                        <Search className="tv-search-icon" size={18} />
                        <input
                            className="tv-search-input"
                            placeholder="Buscar por #folio o cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Tabla */}
                <div className="tv-table-wrap" ref={tableContainerRef}>
                    <table className="tv-table">
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}></th>
                                <th onClick={() => handleSort('id_venta')}>ID</th>
                                <th onClick={() => handleSort('fecha_venta')}>Fecha / Hora</th>
                                <th className="text-right" onClick={() => handleSort('total_venta')}>Total</th>
                                <th>Pago</th>
                                <th className="text-center" onClick={() => handleSort('cantidad_productos')}>Pzas</th>
                                <th>Estado</th>
                                <th>Usuario</th>
                                <th>Cliente</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedVentas.map((venta, index) => {
                                const EstadoIcon = getEstadoConfig(venta.estado_venta).icon;
                                const isExpanded = expandedVenta === venta.id_venta;
                                const isSelected = selectedIndex === index;

                                return (
                                    <>
                                        <tr
                                            key={venta.id_venta}
                                            data-index={index}
                                            className={isSelected ? 'tv-row-selected' : ''}
                                            onClick={() => setSelectedIndex(index)}
                                            onDoubleClick={() => navigate(`/reportes/detalleVenta?id=${venta.id_venta}&cliente=${venta.nombre_cliente}`)}
                                        >
                                            {/* Expand button */}
                                            <td>
                                                <button
                                                    className="tv-btn-expand"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedVenta(isExpanded ? null : venta.id_venta);
                                                    }}
                                                >
                                                    {isExpanded
                                                        ? <ChevronUp size={16} />
                                                        : <ChevronDown size={16} />}
                                                </button>
                                            </td>

                                            {/* ID */}
                                            <td><span className="tv-id-badge">#{venta.id_venta}</span></td>

                                            {/* Fecha */}
                                            <td>
                                                <div className="tv-date">{formatDate(venta.fecha_venta).split(',')[0]}</div>
                                                <div className="tv-time">{formatTime(venta.fecha_venta)}</div>
                                            </td>

                                            {/* Total */}
                                            <td className="text-right">
                                                <span className="tv-amount">{formatCurrency(venta.total_venta)}</span>
                                            </td>

                                            {/* Método de pago */}
                                            <td>
                                                <span className="tv-badge tv-badge-neutral">{venta.metodo_pago_descripcion}</span>
                                            </td>

                                            {/* Piezas */}
                                            <td className="text-center">
                                                <span className="tv-badge tv-badge-neutral">{venta.cantidad_productos}</span>
                                            </td>

                                            {/* Estado */}
                                            <td>
                                                <span className={getEstadoConfig(venta.estado_venta).badgeClass}>
                                                    <EstadoIcon size={13} />
                                                    {getEstadoConfig(venta.estado_venta).label}
                                                </span>
                                            </td>

                                            {/* Usuario */}
                                            <td><span className="tv-truncate">{venta.nombre_usuario}</span></td>

                                            {/* Cliente */}
                                            <td><span className="tv-truncate">{venta.nombre_cliente}</span></td>

                                            {/* Acciones */}
                                            <td className="text-center">
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                                    <button
                                                        className="tv-btn tv-btn-view"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/reportes/detalleVenta?id=${venta.id_venta}&cliente=${venta.nombre_cliente}`);
                                                        }}
                                                    >
                                                        <Eye size={14} /> VER
                                                    </button>
                                                    {user?.id_rol === 1 && (
                                                        <button
                                                            className="tv-btn tv-btn-cancel"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                cancelarVenta(venta.id_venta);
                                                            }}
                                                        >
                                                            <Trash size={14} /> CANCELAR
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Fila expandida */}
                                        {isExpanded && (
                                            <tr className="tv-expand-row" key={`exp-${venta.id_venta}`}>
                                                <td colSpan={10}>
                                                    <div className="tv-expand-panel">
                                                        <div className="tv-expand-title">
                                                            <Receipt size={20} />
                                                            Detalles de Venta #{venta.id_venta}
                                                        </div>
                                                        <div className="tv-expand-divider" />
                                                        <div className="tv-detail-grid">
                                                            <div className="tv-detail-item">
                                                                <div className="tv-detail-label">Monto Recibido</div>
                                                                <div className="tv-detail-value amount">{formatCurrency(venta.monto_recibido)}</div>
                                                            </div>
                                                            <div className="tv-detail-item">
                                                                <div className="tv-detail-label">Cambio</div>
                                                                <div className="tv-detail-value amount">{formatCurrency(venta.cambio)}</div>
                                                            </div>
                                                            <div className="tv-detail-item">
                                                                <div className="tv-detail-label">ID Turno</div>
                                                                <div className="tv-detail-value">#{venta.id_turno}</div>
                                                            </div>
                                                            <div className="tv-detail-item">
                                                                <div className="tv-detail-label">Estado Turno</div>
                                                                <div className="tv-detail-value">{venta.turno_estado}</div>
                                                            </div>
                                                            <div className="tv-detail-item">
                                                                <div className="tv-detail-label">Apertura Turno</div>
                                                                <div className="tv-detail-value small">{formatDate(venta.turno_fecha_apertura)}</div>
                                                                <div className="tv-detail-subvalue">
                                                                    <Clock size={12} /> {formatTime(venta.turno_fecha_apertura)}
                                                                </div>
                                                            </div>
                                                            {venta.turno_fecha_cierre && (
                                                                <div className="tv-detail-item">
                                                                    <div className="tv-detail-label">Cierre Turno</div>
                                                                    <div className="tv-detail-value small">{formatDate(venta.turno_fecha_cierre)}</div>
                                                                    <div className="tv-detail-subvalue">
                                                                        <Clock size={12} /> {formatTime(venta.turno_fecha_cierre)}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="tv-detail-item">
                                                                <div className="tv-detail-label">Email Usuario</div>
                                                                <div className="tv-detail-value small">{venta.email_usuario}</div>
                                                            </div>
                                                            {venta.id_cliente && (
                                                                <div className="tv-detail-item">
                                                                    <div className="tv-detail-label">ID Cliente</div>
                                                                    <div className="tv-detail-value">#{venta.id_cliente}</div>
                                                                </div>
                                                            )}
                                                            {venta.nombre_cliente && (
                                                                <div className="tv-detail-item">
                                                                    <div className="tv-detail-label">Nombre Cliente</div>
                                                                    <div className="tv-detail-value">{venta.nombre_cliente}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <DialogCancelarVenta
                isOpen={isCancelDialogOpen}
                setIsOpen={setIsCancelDialogOpen}
                idVenta={ventaToCancel}
                onSuccess={() => { onVentaCancelada?.(); }}
            />
        </div>
    );
}
