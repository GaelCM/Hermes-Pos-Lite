
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Trash2, Plus, Minus, Package, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { useCurrentUser } from "@/contexts/currentUser";
import { useListaCompras } from "@/contexts/listaCompras";
import { obtenerProveedoresApi } from "@/api/proveedoresApi/proveedoresApi";
import type { Proveedor } from "@/types/Proveedor";
import { ProductTable } from "@/components/productTable";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NuevaCompra } from "@/types/ComprasT";
import { crearCompra } from "@/api/egresosApi/compras";
import "../egresos.css";

export default function NuevaCompraForm() {
    const navigate = useNavigate();
    const { user } = useCurrentUser();
    const {
        getCarritoActivo,
        addProduct,
        removeProduct,
        incrementQuantity,
        decrementQuantity,
        updatePrice,
        getTotalCost,
        crearCarrito, clearCart
    } = useListaCompras();

    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [idProveedor, setIdProveedor] = useState<string>("");
    const [folio, setFolio] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [metodoPago, setMetodoPago] = useState("0");
    const [montoTotalManual, setMontoTotalManual] = useState<string>("0");

    const carrito = getCarritoActivo();
    const userRef = localStorage.getItem("openCaja");
    const openCaja = userRef ? JSON.parse(userRef) : null;

    useEffect(() => {
        if (!carrito) {
            crearCarrito("Nueva Compra");
        }
    }, [carrito, crearCarrito]);

    useEffect(() => {
        if (carrito) {
            const sum = getTotalCost();
            setMontoTotalManual(sum.toFixed(2));
        }
    }, [carrito?.productos?.length, carrito?.productos]);

    useEffect(() => {
        obtenerProveedoresApi().then((res) => {
            if (res.success) {
                setProveedores(res.data);
            }
        });
    }, []);

    const handleConfirmarCompra = async () => {
        if (!carrito || carrito.productos.length === 0) {
            toast.error("El carrito está vacío");
            return;
        }
        if (!idProveedor) {
            toast.error("Seleccione un proveedor");
            return;
        }

        const payload: NuevaCompra = {
            id_sucursal: user.id_sucursal,
            id_usuario: user.id_usuario,
            id_turno: openCaja.id_turno,
            id_proveedor: parseInt(idProveedor),
            monto: parseFloat(montoTotalManual),
            metodo_pago: parseInt(metodoPago),
            folio,
            descripcion,
            items: carrito.productos.map(item => ({
                id_producto: item.product.id_producto,
                id_unidad_venta: item.product.id_unidad_venta,
                cantidad: item.quantity,
                precio_unitario: item.precio_compra ?? item.product.precio_costo
            }))
        };

        const res = await crearCompra(payload)
        if (res.success) {
            clearCart();
            toast.success(res.message);
            navigate("/egresos");
        } else {
            toast.error(res.message);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            {/* Header Limpio */}
            <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-4 text-black">
                    <Button variant="default" size="icon" onClick={() => navigate("/egresos")} className="h-9 w-9 text-slate-400 hover:text-black hover:bg-slate-800">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Button>
                    <h1 className="text-sm font-black uppercase tracking-widest text-slate-800">Nueva Compra</h1>
                </div>
            </header>

            <div className="new-purchase-container">
                {/* 2/3 - Catálogo (Buscador) */}
                <div className="purchase-panel purchase-left">
                    <div className="p-panel-content h-full">
                        <ProductTable
                            idSucursal={user.id_sucursal}
                            searchLocal={true}
                            onAddProduct={addProduct}
                            allowOutOfStock={true}
                        />
                    </div>
                </div>

                {/* 1/3 - Carrito y Datos (Lateral Estrecho) */}
                <div className="purchase-panel purchase-right">
                    {/* Header de la lista */}
                    <div className="p-panel-header">
                        <div className="p-panel-title flex justify-between w-full">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4 text-primary" />
                                <span>Orden de Compra</span>
                            </div>
                            <span className="info-badge">
                                ${getTotalCost().toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Lista de productos */}
                    <div className="p-panel-content">
                        <ScrollArea className="h-full pr-4">
                            {!carrito || carrito.productos.length === 0 ? (
                                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground">
                                    <Package className="w-10 h-10 mb-2 opacity-20" />
                                    <p className="text-sm font-medium opacity-60">Carrito Vacío</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {carrito.productos.map((item) => (
                                        <div key={item.product.id_unidad_venta} className="cart-item">
                                            {/* Header Item */}
                                            <div className="cart-item-header">
                                                <div>
                                                    <h4 className="font-semibold text-sm line-clamp-2">
                                                        {item.product.nombre_producto}
                                                    </h4>
                                                    <span className="text-xs text-muted-foreground">{item.product.sku_presentacion}</span>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive/80" onClick={() => removeProduct(item.product.id_unidad_venta)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            {/* Controles Cantidad y Precio */}
                                            <div className="flex items-center justify-between gap-2 mt-2">
                                                <div className="cart-controls">
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => decrementQuantity(item.product.id_unidad_venta)}>
                                                            <Minus className="w-3 h-3" />
                                                        </Button>
                                                        <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => incrementQuantity(item.product.id_unidad_venta)}>
                                                            <Plus className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center relative w-20">
                                                        <span className="text-xs text-muted-foreground mr-1">$</span>
                                                        <input
                                                            type="number"
                                                            value={item.precio_compra ?? item.product.precio_costo}
                                                            onChange={(e) => updatePrice(item.product.id_unidad_venta, parseFloat(e.target.value) || 0)}
                                                            className="h-6 w-full p-0 font-medium text-sm text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary focus:ring-0 outline-none transition-colors"
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold tabular-nums">
                                                        ${((item.precio_compra ?? item.product.precio_costo) * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Datos del Egreso y Total Final */}
                    <div className="purchase-form-footer">
                        {/* Panel de Datos */}
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-muted-foreground uppercase">Proveedor</Label>
                                <Select value={idProveedor} onValueChange={setIdProveedor}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {proveedores.map(p => (
                                            <SelectItem key={p.id_proveedor} value={p.id_proveedor.toString()}>
                                                {p.nombre_proveedor}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">Folio</Label>
                                    <Input
                                        placeholder="TKT-000"
                                        className="h-9"
                                        value={folio}
                                        onChange={(e) => setFolio(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">Pago</Label>
                                    <Select value={metodoPago} onValueChange={setMetodoPago}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">Efectivo</SelectItem>
                                            <SelectItem value="1">Tarjeta</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-muted-foreground uppercase">Nota</Label>
                                <Input
                                    placeholder="Comentarios..."
                                    className="h-8 text-xs"
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Panel de Monto Final */}
                        <div className="bg-primary/5 p-4 rounded-lg flex flex-col gap-3 border border-primary/10">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-bold uppercase text-primary">Total Final</Label>
                                <div className="flex items-center gap-1">
                                    <span className="text-lg text-primary font-bold">$</span>
                                    <input
                                        type="number"
                                        className="bg-transparent border-none text-2xl font-bold text-primary w-24 text-right focus:ring-0 p-0 outline-none tabular-nums"
                                        value={montoTotalManual}
                                        onChange={(e) => setMontoTotalManual(e.target.value)}
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleConfirmarCompra}
                                className="w-full font-bold shadow-md"
                                size="lg"
                            >
                                Confirmar Compra
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
