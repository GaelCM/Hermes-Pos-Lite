


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "./caja.css";

import { useListaProductos } from "@/contexts/listaProductos";
import { CreditCard, DollarSign, Minus, Pill, Plus, Scan, ShoppingCart, Trash2, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Reloj } from "./components/reloj";
import DialogConfirmVenta from "./components/dialogConfirmVenta";
import { useCliente } from "@/contexts/globalClient";
import AddCliente from "@/components/dialogAddCliente";
import { getProductoVenta } from "@/api/productosApi/productosApi";
import DialiogErrorProducto from "./Dialogs/noEncontrado";
import { useOutletContext } from "react-router";
import CarritoTabs from "@/components/carritoTabs";

import { useCurrentUser } from "@/contexts/currentUser";
import { useOnlineStatus } from "@/hooks/isOnline";
import { getProductos } from "@/api/productosApi/productosApi";
import { toast } from "sonner";
import DialogNuevoProductoTemp from "./components/dialogNuevoProductoTemp";
import DialogSetGranel from "./components/dialogSetGranel";
import type { ProductoVenta } from "@/types/Producto";


export default function Home() {
    const { user } = useCurrentUser();
    const [idProducto, setidProducto] = useState<string>();
    const [metodoPago, setMetodoPago] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [openCliente, setOpenCliente] = useState(false);
    const [error, setError] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [openNuevoProducto, setOpenNuevoProducto] = useState(false);

    // Estados para Granel
    const [openGranel, setOpenGranel] = useState(false);
    const [productoGranelPendiente, setProductoGranelPendiente] = useState<ProductoVenta | null>(null);

    const { clearCart, removeProduct, decrementQuantity, incrementQuantity, getTotalPrice, addProduct, getCarritoActivo, crearCarrito, carritoActivo, togglePrecioMayoreo } = useListaProductos();
    const { cliente } = useCliente();
    const { setFocusScanner } = useOutletContext<{ setFocusScanner: (fn: () => void) => void }>();

    const carritoActual = getCarritoActivo();

    // Crear un carrito por defecto si no existe carrito activo
    useEffect(() => {
        if (!carritoActivo) {
            crearCarrito("Venta Principal");
        }
    }, [carritoActivo, crearCarrito]);


    useHotkeys('alt+m', () => {
        setOpenCliente(true);
    }, {
        enableOnFormTags: true
    }, [setOpenCliente]); // El array de dependencias es opcional pero recomendado

    useHotkeys('ctrl+p', () => {
        setOpenNuevoProducto(true);
    }, {
        enableOnFormTags: true
    }, [setOpenNuevoProducto]); // El array de dependencias es opcional pero recomendado

    useHotkeys('alt+0', () => {

        setMetodoPago(0);
    }, {
        enableOnFormTags: true
    }, [setMetodoPago]); // El array de dependencias es opcional pero recomendado

    useHotkeys('alt+1', () => {

        setMetodoPago(1);
    }, {
        enableOnFormTags: true
    }, [setMetodoPago]); // El array de dependencias es opcional pero recomendado

    useHotkeys('f12', () => {

        setIsOpen(true);
    }, {
        enableOnFormTags: true
    }, [setIsOpen]); // El array de dependencias es opcional pero recomendado


    // --- Accessibility & Keyboard Navigation Logic ---
    const [selectedIndex, setSelectedIndex] = useState(0);
    const prevLengthRef = useRef(0);

    // Auto-select last item when added
    useEffect(() => {
        const currentLength = carritoActual?.productos?.length ?? 0;
        if (currentLength > prevLengthRef.current) {
            setSelectedIndex(currentLength - 1);
        } else if (currentLength < prevLengthRef.current) {
            setSelectedIndex((prev) => Math.min(prev, currentLength - 1));
        }
        prevLengthRef.current = currentLength;
    }, [carritoActual?.productos?.length]);

    // Scroll selected into view
    useEffect(() => {
        const element = document.getElementById(`product-row-${selectedIndex}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [selectedIndex]);

    // Navigation Hotkeys
    useHotkeys('up', (e) => {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(0, prev - 1));
    }, { enableOnFormTags: true });

    useHotkeys('down', (e) => {
        e.preventDefault();
        setSelectedIndex(prev => Math.min((carritoActual?.productos?.length ?? 0) - 1, prev + 1));
    }, { enableOnFormTags: true }, [carritoActual?.productos?.length]);

    // Action Hotkeys
    useHotkeys('right', (e) => {
        e.preventDefault();
        if (!carritoActual?.productos?.length) return;
        const prod = carritoActual.productos[selectedIndex];
        if (prod) incrementQuantity(prod.product.id_unidad_venta);
    }, { enableOnFormTags: true }, [selectedIndex, carritoActual]);

    useHotkeys('left', (e) => {
        e.preventDefault();
        if (!carritoActual?.productos?.length) return;
        const prod = carritoActual.productos[selectedIndex];
        if (prod) decrementQuantity(prod.product.id_unidad_venta);
    }, { enableOnFormTags: true }, [selectedIndex, carritoActual]);

    /*useHotkeys(['Delete', 'Backspace'], (e) => {
        // Evitar conflicto con Backspace al escribir en el input
        if (e.key === 'Backspace' && inputRef.current === document.activeElement && inputRef.current?.value !== '') {
            return;
        }

        e.preventDefault();
        if (!carritoActual?.productos?.length) return;
        const prod = carritoActual.productos[selectedIndex];
        if (prod) removeProduct(prod.product.id_unidad_venta);
    }, { enableOnFormTags: true }, [selectedIndex, carritoActual]);
*/
    useHotkeys('f11', (e) => {
        e.preventDefault();
        if (!carritoActual?.productos?.length) return;
        const prod = carritoActual.productos[selectedIndex];
        if (prod) togglePrecioMayoreo(prod.product.id_unidad_venta);
    }, { enableOnFormTags: true }, [selectedIndex, carritoActual]);
    // ------------------------------------------------


    const focusInput = () => {
        setTimeout(() => {
            inputRef?.current?.focus();
        }, 100);
    };

    const isOnline = useOnlineStatus();

    const buscarProducto = async (e: { preventDefault: () => void; }) => {
        e.preventDefault()
        if (!idProducto) return;

        try {
            // Intentar búsqueda local PRIMERO (es más rápido y funciona offline)
            // @ts-ignore
            const localRes = await window["electron-api"]?.buscarProductoLocal(idProducto);

            if (localRes?.success && localRes.data.length > 0) {
                console.log("Producto encontrado localmente:", localRes.data[0]);
                procesarProductoEncontrado(localRes.data[0]);
                setidProducto('');
                // inputRef.current?.focus(); // El foco lo manejamos según si abre modal o no
                return;
            }

            // Si no está local y hay internet, buscar en API
            if (isOnline) {
                const res = await getProductoVenta(idProducto, user.id_sucursal)
                if (res.success) {
                    procesarProductoEncontrado(res.data[0]);
                    setidProducto('');
                } else {
                    setError(true);
                    setidProducto('');
                    inputRef.current?.focus();
                }
            } else {
                // Si no hay internet and no se encontró localmente
                setError(true);
                setidProducto('');
                inputRef.current?.focus();
            }
        } catch (err) {
            console.error("Error en búsqueda de producto:", err);
            setError(true);
        }
    }

    const syncProducts = async () => {
        if (isOnline && user.id_sucursal) {
            try {
                const res = await getProductos(user.id_sucursal);
                if (res.success) {
                    // @ts-ignore
                    const syncRes = await window["electron-api"]?.sincronizarProductos(res.data);
                    if (syncRes?.success) {
                        console.log(`Catálogo sincronizado: ${syncRes.count} productos.`);
                        toast.success(`Catálogo sincronizado: ${syncRes.count} productos.`);
                    }
                }
            } catch (err) {
                console.error("Error sincronizando catálogo:", err);
                toast.error("Error sincronizando catálogo.");
            }
        }
    };

    // Sincronizar catálogo al entrar si hay internet
    useEffect(() => {
        syncProducts();
    }, [isOnline, user.id_sucursal]);

    // Motor de sincronización de ventas automáticas
    useEffect(() => {
        const updatePendingCount = async () => {
            // @ts-ignore
            const pending = await window["electron-api"]?.obtenerVentasPendientes();
            setPendingCount(pending?.length || 0);
        };

        if (isOnline) {
            const syncPendingSales = async () => {
                // @ts-ignore
                const pendingSales = await window["electron-api"]?.obtenerVentasPendientes();
                if (pendingSales && pendingSales.length > 0) {
                    toast.info(`Sincronizando ${pendingSales.length} ventas pendientes...`);
                    const { nuevaVentaApi } = await import("@/api/ventasApi/ventasApi");

                    for (const s of pendingSales) {
                        try {
                            const res = await nuevaVentaApi(s.venta);
                            if (res?.success) {
                                // @ts-ignore
                                await window["electron-api"]?.eliminarVentaSincronizada(s.id);
                            }
                        } catch (err) {
                            console.error("Error sincronizando venta individual:", err);
                        }
                    }
                    updatePendingCount();
                }
            };
            syncPendingSales();
        } else {
            updatePendingCount();
        }
    }, [isOnline]);

    // LE PASAS EL CALLBACK AL LAYOUT
    useEffect(() => {
        setFocusScanner(() => focusInput);
    }, [setFocusScanner]);

    // Función auxiliar para manejar la lógica de granel vs normal
    const procesarProductoEncontrado = (producto: ProductoVenta) => {

        if (Boolean(producto.es_granel)) {
            setProductoGranelPendiente(producto);
            setOpenGranel(true);
            // NO agregamos todavía, y NO ponemos foco al input principal
            // El foco se irá al input del dialog
        } else {
            addProduct(producto);
            inputRef.current?.focus();
        }
    };

    const handleConfirmGranel = (cantidad: number) => {
        if (productoGranelPendiente) {
            // Para no romper nada:
            addProduct(productoGranelPendiente, cantidad);
        }
    };




    return (
        <div className="pos-container">
            {/* IZQUIERDA: PRODUCTOS */}
            <div className="pos-left-panel">
                <CarritoTabs />

                <form onSubmit={buscarProducto} className="pos-card p-3 flex gap-3 items-center">
                    <div className="relative flex-1">
                        <Scan className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <Input
                            ref={inputRef}
                            placeholder="Escanear producto (F10)..."
                            onChange={(e) => setidProducto(e.target.value)}
                            value={idProducto || ''}
                            className="pl-10 h-12 text-lg font-semibold border-2 border-slate-200 focus:border-primary-500"
                            autoFocus
                        />
                    </div>
                    <Button type="submit" size="lg" className="h-12 px-8 bg-primary hover:bg-primary text-white font-black shadow-md border-0 active:scale-95 transition-all">
                        <Plus className="mr-2 h-5 w-5" /> AGREGAR
                    </Button>
                </form>

                <div className="pos-card product-list-container">
                    <div className="p-3 border-b bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" /> Productos ({carritoActual?.productos?.length ?? 0})
                        </h3>
                        <div className="flex items-center gap-3">
                            {pendingCount > 0 && (
                                <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 uppercase">
                                    {pendingCount} Pendientes
                                </span>
                            )}
                            {!isOnline ? (
                                <span className="text-[10px] font-bold text-red-500 animate-pulse">● OFFLINE</span>
                            ) : (
                                <span className="text-[10px] font-bold text-emerald-500">● ONLINE</span>
                            )}
                            <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500 h-7 text-xs">
                                Vaciar lista
                            </Button>
                        </div>
                    </div>

                    <div className="product-list-scroll">
                        {carritoActual?.productos?.length === 0 ? (
                            <div className="py-20 text-center text-slate-400">
                                <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                <p className="font-medium">Escanea un producto para comenzar</p>
                            </div>
                        ) : (
                            carritoActual?.productos?.map((producto, index) => (
                                <div
                                    key={producto.product.sku_presentacion}
                                    onClick={() => setSelectedIndex(index)}
                                    className={`product-item ${index === selectedIndex ? 'selected' : ''}`}
                                >
                                    <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 border ${index === selectedIndex ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <Pill className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <span className="product-name truncate">{producto.product.nombre_producto}</span>
                                            <span className="product-price tabular-nums">
                                                ${((producto.usarPrecioMayoreo ? producto.product.precio_mayoreo : producto.product.precio_venta) * producto.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <div className="product-details flex items-center gap-2">
                                                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">{producto.product.sku_presentacion}</span>
                                                <span className="text-slate-600 font-bold">${(producto.usarPrecioMayoreo ? producto.product.precio_mayoreo : producto.product.precio_venta).toFixed(2)} c/u</span>
                                                {producto.usarPrecioMayoreo && <span className="bg-black text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm">MAYOREO</span>}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); decrementQuantity(producto.product.id_unidad_venta); }}><Minus className="w-3" /></Button>
                                                <span className="w-8 text-center font-bold text-sm">{producto.quantity}</span>
                                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); incrementQuantity(producto.product.id_unidad_venta); }}><Plus className="w-3" /></Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 ml-2 text-red-400" onClick={(e) => { e.stopPropagation(); removeProduct(producto.product.id_unidad_venta); }}><Trash2 className="w-4" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* DERECHA: COBRO */}
            <div className="pos-right-panel">
                <div className="pos-card p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                            {user?.usuario?.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-700 text-sm">{user?.usuario}</span>
                    </div>
                    <Reloj />
                </div>

                <div className="total-display">
                    <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest mb-1">Total a Pagar</p>
                    <div className="total-amount">
                        <span className="text-2xl opacity-50 mr-1">$</span>
                        {getTotalPrice().toFixed(2)}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant="default"
                        className={`h-20 flex flex-col gap-1 border-2 font-black text-xs transition-all ${metodoPago === 0 ? "border-blue-600 bg-primary text-white ring-2 ring-blue-600/20" : "border-slate-200 text-slate-500  bg-white grayscale opacity-70 hover:opacity-100"}`}
                        onClick={() => setMetodoPago(0)}
                    >
                        <DollarSign className="w-6 h-6" /> EFECTIVO (alt+0)
                    </Button>
                    <Button
                        variant="default"
                        className={`h-20 flex flex-col gap-1 border-2 font-black text-xs transition-all ${metodoPago === 1 ? "border-blue-600 bg-primary text-white ring-2 ring-blue-600/20" : "bg-black grayscale opacity-70 hover:opacity-100 text-white"}`}
                        onClick={() => setMetodoPago(1)}
                    >
                        <CreditCard className="w-6 h-6" /> TARJETA (alt+1)
                    </Button>
                </div>

                <Button
                    onClick={() => setIsOpen(true)}
                    disabled={(carritoActual?.productos?.length ?? 0) === 0}
                    className="h-20 w-full text-2xl font-black bg-primary hover:bg-primary/80 transition-all shadow-xl active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400"
                >
                    COBRAR (F12)
                </Button>

                <div className="flex-1 space-y-2">
                    <Button variant="outline" className="w-full justify-start h-10 font-bold text-slate-600 bg-white" onClick={() => setOpenNuevoProducto(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Producto Temporal
                    </Button>

                    <div className="pos-card p-3 bg-white mt-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Cliente</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-600" onClick={() => setOpenCliente(true)}>
                                <Users className="w-4 h-4" />
                            </Button>
                        </div>
                        <p className="font-bold text-sm text-slate-800 truncate">
                            {cliente.nombreCliente || "Cliente General"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <DialogConfirmVenta isOpen={isOpen} onClose={setIsOpen} metodoPago={metodoPago} inputRef={inputRef} />
            <DialiogErrorProducto isOpen={error} setIsOpen={setError} inputRef={inputRef} />
            <AddCliente isOpen={openCliente} setIsOpen={setOpenCliente} inputRef={inputRef} />
            <DialogNuevoProductoTemp isOpen={openNuevoProducto} setIsOpen={setOpenNuevoProducto} inputRef={inputRef} />
            <DialogSetGranel
                isOpen={openGranel}
                setIsOpen={setOpenGranel}
                producto={productoGranelPendiente}
                onConfirm={handleConfirmGranel}
                inputRefMain={inputRef}
            />
        </div>
    );
}