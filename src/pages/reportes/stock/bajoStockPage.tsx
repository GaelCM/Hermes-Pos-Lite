import { obtenerReporteBajoStockApi } from "@/api/reportesApi/reportesApi";
import { obtenerSucursalesApi } from "@/api/sucursalApi/sucursalApi";
import type { ReporteBajoStockItem } from "@/types/Reportes";
import type { Sucursal } from "@/types/Sucursal";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    AlertTriangle,
    PackageMinus,
    RefreshCw,
    Building2,
    Download,
    AlertOctagon,
    Boxes,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Eye
} from "lucide-react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Link } from "react-router";

// Registrar componentes de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

export default function BajoStockPage() {
    const [productos, setProductos] = useState<ReporteBajoStockItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState<number | undefined>(undefined);

    // Estados para paginación y búsqueda
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const obtenerReporteBajoStock = async () => {
        setLoading(true);
        try {
            const response = await obtenerReporteBajoStockApi(sucursalSeleccionada);
            setProductos(response.data);
        } catch (error) {
            console.error("Error cargando reporte bajo stock", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        obtenerSucursalesApi().then(data => {
            setSucursales(data.data);
        });
    }, []);

    useEffect(() => {
        obtenerReporteBajoStock();
    }, [sucursalSeleccionada]);

    // Resetear a página 1 cuando cambia el término de búsqueda
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Lógica de filtrado y paginación
    const filteredProductos = productos.filter(p =>
        p.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku_pieza && p.sku_pieza.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentProductos = filteredProductos.slice(startIndex, startIndex + itemsPerPage);

    // Calcular métricas
    const totalProductos = productos.length;
    const agotados = productos.filter(p => p.cantidad_actual <= 0).length;
    const bajoStock = productos.filter(p => p.cantidad_actual > 0).length;

    // Top 10 productos con menor stock (GLOBAL, no del filtrado, para mantener las gráficas útiles)
    const topLowStock = [...productos]
        .sort((a, b) => a.cantidad_actual - b.cantidad_actual)
        .slice(0, 10);

    // Datos para gráfica de Pie (Estado de Stock)
    const chartPieData = {
        labels: ['Agotado', 'Bajo Stock'],
        datasets: [
            {
                data: [agotados, bajoStock],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)', // Red for Agotado
                    'rgba(234, 179, 8, 0.8)', // Yellow for Bajo Stock
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(234, 179, 8, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    // Datos para gráfica de Barras (Top productos críticos)
    const chartBarData = {
        labels: topLowStock.map(p => p.nombre_producto.substring(0, 15) + (p.nombre_producto.length > 15 ? '...' : '')),
        datasets: [
            {
                label: 'Stock Actual',
                data: topLowStock.map(p => p.cantidad_actual),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
            },
            {
                label: 'Stock Mínimo',
                data: topLowStock.map(p => p.cantidad_minima),
                backgroundColor: 'rgba(107, 114, 128, 0.3)',
                borderColor: 'rgba(107, 114, 128, 1)',
                borderWidth: 1,
            }
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="p-10 mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
                            <PackageMinus className="w-10 h-10 text-red-600" />
                            Reporte de Bajo Stock
                        </h1>
                        <p className="text-slate-600 mt-2">Monitoreo de productos críticos y agotados</p>
                    </div>
                    <Button
                        onClick={obtenerReporteBajoStock}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                </div>

                {/* Filtros */}
                <Card className="shadow-lg border-slate-200">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
                        <CardTitle className="flex items-center gap-2 text-slate-800">
                            <Building2 className="w-5 h-5" />
                            Filtros de Ubicación
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="sucursal" className="text-slate-700 font-medium">
                                    Sucursal
                                </Label>
                                <Select
                                    value={sucursalSeleccionada?.toString()}
                                    onValueChange={(value) => setSucursalSeleccionada(value === "all" ? undefined : Number(value))}
                                >
                                    <SelectTrigger className="w-full border-slate-300 focus:ring-2 focus:ring-red-500">
                                        <Building2 className="w-4 h-4 mr-2 text-slate-500" />
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
                        </div>
                    </CardContent>
                </Card>

                {/* KPIs Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="shadow-lg border-l-4 border-l-red-500 hover:shadow-xl transition-shadow">
                        <CardHeader className="pb-3">
                            <CardDescription className="text-slate-600">Productos Agotados</CardDescription>
                            <CardTitle className="text-3xl font-bold text-red-600 flex items-center gap-2">
                                <AlertOctagon className="w-8 h-8" />
                                {agotados}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="shadow-lg border-l-4 border-l-yellow-500 hover:shadow-xl transition-shadow">
                        <CardHeader className="pb-3">
                            <CardDescription className="text-slate-600">Productos Bajo Stock</CardDescription>
                            <CardTitle className="text-3xl font-bold text-yellow-600 flex items-center gap-2">
                                <AlertTriangle className="w-8 h-8" />
                                {bajoStock}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="shadow-lg border-l-4 border-l-blue-500 hover:shadow-xl transition-shadow">
                        <CardHeader className="pb-3">
                            <CardDescription className="text-slate-600">Total Críticos</CardDescription>
                            <CardTitle className="text-3xl font-bold text-blue-600 flex items-center gap-2">
                                <Boxes className="w-8 h-8" />
                                {totalProductos}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Gráficas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                            <CardTitle className="text-slate-800">Top 10 Productos Críticos</CardTitle>
                            <CardDescription>Productos con menor existencia vs mínimo requerido</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-80">
                                <Bar data={chartBarData} options={chartOptions} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
                            <CardTitle className="text-slate-800">Estado de Inventario</CardTitle>
                            <CardDescription>Distribución por estado de alerta</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-80">
                                <Pie data={chartPieData} options={chartOptions} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabla Detallada con Buscador y Paginación */}
                <Card className="shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-slate-800">Detalle de Productos</CardTitle>
                                <CardDescription>Listado completo de productos afectados</CardDescription>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="text"
                                        placeholder="Buscar producto o SKU..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 w-[300px]"
                                    />
                                </div>
                                <Button variant="outline" className="gap-2">
                                    <Download className="w-4 h-4" />
                                    Exportar
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="overflow-x-auto min-h-[400px]">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 border-b-2 border-slate-300">
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Producto</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">SKU / Código</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Sucursal</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Stock Actual</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Stock Mínimo</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentProductos.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                                {searchTerm ? "No se encontraron resultados para tu búsqueda" : "No se encontraron productos con bajo stock"}
                                            </td>
                                        </tr>
                                    ) : (
                                        currentProductos.map((producto, index) => (
                                            <tr
                                                key={index}
                                                className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                                            >
                                                <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                                                    {producto.nombre_producto}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                                                    {producto.sku_pieza || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {producto.nombre_sucursal}
                                                </td>
                                                <td className={`px-4 py-3 text-sm text-right font-bold ${producto.cantidad_actual <= 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                                                    {producto.cantidad_actual}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-slate-600">
                                                    {producto.cantidad_minima}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center">
                                                    {producto.cantidad_actual <= 0 ? (
                                                        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">
                                                            Agotado
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
                                                            Bajo Stock
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    <Link to={`/productos/editProducto?id=${producto.id_producto}`} className="cursor-pointer">
                                                        <Button variant="outline" size="icon" className="cursor-pointer">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        {filteredProductos.length > 0 && (
                            <div className="flex items-center justify-between mt-4 px-2">
                                <div className="text-sm text-slate-500">
                                    Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredProductos.length)} de {filteredProductos.length} productos
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronsLeft className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>

                                    <div className="flex items-center gap-1 mx-2">
                                        <span className="text-sm font-medium text-slate-700">
                                            Página {currentPage} de {totalPages}
                                        </span>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronsRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}