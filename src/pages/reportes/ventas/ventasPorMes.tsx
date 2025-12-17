import { obtenerReporteVentasPorMes } from "@/api/reportesApi/reportesApi";
import { obtenerSucursalesApi } from "@/api/sucursalApi/sucursalApi";
import type { VentaMensual } from "@/types/ReporteVentasT";
import type { Sucursal } from "@/types/Sucursal";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Calendar,
    Building2,
    BarChart3,
    Download,
    RefreshCw
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
    LineElement,
    PointElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

export default function VentasPorMes() {
    const timeZone = 'America/Mexico_City';
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);
    const fechaFormateada = format(zonedDate, 'yyyy-MM-dd');

    const [fechaDesde, setFechaDesde] = useState(fechaFormateada);
    const [fechaHasta, setFechaHasta] = useState(fechaFormateada);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [sucursalSelected, setSucursalSelected] = useState<number | undefined>(undefined);
    const [ventas, setVentas] = useState<VentaMensual[]>([]);
    const [loading, setLoading] = useState(false);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const data = await obtenerReporteVentasPorMes(fechaDesde, fechaHasta, sucursalSelected);
            setVentas(data.data);
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
    }, []);

    useEffect(() => {
        cargarDatos();
    }, [fechaDesde, fechaHasta, sucursalSelected]);

    // Calcular métricas totales
    const totalVentas = ventas.reduce((acc, v) => acc + Number(v.total_ventas), 0);
    const montoTotal = ventas.reduce((acc, v) => acc + Number(v.monto_total), 0);
    const ticketPromedio = totalVentas > 0 ? montoTotal / totalVentas : 0;
    const totalEfectivo = ventas.reduce((acc, v) => acc + Number(v.monto_efectivo), 0);
    const totalTarjeta = ventas.reduce((acc, v) => acc + Number(v.monto_tarjeta), 0);
    const totalTransferencia = ventas.reduce((acc, v) => acc + Number(v.monto_transferencia), 0);

    // Datos para gráfica de barras (Ventas por Mes)
    const chartBarData = {
        labels: ventas.map(v => v.mes_nombre),
        datasets: [
            {
                label: 'Monto Total ($)',
                data: ventas.map(v => Number(v.monto_total)),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
            },
        ],
    };

    // Datos para gráfica de líneas (Cantidad de Ventas)
    const chartLineData = {
        labels: ventas.map(v => v.mes_nombre),
        datasets: [
            {
                label: 'Cantidad de Ventas',
                data: ventas.map(v => Number(v.total_ventas)),
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
            },
        ],
    };

    // Datos para gráfica de pie (Métodos de Pago)
    const chartPieData = {
        labels: ['Efectivo', 'Tarjeta', 'Transferencia'],
        datasets: [
            {
                data: [totalEfectivo, totalTarjeta, totalTransferencia],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(168, 85, 247, 1)',
                ],
                borderWidth: 2,
            },
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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(value);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="p-10 mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
                            <BarChart3 className="w-10 h-10 text-blue-600" />
                            Reporte de Ventas Mensuales
                        </h1>
                        <p className="text-slate-600 mt-2">Análisis detallado de ventas por período</p>
                    </div>
                    <Button
                        onClick={cargarDatos}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                </div>

                {/* Filtros */}
                <Card className="shadow-lg border-slate-200">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                        <CardTitle className="flex items-center gap-2 text-slate-800">
                            <Calendar className="w-5 h-5" />
                            Filtros de Búsqueda
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="fecha-desde" className="text-slate-700 font-medium">
                                    Fecha Desde
                                </Label>
                                <input
                                    id="fecha-desde"
                                    type="date"
                                    value={fechaDesde}
                                    onChange={(e) => setFechaDesde(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fecha-hasta" className="text-slate-700 font-medium">
                                    Fecha Hasta
                                </Label>
                                <input
                                    id="fecha-hasta"
                                    type="date"
                                    value={fechaHasta}
                                    onChange={(e) => setFechaHasta(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sucursal" className="text-slate-700 font-medium">
                                    Sucursal
                                </Label>
                                <Select
                                    value={sucursalSelected?.toString()}
                                    onValueChange={(value) => setSucursalSelected(value === "all" ? undefined : Number(value))}
                                >
                                    <SelectTrigger className="w-full border-slate-300 focus:ring-2 focus:ring-blue-500">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="shadow-lg border-l-4 border-l-blue-500 hover:shadow-xl transition-shadow">
                        <CardHeader className="pb-3">
                            <CardDescription className="text-slate-600">Total Ventas</CardDescription>
                            <CardTitle className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                                <ShoppingCart className="w-8 h-8 text-blue-500" />
                                {totalVentas.toLocaleString()}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="shadow-lg border-l-4 border-l-green-500 hover:shadow-xl transition-shadow">
                        <CardHeader className="pb-3">
                            <CardDescription className="text-slate-600">Monto Total</CardDescription>
                            <CardTitle className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                                <DollarSign className="w-8 h-8 text-green-500" />
                                {formatCurrency(montoTotal)}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="shadow-lg border-l-4 border-l-purple-500 hover:shadow-xl transition-shadow">
                        <CardHeader className="pb-3">
                            <CardDescription className="text-slate-600">Ticket Promedio</CardDescription>
                            <CardTitle className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-8 h-8 text-purple-500" />
                                {formatCurrency(ticketPromedio)}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="shadow-lg border-l-4 border-l-orange-500 hover:shadow-xl transition-shadow">
                        <CardHeader className="pb-3">
                            <CardDescription className="text-slate-600">Períodos Analizados</CardDescription>
                            <CardTitle className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                                <Calendar className="w-8 h-8 text-orange-500" />
                                {ventas.length}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Gráficas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                            <CardTitle className="text-slate-800">Monto de Ventas por Mes</CardTitle>
                            <CardDescription>Evolución del monto total de ventas</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-80">
                                <Bar data={chartBarData} options={chartOptions} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                            <CardTitle className="text-slate-800">Métodos de Pago</CardTitle>
                            <CardDescription>Distribución por tipo de pago</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-80">
                                <Pie data={chartPieData} options={chartOptions} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <Card className="shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                            <CardTitle className="text-slate-800">Cantidad de Ventas por Mes</CardTitle>
                            <CardDescription>Tendencia de la cantidad de transacciones</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-80">
                                <Line data={chartLineData} options={chartOptions} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabla Detallada */}
                <Card className="shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-slate-800">Detalle por Período</CardTitle>
                                <CardDescription>Información detallada de cada mes</CardDescription>
                            </div>
                            <Button variant="outline" className="gap-2">
                                <Download className="w-4 h-4" />
                                Exportar
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 border-b-2 border-slate-300">
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Mes</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Sucursal</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Total Ventas</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Monto Total</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Ticket Prom.</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Efectivo</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Tarjeta</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Transferencia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ventas.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                                                No hay datos disponibles para el período seleccionado
                                            </td>
                                        </tr>
                                    ) : (
                                        ventas.map((venta, index) => (
                                            <tr
                                                key={index}
                                                className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                                            >
                                                <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                                                    {venta.mes_nombre}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {venta.sucursal}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-900 text-right font-medium">
                                                    {Number(venta.total_ventas).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-900 text-right font-semibold">
                                                    {formatCurrency(Number(venta.monto_total))}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-700 text-right">
                                                    {formatCurrency(Number(venta.ticket_promedio))}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-green-700 text-right">
                                                    {formatCurrency(Number(venta.monto_efectivo))}
                                                    <span className="text-xs text-slate-500 ml-1">
                                                        ({venta.ventas_efectivo_count})
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-blue-700 text-right">
                                                    {formatCurrency(Number(venta.monto_tarjeta))}
                                                    <span className="text-xs text-slate-500 ml-1">
                                                        ({venta.ventas_tarjeta_count})
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-purple-700 text-right">
                                                    {formatCurrency(Number(venta.monto_transferencia))}
                                                    <span className="text-xs text-slate-500 ml-1">
                                                        ({venta.ventas_transferencia_count})
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {ventas.length > 0 && (
                                    <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                                        <tr className="font-bold">
                                            <td className="px-4 py-3 text-sm text-slate-900" colSpan={2}>TOTALES</td>
                                            <td className="px-4 py-3 text-sm text-slate-900 text-right">
                                                {totalVentas.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-900 text-right">
                                                {formatCurrency(montoTotal)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-900 text-right">
                                                {formatCurrency(ticketPromedio)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-green-700 text-right">
                                                {formatCurrency(totalEfectivo)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-blue-700 text-right">
                                                {formatCurrency(totalTarjeta)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-purple-700 text-right">
                                                {formatCurrency(totalTransferencia)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}