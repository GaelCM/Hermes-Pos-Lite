import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import { useListaProductos } from "@/contexts/listaProductos";
import { ArrowRightLeft, CreditCard, Minus, Pill, Plus, RefreshCw, Scan, ShoppingCart, Trash2, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Reloj } from "./components/reloj";
import DialogConfirmVenta from "./components/dialogConfirmVenta";
import AddCliente from "@/components/dialogAddCliente";
import { getProductoVenta } from "@/api/productosApi/productosApi";
import DialiogErrorProducto from "./Dialogs/noEncontrado";
import { useOutletContext, useNavigate } from "react-router";
import CarritoTabs from "@/components/carritoTabs";
import { useCurrentUser } from "@/contexts/currentUser";
import { useOnlineStatus } from "@/hooks/isOnline";
import { getProductos } from "@/api/productosApi/productosApi";
import { toast } from "sonner";
import DialogNuevoProductoTemp from "./components/dialogNuevoProductoTemp";
import DialogSetGranel from "./components/dialogSetGranel";
import type { ProductoVenta } from "@/types/Producto";
import { redondearPrecio } from "@/lib/utils";
import { usePendingTransfers } from "@/hooks/usePendingTransfers";
import "./caja.css";


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
    const pendingTransfers = usePendingTransfers();

    // Estados para Granel
    const [openGranel, setOpenGranel] = useState(false);
    const [productoGranelPendiente, setProductoGranelPendiente] = useState<ProductoVenta | null>(null);

    const { clearCart, removeProduct, decrementQuantity, incrementQuantity, getTotalPrice, addProduct, getCarritoActivo, crearCarrito, carritoActivo, togglePrecioMayoreo, asignarClienteCarrito, desasignarClienteCarrito } = useListaProductos();
    const { setFocusScanner } = useOutletContext<{ setFocusScanner: (fn: () => void) => void }>();
    const navigate = useNavigate();

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
    }, [setOpenCliente]);

    useHotkeys('ctrl+p', () => {
        setOpenNuevoProducto(true);
    }, {
        enableOnFormTags: true
    }, [setOpenNuevoProducto]);

    useHotkeys('alt+0', () => {
        setMetodoPago(0);
    }, {
        enableOnFormTags: true
    }, [setMetodoPago]);

    useHotkeys('alt+1', () => {
        setMetodoPago(1);
    }, {
        enableOnFormTags: true
    }, [setMetodoPago]);

    useHotkeys('alt+2', () => {
        setMetodoPago(2);
    }, {
        enableOnFormTags: true
    }, [setMetodoPago]);

    useHotkeys('f12', () => {
        setIsOpen(true);
    }, {
        enableOnFormTags: true
    }, [setIsOpen]);


    // --- Accessibility & Keyboard Navigation Logic ---
    const [selectedIndex, setSelectedIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const prevLengthRef = useRef(0);

    // Auto-select and scroll when added
    useEffect(() => {
        const currentLength = carritoActual?.productos?.length ?? 0;
        if (currentLength > prevLengthRef.current) {
            setSelectedIndex(currentLength - 1);
            // Scroll to bottom immediately
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTo({
                        top: scrollRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }, 50);
        } else if (currentLength < prevLengthRef.current) {
            setSelectedIndex((prev) => Math.min(prev, currentLength - 1));
        }
        prevLengthRef.current = currentLength;
    }, [carritoActual?.productos?.length]);

    // Scroll selected into view (for keyboard navigation)
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
    useHotkeys('+, right', (e) => {
        if (idProducto) return;
        e.preventDefault();
        if (!carritoActual?.productos?.length) return;
        const prod = carritoActual.productos[selectedIndex];
        if (prod) incrementQuantity(prod.product.id_unidad_venta);
    }, { enableOnFormTags: true }, [selectedIndex, carritoActual, idProducto]);

    useHotkeys('-, left', (e) => {
        if (idProducto) return;
        e.preventDefault();
        if (!carritoActual?.productos?.length) return;
        const prod = carritoActual.productos[selectedIndex];
        if (prod) decrementQuantity(prod.product.id_unidad_venta);
    }, { enableOnFormTags: true }, [selectedIndex, carritoActual, idProducto]);

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
            // Intentar búsqueda local PRIMERO
            // @ts-ignore
            const localRes = await window["electron-api"]?.buscarProductoLocal(idProducto);

            if (localRes?.success && localRes.data.length > 0) {
                procesarProductoEncontrado(localRes.data[0]);
                setidProducto('');
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
                        toast.success(`Catálogo sincronizado: ${syncRes.count} productos.`);
                    }
                }
            } catch (err) {
                console.error("Error sincronizando catálogo:", err);
                toast.error("Error sincronizando catálogo.");
            }
        }
    };

    useEffect(() => {
        syncProducts();
    }, [isOnline, user.id_sucursal]);

    useEffect(() => {
        const updatePendingCount = async () => {
            // @ts-ignore
            const pending = await window["electron-api"]?.obtenerVentasPendientes();
            setPendingCount(pending?.length || 0);
        };

        let interval: any = null;

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

            // Sincronizar al detectar internet o al montar
            syncPendingSales();

            // Sincronizar periódicamente cada 30 segundos si hay internet
            interval = setInterval(() => {
                syncPendingSales();
            }, 30000);

        } else {
            updatePendingCount();
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isOnline]);

    useEffect(() => {
        setFocusScanner(() => focusInput);
    }, [setFocusScanner]);

    const procesarProductoEncontrado = (producto: ProductoVenta) => {
        if (Boolean(producto.es_granel)) {
            setProductoGranelPendiente(producto);
            setOpenGranel(true);
        } else {
            addProduct(producto);
            inputRef.current?.focus();
        }
    };

    const handleConfirmGranel = (cantidad: number) => {
        if (productoGranelPendiente) {
            addProduct(productoGranelPendiente, cantidad);
        }
    };

    return (
        <div className="caja-container">
            {/* Lado izquierdo (Col 1) */}
            <div className="caja-left-column">
                {/* Tabs de Carritos */}
                <CarritoTabs />

                {/* Scanner Section */}
                <div className="aero-card scanner-card">
                    <div className="scanner-header">
                        <div className="flex items-center gap-2">
                            <span className="ticket-badge">Ticket Activo</span>
                            <span className="ticket-info">
                                {carritoActual?.cliente?.nombre_cliente || carritoActual?.nombre || "Sin Nombre"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                            <ShoppingCart className="w-3 h-3" />
                            {carritoActual?.productos?.length ?? 0} PRODUCTOS
                        </div>
                    </div>

                    <div className="scanner-form-container">
                        <div className="scanner-header-title">
                            <div className="flex items-center gap-1.5 font-black text-xs text-muted-foreground uppercase">
                                <Scan className="w-3 h-3 text-primary" />
                                Scanner
                            </div>
                            <div className="flex items-center gap-2">
                                {pendingCount > 0 && (
                                    <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full animate-pulse font-bold">
                                        {pendingCount} Pendientes
                                    </span>
                                )}
                                {!isOnline ? (
                                    <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                        <div className="w-1 h-1 bg-red-600 rounded-full"></div>
                                        OFFLINE
                                    </span>
                                ) : (
                                    <span className="text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                        <div className="w-1 h-1 bg-green-600 rounded-full animate-pulse"></div>
                                        ONLINE
                                    </span>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-[10px] gap-1 px-2"
                                    onClick={() => syncProducts()}
                                    title="Actualizar productos (API)"
                                >
                                    actualizar
                                    <RefreshCw className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                        <form className="scanner-input-group" onSubmit={buscarProducto}>
                            <div className="scanner-input-wrapper">
                                <Scan className="scanner-icon" />
                                <Input
                                    ref={inputRef}
                                    placeholder="Escanear producto..."
                                    onChange={(e) => setidProducto(e.target.value)}
                                    value={idProducto || ''}
                                    className="aero-input"
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" size="sm" className="aero-button-primary">
                                <Plus className="w-4 h-4 mr-1.5" />
                                Agregar
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Products List Section */}
                <div className="aero-card products-list-card">
                    <div className="products-list-header">
                        <div className="flex items-center justify-between w-full">
                            <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <ShoppingCart className="w-4 h-4 text-primary" />
                                Productos ({carritoActual?.productos?.length ?? 0})
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => {
                                    clearCart();
                                    inputRef.current?.focus();
                                }}
                                disabled={(carritoActual?.productos?.length ?? 0) === 0}
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                Limpiar
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div
                            ref={scrollRef}
                            className="scroll-area"
                        >
                            {(carritoActual?.productos?.length ?? 0) === 0 ? (
                                <div className="text-center py-20 text-muted-foreground bg-slate-50/30">
                                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm font-medium">No hay Productos en el carrito</p>
                                    <p className="text-xs opacity-60">Escanea un código de barras para comenzar</p>
                                </div>
                            ) : (
                                carritoActual?.productos?.map((producto, index) => (
                                    <div
                                        key={producto.product.sku_presentacion}
                                        id={`product-row-${index}`}
                                        className={`product-item ${producto.usarPrecioMayoreo ? 'mayoreo' : ''} ${index === selectedIndex ? 'selected' : ''}`}
                                        onClick={() => setSelectedIndex(index)}
                                    >
                                        <div className="product-main-row">
                                            <div className="product-name-section">
                                                <span className="product-icon-box">
                                                    <Pill className="w-3.5 h-3.5 text-primary" />
                                                </span>
                                                <p className="product-name">{producto.product.nombre_producto} {producto.product.nombre_presentacion}</p>
                                                <span className={`product-stock-badge ${producto.product.stock_disponible_presentacion == 0 ? 'stock-low' : producto.product.stock_disponible_presentacion <= 5 ? 'stock-mid' : 'stock-ok'}`}>
                                                    {producto.product.stock_disponible_presentacion} STOCK
                                                </span>
                                            </div>
                                            <div className="product-price-total">
                                                ${((producto.usarPrecioMayoreo ? producto.product.precio_mayoreo : producto.product.precio_venta) * producto.quantity).toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="product-controls-row">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-[10px] font-bold text-muted-foreground mr-1">
                                                    ${(producto.usarPrecioMayoreo ? producto.product.precio_mayoreo : producto.product.precio_venta).toFixed(2)} p/u
                                                </p>
                                                <div className="quantity-controls">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            decrementQuantity(producto.product.id_unidad_venta);
                                                        }}
                                                        className="qty-btn"
                                                    >
                                                        <Minus className="w-2.5 h-2.5" />
                                                    </button>
                                                    <span className="qty-value">{producto.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            incrementQuantity(producto.product.id_unidad_venta);
                                                        }}
                                                        className="qty-btn"
                                                    >
                                                        <Plus className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className={`mayoreo-toggle-container ${producto.usarPrecioMayoreo ? 'active' : ''}`}>
                                                    <span className="mayoreo-toggle-label">Mayoreo</span>
                                                    <Switch
                                                        className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 switch-mayoreo"
                                                        checked={producto.usarPrecioMayoreo || false}
                                                        onCheckedChange={() => togglePrecioMayoreo(producto.product.id_unidad_venta)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeProduct(producto.product.id_unidad_venta)
                                                        inputRef.current?.focus();
                                                    }}
                                                    className="w-7 h-7 p-0 text-slate-300 hover:text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Lado derecho (Col 2) */}
            <div className="caja-right-column">
                {/* Datos de la venta */}
                <div className="xl:sticky xl:top-6 space-y-3">
                    {pendingTransfers > 0 && (
                        <Button
                            className="w-full h-9 btn-transfer-alert uppercase font-black cursor-pointer"
                            onClick={() => navigate("/transferencias")}
                        >
                            <ArrowRightLeft className="w-4 h-4 mr-2" />
                            {pendingTransfers} Transferencia{pendingTransfers > 1 ? 's' : ''} pendiente{pendingTransfers > 1 ? 's' : ''}

                            {/* Punto rojo animado en el vértice */}
                            <div className="dot-pulse-alert" />
                            <div className="dot-transfer-alert" />
                        </Button>
                    )}
                    <div className="aero-card">
                        <div className="px-4 py-3 border-b border-primary/10">
                            <div className="flex items-center gap-2 text-primary font-bold">
                                <Users className="w-4 h-4" />
                                Información del Cliente
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="customer-card-content">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="customer-label">Nombre</p>
                                        <p className="customer-name">{carritoActual?.cliente?.nombre_cliente || "Cliente General"}</p>
                                        <p className="text-xs text-muted-foreground mt-1">ID: {carritoActual?.cliente?.id_cliente || "N/A"}</p>
                                    </div>
                                    {carritoActual?.cliente && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-destructive"
                                            onClick={() => carritoActual && desasignarClienteCarrito(carritoActual.id)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full" onClick={() => setOpenCliente(true)}>
                                <Users className="w-4 h-4 mr-2" />
                                {carritoActual?.cliente ? "Cambiar Cliente" : "Asignar Cliente"} (alt+m)
                            </Button>
                            <Button variant="outline" size="sm" className="w-full" onClick={() => setOpenNuevoProducto(true)}>
                                Nuevo producto temporal (ctrl+p)
                            </Button>
                        </div>
                    </div>

                    <div className="aero-card total-card">
                        <div className="total-display">
                            <p className="total-label">Total a Pagar</p>
                            <div className="total-amount">
                                ${redondearPrecio(getTotalPrice()).toFixed(2)}
                            </div>
                            <Separator className="my-4" />
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal:</span>
                                    <span>${getTotalPrice().toFixed(2)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold">
                                    <span>Total:</span>
                                    <span>${redondearPrecio(getTotalPrice()).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="payment-methods-grid">
                            <button
                                type="button"
                                className={`pay-btn ${metodoPago === 0 ? "active" : "inactive"}`}
                                disabled={(carritoActual?.productos?.length ?? 0) === 0}
                                onClick={() => setMetodoPago(0)}
                            >
                                Efectivo(alt+0)
                            </button>
                            <button
                                type="button"
                                className={`pay-btn ${metodoPago === 1 ? "active" : "inactive"}`}
                                disabled={(carritoActual?.productos?.length ?? 0) === 0}
                                onClick={() => setMetodoPago(1)}
                            >
                                Tarjeta (alt+1)
                            </button>
                            <button
                                type="button"
                                className={`pay-btn ${metodoPago === 2 ? "active" : "inactive"}`}
                                disabled={(carritoActual?.productos?.length ?? 0) === 0}
                                onClick={() => setMetodoPago(2)}
                            >
                                Crédito(alt+2)
                            </button>
                        </div>

                        <button
                            type="button"
                            className="process-payment-btn"
                            disabled={(carritoActual?.productos?.length ?? 0) === 0}
                            onClick={() => setIsOpen(true)}>
                            <CreditCard className="w-5 h-5 mr-2 inline" />
                            Procesar Pago (F12)
                        </button>

                        <Button
                            variant="destructive"
                            className="w-full h-12"
                            onClick={() => clearCart()}
                            disabled={(carritoActual?.productos?.length ?? 0) === 0}
                        >
                            Cancelar Venta (ESC)
                        </Button>
                    </div>

                    <Reloj />
                </div>
            </div>

            {/* Dialogs */}
            <DialogConfirmVenta isOpen={isOpen} onClose={setIsOpen} metodoPago={metodoPago} inputRef={inputRef} setMetodoPago={setMetodoPago} />
            <DialiogErrorProducto isOpen={error} setIsOpen={setError} inputRef={inputRef} />
            <AddCliente
                isOpen={openCliente}
                setIsOpen={setOpenCliente}
                inputRef={inputRef}
                onSelect={(selectedCliente) => {
                    if (carritoActivo) {
                        asignarClienteCarrito(carritoActivo, selectedCliente);
                    }
                }}
            />
            <DialogNuevoProductoTemp isOpen={openNuevoProducto} setIsOpen={setOpenNuevoProducto} inputRef={inputRef} />
            <DialogSetGranel
                isOpen={openGranel}
                setIsOpen={setOpenGranel}
                producto={productoGranelPendiente}
                onConfirm={handleConfirmGranel}
                inputRefMain={inputRef}
            />
        </div>
    )
}
