
import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { useCurrentUser } from "@/contexts/currentUser"
import { cerrarCorteApi } from "@/api/cortesApi/cortesApi"
import type { CerrarCorteResponse } from "@/types/Cortes"
import FormCerrarCaja from "./components/FormCerrarCaja"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, DollarSign, ArrowUp, ShoppingCart, ShoppingBag } from "lucide-react"

export default function CerrarCajaPage() {
    const { user } = useCurrentUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resumenData, setResumenData] = useState<CerrarCorteResponse | null>(null);
    const [idTurno, setIdTurno] = useState<number | null>(null);

    useEffect(() => {
        // Obtener ID del turno de localStorage
        const corteStorage = localStorage.getItem("openCaja");
        if (corteStorage) {
            try {

                const parsed = JSON.parse(corteStorage);
                if (typeof parsed === 'number') {
                    setIdTurno(parsed);
                } else if (parsed && typeof parsed === 'object' && parsed.id) {
                    setIdTurno(parsed.id);
                } else if (parsed && typeof parsed === 'object' && parsed.id_turno) {
                    setIdTurno(parsed.id_turno);
                } else {
                    console.warn("Formato de corteCaja desconocido, intentando usar como número si es string simple", corteStorage);
                    // Fallback if simple string number
                    if (!isNaN(Number(corteStorage))) {
                        setIdTurno(Number(corteStorage));
                    }
                }
            } catch (e) {
                // If not json, maybe just number
                if (!isNaN(Number(corteStorage))) {
                    setIdTurno(Number(corteStorage));
                }
            }
        }
    }, []);

    const handleCerrarCaja = async (efectivoContado: number, observaciones: string) => {
        if (!user || !user.id_usuario) {
            setError("No se pudo identificar al usuario actual.");
            return;
        }

        if (!idTurno) {
            setError("No se encontró un turno activo para cerrar. Por favor verifica si ya está cerrada.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await cerrarCorteApi({
                id_turno: idTurno,
                id_usuario_cierre: user.id_usuario,
                efectivo_contado: efectivoContado,
                observaciones_cierre: observaciones
            });

            if (response.success) {
                setResumenData(response.data);
                localStorage.removeItem("openCaja");
            } else {
                setError(response.message);
            }
        } catch (err: any) {
            setError(err.message || "Ocurrió un error inesperado al cerrar la caja.");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number | null | undefined) => {
        if (val === null || val === undefined) return "$0.00";
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
    };

    if (resumenData) {
        // Show Summary
        const { resumen } = resumenData;
        return (
            <div className="container mx-auto p-4 max-w-4xl space-y-6">
                <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Caja Cerrada Exitosamente</AlertTitle>
                    <AlertDescription className="text-green-700">
                        El turno ha sido cerrado. A continuación se muestra el resumen del corte.
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ventas */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5 text-blue-500" /> Ventas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between"><span>Total Ventas:</span> <span className="font-bold">{formatCurrency(resumen.ventas.total)}</span></div>
                            <div className="flex justify-between text-sm"><span>En Efectivo:</span> <span>{formatCurrency(resumen.ventas.efectivo)}</span></div>
                            <div className="flex justify-between text-sm"><span>En Tarjeta:</span> <span>{formatCurrency(resumen.ventas.tarjeta)}</span></div>
                            <div className="flex justify-between text-sm"><span>No. Transacciones:</span> <span>{resumen.ventas.numero}</span></div>
                        </CardContent>
                    </Card>

                    {/* Egresos */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5 text-red-500" /> Egresos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between"><span>Total Egresos:</span> <span className="font-bold text-red-600">-{formatCurrency(resumen.egresos.total)}</span></div>
                            <div className="flex justify-between text-sm"><span>Compras:</span> <span>{formatCurrency(resumen.egresos.compras)}</span></div>
                            <div className="flex justify-between text-sm"><span>Gastos:</span> <span>{formatCurrency(resumen.egresos.gastos)}</span></div>
                        </CardContent>
                    </Card>

                    {/* Movimientos */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ArrowUp className="h-5 w-5 text-orange-500" /> Movimientos de Caja
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between"><span>Depósitos:</span> <span className="text-green-600">+{formatCurrency(resumen.movimientos.depositos)}</span></div>
                            <div className="flex justify-between"><span>Retiros:</span> <span className="text-red-600">-{formatCurrency(resumen.movimientos.retiros)}</span></div>
                        </CardContent>
                    </Card>

                    {/* Cuadre de Efectivo */}
                    <Card className="bg-slate-50 border-slate-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-green-600" /> Balance de Efectivo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm"><span>Efectivo Inicial:</span> <span>{formatCurrency(resumen.efectivo.inicial)}</span></div>
                            <div className="flex justify-between font-semibold pt-2 border-t">
                                <span>Efectivo Esperado (Sistema):</span>
                                <span>{formatCurrency(resumen.efectivo.esperado)}</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                                <span>Efectivo Contado (Real):</span>
                                <span>{resumen.efectivo.contado !== null ? formatCurrency(resumen.efectivo.contado) : 'N/A'}</span>
                            </div>

                            <div className={`flex justify-between font-bold text-lg pt-2 mt-2 border-t ${resumen.efectivo.diferencia < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                <span>Diferencia:</span>
                                <span>{formatCurrency(resumen.efectivo.diferencia)}</span>
                            </div>
                            {resumen.efectivo.diferencia !== 0 && (
                                <p className="text-xs text-center text-muted-foreground mt-1">
                                    {resumen.efectivo.diferencia < 0 ? "Faltante en caja" : "Sobrante en caja"}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-md my-10">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Cierre de Caja</CardTitle>
                    <CardDescription className="text-center">Confirmar montos finales para cerrar el turno</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {!idTurno ? (
                        <Alert className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Sin Turno Activo</AlertTitle>
                            <AlertDescription>No se detectó un control de caja activo en este dispositivo.</AlertDescription>
                        </Alert>
                    ) : (
                        <FormCerrarCaja onSubmit={handleCerrarCaja} isLoading={loading} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
