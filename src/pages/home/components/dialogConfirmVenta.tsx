import { nuevaVentaApi } from "@/api/ventasApi/ventasApi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrentUser } from "@/contexts/currentUser";
import { useListaProductos } from "@/contexts/listaProductos";
import type { EstadoVenta } from "@/types/Venta";
import { Check, Loader2, AlertCircle, Banknote, CreditCard, Landmark } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { useOnlineStatus } from "@/hooks/isOnline";
import { useHotkeys } from "react-hotkeys-hook";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Zap } from "lucide-react";
import { redondearPrecio } from "@/lib/utils";
import "./confirm-venta-dialog.css";

type dialogProps = {
    isOpen: boolean,
    onClose: (open: boolean) => void,
    inputRef?: React.RefObject<{ focus: () => void } | null>,
    metodoPago: number,
    setMetodoPago: (metodoPago: number) => void,
}

export default function DialogConfirmVenta({ isOpen, onClose, inputRef, metodoPago, setMetodoPago }: dialogProps) {

    const [estado, setEstado] = useState<EstadoVenta>("Inicio");
    const { getCarritoActivo, getTotalPrice, carritoActivo, eliminarCarrito, crearCarrito } = useListaProductos();
    const { user } = useCurrentUser()
    const carritoActual = getCarritoActivo();
    const totalVenta = redondearPrecio(getTotalPrice());
    const [cambioEfectivo, setCambioEfectivo] = useState(0);
    const isOnline = useOnlineStatus();
    const [modoTurbo, setModoTurbo] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const loadModoTurbo = async () => {
            // @ts-ignore
            const api = window["electron-api"];
            const val = await api?.getConfig("modo_turbo");
            setModoTurbo(val === true);
        };
        loadModoTurbo();
    }, []);

    useHotkeys("f1", () => {
        nuevaVenta(true);
    }, { enableOnFormTags: true, enabled: isOpen });
    useHotkeys("f2", () => {
        nuevaVenta(false);
    }, { enableOnFormTags: true, enabled: isOpen });

    const reloadVenta = async () => {
        setCambioEfectivo(0);
        setEstado("Inicio");
        setErrorMessage("");

        if (carritoActivo) {
            eliminarCarrito(carritoActivo);
            crearCarrito("Venta Principal");
        }
        await onClose(false);
        setTimeout(() => {
            inputRef?.current?.focus();
        }, 100);
    }

    useEffect(() => {
        if (estado === "Listo") {
            const timer = setTimeout(() => {
                reloadVenta();
                setMetodoPago(0);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [estado]);

    const nuevaVenta = async (isImprimir: boolean) => {
        if (getCarritoActivo()?.productos.length == 0) {
            toast.error('Error en el pago', { description: `No hay productos en el carrito.` });
            return;
        }
        if (cambioEfectivo < totalVenta && metodoPago === 0) {
            toast.error('Error en el pago', { description: `El monto recibido es menor al total a pagar.` });
            return;
        }

        const productosConPrecioCero = getCarritoActivo()?.productos.filter(p => {
            const precio = p.usarPrecioMayoreo ? p.product.precio_mayoreo : p.product.precio_venta;
            return precio <= 0;
        });

        if (productosConPrecioCero && productosConPrecioCero.length > 0) {
            toast.error('Error en el precio', {
                description: `Hay productos con precio de $0.00 en el carrito (${productosConPrecioCero[0].product.nombre_producto}).`,
            });
            return;
        }

        setEstado("Cargando");
        try {
            // @ts-ignore
            const api = window["electron-api"];
            const turnoStore = await api?.getConfig("open_caja");
            const turnoLocal = JSON.parse(localStorage.getItem("openCaja") || "{}");
            const finalTurno = turnoStore || turnoLocal;

            const ventaFinal = {
                id_usuario: user.id_usuario,
                usuario: user.usuario,
                id_sucursal: user.id_sucursal,
                monto_recibido: cambioEfectivo,
                metodo_pago: metodoPago,
                productos: getCarritoActivo()?.productos || [],
                id_cliente: carritoActual?.cliente?.id_cliente.toLocaleString() || "",
                id_turno: finalTurno?.id_turno
            };

            const printerName = await api?.getConfig("printer_device");
            const printerCut = (await api?.getConfig("printer_cut")) !== false;

            if (!isOnline || modoTurbo) {
                // @ts-ignore
                const offlineRes = await window["electron-api"]?.guardarVentaOffline(ventaFinal);
                if (offlineRes?.success) {
                    toast.success('Venta guardada localmente (Modo Offline)');

                    try {
                        if (printerName) {
                            if (isImprimir || metodoPago === 2) {
                                const ticketData = {
                                    printerName,
                                    sucursal: "Sucursal " + user.sucursal,
                                    id_sucursal: user.id_sucursal,
                                    direccion_sucursal: user.direccion_sucursal,
                                    telefono_sucursal: user.telefono_sucursal,
                                    usuario: user.usuario,
                                    cliente: carritoActual?.cliente?.nombre_cliente || "Público General",
                                    folio: "OFL-" + offlineRes.id,
                                    fecha: new Date(),
                                    productos: carritoActual?.productos?.map((p: any) => ({
                                        cantidad: p.quantity,
                                        nombre: `${p.product.nombre_producto} ${p.product.nombre_presentacion}`,
                                        importe: (p.usarPrecioMayoreo ? p.product.precio_mayoreo : p.product.precio_venta) * p.quantity
                                    })) || [],
                                    total: totalVenta,
                                    pagoCon: cambioEfectivo,
                                    cambio: Math.max(0, cambioEfectivo - totalVenta),
                                    ahorro: redondearPrecio(carritoActual?.productos?.reduce((acc: number, p: any) => acc + (p.usarPrecioMayoreo ? (p.product.precio_venta - p.product.precio_mayoreo) * p.quantity : 0), 0) || 0),
                                    turno: finalTurno?.id_turno || "0",
                                    metodo_pago: metodoPago,
                                    cortar: printerCut
                                };
                                // @ts-ignore
                                await window["electron-api"]?.printTicketVentaEscPos(ticketData);
                                toast.success("Ticket enviado a imprimir");
                            } else {
                                // @ts-ignore
                                await window["electron-api"]?.openCashDrawer(printerName);
                            }
                        } else {
                            toast.error("No se ha configurado una impresora en ajustes");
                        }
                    } catch (e) { console.error("Error al imprimir ticket offline:", e); }

                    setEstado("Listo");
                    return;
                } else { throw new Error("No se pudo guardar la venta localmente"); }
            }

            const res = await nuevaVentaApi(ventaFinal);
            if (res?.success) {
                toast.success('Venta generada correctamente');
                try {
                    if (printerName) {
                        if (isImprimir || metodoPago === 2) {
                            const ticketData = {
                                printerName,
                                sucursal: "Sucursal " + user.sucursal,
                                id_sucursal: user.id_sucursal,
                                direccion_sucursal: user.direccion_sucursal,
                                telefono_sucursal: user.telefono_sucursal,
                                usuario: user.usuario,
                                cliente: carritoActual?.cliente?.nombre_cliente || "Público General",
                                folio: res.data || "S/N",
                                fecha: new Date(),
                                productos: carritoActual?.productos?.map((p: any) => ({
                                    cantidad: p.quantity,
                                    nombre: `${p.product.nombre_producto} ${p.product.nombre_presentacion}`,
                                    importe: (p.usarPrecioMayoreo ? p.product.precio_mayoreo : p.product.precio_venta) * p.quantity
                                })) || [],
                                total: totalVenta,
                                pagoCon: cambioEfectivo,
                                cambio: Math.max(0, cambioEfectivo - totalVenta),
                                ahorro: redondearPrecio(carritoActual?.productos?.reduce((acc: number, p: any) => acc + (p.usarPrecioMayoreo ? (p.product.precio_venta - p.product.precio_mayoreo) * p.quantity : 0), 0) || 0),
                                turno: finalTurno?.id_turno || "0",
                                metodo_pago: metodoPago,
                                cortar: printerCut
                            };
                            // @ts-ignore
                            await window["electron-api"]?.printTicketVentaEscPos(ticketData);
                            toast.success("Ticket enviado a imprimir");
                        } else {
                            // @ts-ignore
                            await window["electron-api"]?.openCashDrawer(printerName);
                            toast.success("Venta finalizada (Sin ticket)");
                        }
                    }
                } catch (printError) { console.error("Error al imprimir ticket ESC/POS:", printError); }

                setEstado("Listo");
                setMetodoPago(0);
            } else {
                setErrorMessage(res.message || "Error desconocido");
                setEstado("Error");
                toast.error("Error al procesar la venta");
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : String(error));
            setEstado("Error");
            toast.error("Error al procesar la venta");
        }
    }

    useEffect(() => {
        if (isOpen) {
            if (metodoPago !== 0) {
                setCambioEfectivo(totalVenta);
            } else {
                setCambioEfectivo(0);
            }
        }
    }, [isOpen, metodoPago]);

    return (
        <Dialog open={isOpen} onOpenChange={() => {
            if (estado === "Listo") reloadVenta();
            else {
                onClose(false);
                setTimeout(() => inputRef?.current?.focus(), 100);
            }
        }}>
            <DialogContent className="sm:max-w-xl max-h-[98vh] overflow-hidden confirm-venta-container">
                <DialogHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <DialogTitle className="text-xl">Procesar Venta</DialogTitle>
                            <DialogDescription className="text-xs">Selecciona el método de pago para completar la venta</DialogDescription>
                        </div>
                        <div className="turbo-badge">
                            <Label htmlFor="modo-turbo" className="turbo-label">
                                <Zap className="h-3.5 w-3.5 fill-current" />
                                Modo Turbo
                            </Label>
                            <Switch
                                id="modo-turbo"
                                checked={modoTurbo}
                                className="scale-75"
                                onCheckedChange={async (val) => {
                                    setModoTurbo(val);
                                    // @ts-ignore
                                    const api = window["electron-api"];
                                    await api?.setConfig("modo_turbo", val);
                                    localStorage.setItem("modo_turbo", val.toString());
                                }}
                            />
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-6">
                    {estado === "Inicio" && (
                        <>
                            {/* Account Summary original */}
                            <div className="space-y-3 p-6 bg-white border-2 border-slate-100 rounded-3xl shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                                            <span>Productos: {carritoActual?.productos?.length ?? 0}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <span>Total Items: {carritoActual?.productos?.reduce((sum, item) => sum + item.quantity, 0) ?? 0}</span>
                                        </div>
                                        <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">Total a Pagar</h2>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-5xl font-black text-blue-600 tabular-nums leading-none">
                                            ${totalVenta.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Selection Indicator */}
                            <div className={`payment-method-badge ${metodoPago === 0 ? 'pm-efectivo' : metodoPago === 1 ? 'pm-tarjeta' : 'pm-credito'}`}>
                                {metodoPago === 0 && <Banknote className="h-6 w-6" />}
                                {metodoPago === 1 && <CreditCard className="h-6 w-6" />}
                                {metodoPago === 2 && <Landmark className="h-6 w-6" />}
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-black opacity-70">Método de Pago</span>
                                    <span className="text-lg font-black leading-none">
                                        {metodoPago === 0 ? 'Efectivo' : metodoPago === 1 ? 'Tarjeta Bancaria' : 'Crédito'}
                                    </span>
                                </div>
                            </div>

                            {/* Interaction Area */}
                            <div className="flex flex-col items-center gap-6">
                                <div className="text-center w-full">
                                    <h1 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
                                        {metodoPago === 0 ? 'Monto Recibido' : metodoPago === 1 ? 'Pago con Tarjeta' : 'Venta a Crédito'}
                                    </h1>

                                    {metodoPago === 0 ? (
                                        <div className="amount-input-wrapper">
                                            <span className="currency-symbol">$</span>
                                            <input
                                                type="number"
                                                step="any"
                                                className="big-amount-input"
                                                placeholder="0.00"
                                                autoFocus
                                                onChange={(e) => setCambioEfectivo(Number(e.target.value))}
                                            />
                                        </div>
                                    ) : (
                                        <div className="py-6 px-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl max-w-sm mx-auto">
                                            <span className="text-6xl font-black tabular-nums text-slate-600">
                                                ${totalVenta.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {metodoPago === 0 && cambioEfectivo > 0 && (
                                    <div className={`change-card ${cambioEfectivo >= totalVenta ? 'excess' : 'deficit'}`}>
                                        <span className="change-label">
                                            {cambioEfectivo >= totalVenta ? 'Su Cambio' : 'Faltan'}
                                        </span>
                                        <span className="change-amount">
                                            ${Math.abs(cambioEfectivo - totalVenta).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Actions Restored with Solid Colors */}
                            <div className="flex flex-col gap-3 pt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Button
                                        onClick={() => nuevaVenta(true)}
                                        className="h-16 bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-green-100 border-b-4 border-green-700 transition-all active:translate-y-1 active:border-b-0"
                                        disabled={metodoPago === undefined}
                                    >
                                        <Check className="mr-2 h-5 w-5" /> Completar e imprimir ticket (F1)
                                    </Button>
                                    <Button
                                        onClick={() => nuevaVenta(false)}
                                        className="h-16 bg-[#eab308] hover:bg-[#ca8a04] text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-yellow-100 border-b-4 border-yellow-710 transition-all active:translate-y-1 active:border-b-0"
                                        disabled={metodoPago === undefined}
                                    >
                                        <Zap className="mr-2 h-5 w-5" /> Completar sin imprimir (F2)
                                    </Button>
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={() => onClose(false)}
                                    className="h-14 bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs font-black uppercase tracking-widest shadow-md border-b-4 border-red-700 transition-all active:translate-y-1 active:border-b-0"
                                >
                                    <AlertCircle className="mr-2 h-5 w-5" /> Cancelar Operación
                                </Button>
                            </div>
                        </>
                    )}

                    {estado === "Cargando" && (
                        <div className="py-12 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                            <p className="text-lg font-bold text-slate-600">Procesando Transacción...</p>
                        </div>
                    )}

                    {estado === "Listo" && (
                        <div className="py-12 flex flex-col items-center justify-center gap-6 animate-in zoom-in-95 duration-300">
                            <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center border-4 border-green-500">
                                <Check className="h-12 w-12 text-green-600" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-3xl font-black text-slate-800 mb-1">¡Venta Exitosa!</h3>
                                {metodoPago === 0 && (
                                    <p className="text-5xl font-black text-green-600">Cambio: ${Math.max(0, (cambioEfectivo - totalVenta)).toFixed(2)}</p>
                                )}
                            </div>
                            <Button className="w-full h-14 text-lg font-black uppercase rounded-xl" autoFocus onClick={reloadVenta}>
                                Entendido
                            </Button>
                        </div>
                    )}

                    {estado === "Error" && (
                        <div className="py-10 flex flex-col items-center justify-center gap-6">
                            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center border-4 border-red-500">
                                <AlertCircle className="h-10 w-10 text-red-600" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-red-600 mb-2">Error al Procesar</h3>
                                <p className="text-slate-500 font-medium max-w-md">{errorMessage}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <Button variant="outline" className="h-12 font-bold" onClick={() => { setEstado("Inicio"); setErrorMessage(""); }}>
                                    Cerrar y Revisar
                                </Button>
                                <Button className="h-12 font-bold bg-red-600 hover:bg-red-700 text-white" onClick={() => nuevaVenta(true)}>
                                    Intentar de Nuevo
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
