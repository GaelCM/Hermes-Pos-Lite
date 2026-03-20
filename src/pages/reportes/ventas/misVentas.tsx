import { obtenerReporteMisVentas } from "@/api/reportesApi/reportesApi";
import { useCurrentUser } from "@/contexts/currentUser";
import type { ReporteVentaDetallado } from "@/types/ReporteVentasT";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useEffect, useState } from "react";
import TablaVentas from "@/components/reportes/TablaVentas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, RefreshCw, LayoutList } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

export default function MisVentasReport() {
    const timeZone = 'America/Mexico_City';
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);
    const fechaFormateada = format(zonedDate, 'yyyy-MM-dd');
    const [ventas, setVentas] = useState<ReporteVentaDetallado[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fechaDesde, setFechaDesde] = useState(fechaFormateada);
    const [fechaHasta, setFechaHasta] = useState(fechaFormateada);
    const [soloTurnoActual, setSoloTurnoActual] = useState(false);
    const { user } = useCurrentUser();

    const [hasOpenCaja, setHasOpenCaja] = useState(false);

    useEffect(() => {
        const checkOpenCaja = async () => {
            // @ts-ignore
            const api = window["electron-api"];
            const storeTurno = await api?.getConfig("open_caja");
            const localTurno = localStorage.getItem("openCaja");
            setHasOpenCaja(storeTurno != null || localTurno != null);
        };
        checkOpenCaja();
    }, []);

    const obtenerMisVentas = async () => {
        setLoading(true);
        setError(null);
        try {
            let idTurno = undefined;

            // Si el usuario quiere filtrar por turno y hay una caja abierta
            if (soloTurnoActual) {
                // @ts-ignore
                const api = window["electron-api"];
                const storeTurno = await api?.getConfig("open_caja");
                if (storeTurno) {
                    idTurno = typeof storeTurno === 'number' ? storeTurno : (storeTurno.id_turno || storeTurno.id);
                }

                if (!idTurno) {
                    const localTurno = localStorage.getItem("openCaja");
                    if (localTurno) {
                        try {
                            const parsed = JSON.parse(localTurno);
                            idTurno = typeof parsed === 'number' ? parsed : (parsed.id_turno || parsed.id);
                        } catch (e) {
                            if (!isNaN(Number(localTurno))) idTurno = Number(localTurno);
                        }
                    }
                }
            }

            // Si hay turno, filtramos por turno. Si no, por sucursal.
            const res = await obtenerReporteMisVentas(
                fechaDesde,
                fechaHasta,
                undefined,
                idTurno,
                idTurno ? undefined : user.id_sucursal
            );

            if (res.success) {
                setVentas(res.data);
            } else {
                setError(res.message);
            }
        } catch (error) {
            setError("Error al obtener las ventas");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        obtenerMisVentas();
    }, [fechaDesde, fechaHasta, soloTurnoActual])

    return (
        <div className="container mx-auto py-8 px-4 space-y-6 bg-[#f0f3f9] min-h-screen">
            {/* Header */}
            <div className="space-y-2 pb-4 border-b-2 border-black">
                <h1 className="text-4xl font-black text-black uppercase tracking-tight flex items-center gap-3">
                    Mis Ventas
                </h1>
                <p className="text-black font-bold text-lg uppercase tracking-widest">
                    Consulta y analiza tus ventas realizadas
                </p>
            </div>

            {/* Filtros de Fecha */}
            <Card className="shadow-xl border-2 border-black bg-white rounded-xl overflow-hidden">
                <CardHeader className="bg-gray-100 border-b-2 border-black p-6">
                    <CardTitle className="flex items-center gap-2 text-black font-black uppercase text-xl">
                        <Calendar className="h-6 w-6" />
                        Filtros de Búsqueda
                    </CardTitle>
                    <CardDescription className="text-black font-bold mt-2">
                        SELECCIONA EL RANGO DE FECHAS PARA CONSULTAR LAS VENTAS
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 space-y-2 w-full">
                            <Label htmlFor="fecha-desde" className="text-sm font-black uppercase text-black">
                                Fecha Desde
                            </Label>
                            <Input
                                id="fecha-desde"
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                className="w-full border-2 border-black font-bold text-black h-12"
                            />
                        </div>

                        <div className="hidden md:flex items-center pb-2">
                            <div className="h-px w-8 bg-border"></div>
                        </div>

                        <div className="flex-1 space-y-2 w-full">
                            <Label htmlFor="fecha-hasta" className="text-sm font-black uppercase text-black">
                                Fecha Hasta
                            </Label>
                            <Input
                                id="fecha-hasta"
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                className="w-full border-2 border-black font-bold text-black h-12"
                            />
                        </div>

                        {hasOpenCaja && (
                            <div className="flex items-center space-x-3 pb-3 bg-gray-100 p-4 rounded-lg border-2 border-black">
                                <Switch
                                    id="solo-turno"
                                    checked={soloTurnoActual}
                                    onCheckedChange={setSoloTurnoActual}
                                    className="data-[state=checked]:bg-blue-600"
                                />
                                <Label
                                    htmlFor="solo-turno"
                                    className="text-sm font-black uppercase cursor-pointer flex items-center gap-2 text-black"
                                >
                                    <LayoutList className="h-5 w-5 text-black" />
                                    Solo mi turno actual
                                </Label>
                            </div>
                        )}

                        <Button
                            onClick={obtenerMisVentas}
                            disabled={loading}
                            className="cursor-pointer"
                            size="lg"
                        >
                            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Tabla de Ventas */}
            <TablaVentas ventas={ventas} loading={loading} onVentaCancelada={obtenerMisVentas} />
        </div>
    )
}