import { obtenerReporteMovimientosApi } from "@/api/reportesApi/reportesApi";
import { obtenerSucursalesApi } from "@/api/sucursalApi/sucursalApi";
import type { ReporteMovimientoItem } from "@/types/Reportes";
import type { Sucursal } from "@/types/Sucursal";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    History,
    Building2,
    Download,
    RefreshCw,
    Search,
    Filter,
    ArrowRightLeft,
    Package,
    AlertCircle,
} from "lucide-react";
import * as XLSX from 'xlsx';

export default function MovimientosPage() {
    const timeZone = 'America/Mexico_City';
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);
    const fechaFormateada = format(zonedDate, 'yyyy-MM-dd');

    const [fechaDesde, setFechaDesde] = useState(fechaFormateada);
    const [fechaHasta, setFechaHasta] = useState(fechaFormateada);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [sucursalSelected, setSucursalSelected] = useState<number | undefined>(undefined);
    const [tipoMovimientoSelected, setTipoMovimientoSelected] = useState<string | undefined>(undefined);
    const [movimientos, setMovimientos] = useState<ReporteMovimientoItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const data = await obtenerReporteMovimientosApi(fechaDesde, fechaHasta, sucursalSelected, tipoMovimientoSelected);
            setMovimientos(data.data);
        } catch (error) {
            console.error("Error al cargar datos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        obtenerSucursalesApi().then(data => {
            setSucursales(data.data);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        cargarDatos();
        setCurrentPage(1); // Reset page on filter change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sucursalSelected, tipoMovimientoSelected, fechaDesde, fechaHasta]);

    useEffect(() => {
        setCurrentPage(1); // Reset page on search change
    }, [searchTerm]);

    const movimientosFiltrados = useMemo(() => {
        if (!searchTerm) return movimientos;
        const term = searchTerm.toLowerCase();
        return movimientos.filter(m =>
            m.nombre_producto.toLowerCase().includes(term) ||
            m.sku_pieza?.toLowerCase().includes(term) ||
            m.nombre_usuario.toLowerCase().includes(term) ||
            m.referencia?.toLowerCase().includes(term) ||
            m.motivos?.toLowerCase().includes(term)
        );
    }, [movimientos, searchTerm]);

    const totalPages = Math.ceil(movimientosFiltrados.length / itemsPerPage);
    const currentItems = useMemo(() => {
        const lastIndex = currentPage * itemsPerPage;
        const firstIndex = lastIndex - itemsPerPage;
        return movimientosFiltrados.slice(firstIndex, lastIndex);
    }, [movimientosFiltrados, currentPage]);

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(movimientosFiltrados.map(m => ({
            'ID': m.id_movimiento,
            'Fecha': format(new Date(m.fecha_movimiento), 'dd/MM/yyyy HH:mm'),
            'Producto': m.nombre_producto,
            'SKU': m.sku_pieza || '--',
            'Tipo': m.tipo_movimiento,
            'Cantidad': m.cantidad,
            'Antes': m.cantidad_antes,
            'Después': m.cantidad_despues,
            'Sucursal': m.nombre_sucursal,
            'Usuario': m.nombre_usuario,
            'Referencia': m.referencia || '--',
            'Motivos': m.motivos || '--'
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
        XLSX.writeFile(wb, `Reporte_Movimientos_${fechaDesde}_${fechaHasta}.xlsx`);
    };

    const getTipoBadgeStyle = (tipo: string) => {
        switch (tipo) {
            case 'venta': return 'bg-emerald-100 text-emerald-700';
            case 'compra': return 'bg-blue-100 text-blue-700';
            case 'ajuste': return 'bg-amber-100 text-amber-700';
            case 'merma': return 'bg-red-100 text-red-700';
            case 'transferencia_entrada': return 'bg-indigo-100 text-indigo-700';
            case 'transferencia_salida': return 'bg-purple-100 text-purple-700';
            case 'devolucion': return 'bg-slate-100 text-slate-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <History className="w-9 h-9 text-indigo-600" />
                            Movimientos de Inventario
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm md:text-base">Consulta el historial detallado de entradas, salidas y ajustes de stock</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={exportToExcel}
                            disabled={movimientosFiltrados.length === 0}
                            className="hidden md:flex items-center gap-2 border-slate-300"
                        >
                            <Download className="w-4 h-4 text-emerald-600" />
                            Exportar Excel
                        </Button>
                        <Button
                            onClick={cargarDatos}
                            disabled={loading}
                            className="bg-primary hover:bg-primary/80 cursor-pointer text-white shadow-lg shadow-indigo-200"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Cargando...' : 'Actualizar'}
                        </Button>
                    </div>
                </div>

                {/* Filtros */}
                <Card className="border-none shadow-md overflow-hidden">
                    <div className="h-1 bg-primary w-full" />
                    <CardHeader className="bg-white pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                            <Filter className="w-5 h-5 text-indigo-500" />
                            Parámetros del Reporte
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="bg-white pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="fecha-desde" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Fecha Desde
                                </Label>
                                <Input
                                    id="fecha-desde"
                                    type="date"
                                    value={fechaDesde}
                                    onChange={(e) => setFechaDesde(e.target.value)}
                                    className="border-slate-200 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fecha-hasta" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Fecha Hasta
                                </Label>
                                <Input
                                    id="fecha-hasta"
                                    type="date"
                                    value={fechaHasta}
                                    onChange={(e) => setFechaHasta(e.target.value)}
                                    className="border-slate-200 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sucursal" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Sucursal
                                </Label>
                                <Select
                                    value={sucursalSelected?.toString() || "all"}
                                    onValueChange={(value) => setSucursalSelected(value === "all" ? undefined : Number(value))}
                                >
                                    <SelectTrigger className="border-slate-200">
                                        <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                                        <SelectValue placeholder="Todas las sucursales" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las sucursales</SelectItem>
                                        {sucursales.map((sucursal) => (
                                            <SelectItem key={sucursal.id_sucursal} value={sucursal.id_sucursal.toString()}>
                                                {sucursal.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tipo" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Tipo Movimiento
                                </Label>
                                <Select
                                    value={tipoMovimientoSelected || "all"}
                                    onValueChange={(value) => setTipoMovimientoSelected(value === "all" ? undefined : value)}
                                >
                                    <SelectTrigger className="border-slate-200">
                                        <ArrowRightLeft className="w-4 h-4 mr-2 text-slate-400" />
                                        <SelectValue placeholder="Todos los tipos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los tipos</SelectItem>
                                        <SelectItem value="venta">Venta</SelectItem>
                                        <SelectItem value="compra">Compra</SelectItem>
                                        <SelectItem value="ajuste">Ajuste</SelectItem>
                                        <SelectItem value="merma">Merma</SelectItem>
                                        <SelectItem value="transferencia_entrada">Transf. Entrada</SelectItem>
                                        <SelectItem value="transferencia_salida">Transf. Salida</SelectItem>
                                        <SelectItem value="devolucion">Devolución</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="search" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Buscar
                                </Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="search"
                                        placeholder="Producto, SKU, etc..."
                                        className="pl-9 border-slate-200 focus:ring-indigo-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Table */}
                <Card className="border-none shadow-md overflow-hidden">
                    <CardHeader className="bg-white border-b flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Detalle de Movimientos</CardTitle>
                            <CardDescription>Cronología de cambios en el inventario</CardDescription>
                        </div>
                        <div className="text-sm font-medium text-slate-500">
                            {movimientosFiltrados.length} movimientos registrados
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100 uppercase font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Fecha / Usuario</th>
                                        <th className="px-6 py-4">Producto</th>
                                        <th className="px-6 py-4">Tipo</th>
                                        <th className="px-6 py-4 text-center">Cant.</th>
                                        <th className="px-6 py-4 text-center">Stock Antes</th>
                                        <th className="px-6 py-4 text-center">Stock Desp.</th>
                                        <th className="px-6 py-4">Sucursal</th>
                                        <th className="px-6 py-4">Ref / Motivo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <AlertCircle className="w-8 h-8 opacity-20" />
                                                    <p>No se encontraron movimientos con los filtros aplicados.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map((m) => (
                                            <tr key={m.id_movimiento} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900">
                                                        {format(new Date(m.fecha_movimiento), 'dd/MM/yy HH:mm')}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-0.5">{m.nombre_usuario}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-slate-100 rounded-lg">
                                                            <Package className="w-4 h-4 text-slate-500" />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-900">{m.nombre_producto}</div>
                                                            <div className="text-xs text-slate-500 font-mono">{m.sku_pieza || '--'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTipoBadgeStyle(m.tipo_movimiento)}`}>
                                                        {m.tipo_movimiento.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className={`font-bold ${m.cantidad > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {m.cantidad > 0 ? '+' : ''}{m.cantidad}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center text-slate-500">
                                                    {m.cantidad_antes}
                                                </td>
                                                <td className="px-6 py-4 text-center font-medium text-slate-900">
                                                    {m.cantidad_despues}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-slate-600">
                                                        <Building2 className="w-3.5 h-3.5" />
                                                        {m.nombre_sucursal}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-slate-900 text-xs font-medium truncate max-w-[150px]" title={m.referencia || ''}>
                                                        {m.referencia || '--'}
                                                    </div>
                                                    <div className="text-slate-500 text-[10px] mt-0.5 italic truncate max-w-[150px]" title={m.motivos || ''}>
                                                        {m.motivos || ''}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-2 py-4 bg-white border-t rounded-b-lg shadow-sm">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <Button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                variant="outline"
                            >
                                Anterior
                            </Button>
                            <Button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                variant="outline"
                            >
                                Siguiente
                            </Button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-slate-700">
                                    Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, movimientosFiltrados.length)}</span> de <span className="font-medium">{movimientosFiltrados.length}</span> resultados
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="border-slate-300"
                                >
                                    Anterior
                                </Button>
                                <div className="flex items-center gap-1 px-4 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md">
                                    Página {currentPage} de {totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="border-slate-300"
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}