import { obtenerSucursalesApi } from "@/api/sucursalApi/sucursalApi";
import { nuevaTransferenciaApi, obtenerProductosTransferirApi } from "@/api/transferenciasApi/transferenciasApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/contexts/currentUser";
import { useTransferirProductos } from "@/contexts/listaTransferencia";
import type { ProductoVenta } from "@/types/Producto";
import type { Sucursal } from "@/types/Sucursal";
import { ChevronLeft, ChevronRight, Minus, PackageOpen, Plus, Search, Send, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { toast } from "sonner";


import "../transferencias.css";


export default function CrearTransferencia() {
  // --- ESTADO ---
  const { user } = useCurrentUser();
  const [origen, setOrigen] = useState<string>(user?.id_sucursal.toString() || "");
  const [destino, setDestino] = useState<string>("");
  const [motivo, setMotivo] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [sucursalLista, setSucursalLista] = useState<Sucursal[]>([]);
  const [productosLista, setProductosLista] = useState<ProductoVenta[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;


  // --- ZUSTAND STORE ---
  const {
    carrito,
    addProduct,
    incrementQuantity,
    decrementQuantity,
    removeProduct,
    clearCart,
    getTotalItems,
  } = useTransferirProductos();

  // --- EFECTOS ---

  // --- EFECTO 1: Carga Inicial de Sucursales ---
  useEffect(() => {
    let mounted = true;
    obtenerSucursalesApi()
      .then((res) => {
        if (mounted && res.data) setSucursalLista(res.data);
      })
      .catch((err) => console.error("Error sucursales", err));
    return () => { mounted = false; };
  }, []);

  // --- EFECTO 2: Cargar Productos al cambiar Origen ---
  useEffect(() => {

    let mounted = true;
    setProductosLista([]);
    clearCart();


    const fetchProductos = async () => {
      try {
        const res = await obtenerProductosTransferirApi(origen); // Asegurar que sea número si la API lo espera  
        // Solo actualizamos el estado si el componente sigue montado y el origen no ha cambiado de nuevo
        if (mounted) {
          if (res.success) {
            setProductosLista(res.data);
          } else {
            setProductosLista([]);
          }
        }
      } catch (error) {
        console.error("Error obteniendo productos:", error);
        if (mounted) setProductosLista([]);
      }
    };

    fetchProductos();

    // Cleanup function para evitar race conditions
    return () => {
      mounted = false;
    };
  }, [origen, clearCart]); // Añadimos clearCart a dependencias (es estable en Zustand, pero es buena práctica)


  // --- MEMOIZACIÓN: Filtrado eficiente ---
  const productosFiltrados = useMemo(() => {
    const term = busqueda.toLowerCase();
    return productosLista.filter((p) =>
      p.nombre_producto.toLowerCase().includes(term) ||
      p.sku_pieza.toLowerCase().includes(term)
    );
  }, [productosLista, busqueda]);

  // --- PAGINACIÓN ---
  const totalPaginas = Math.ceil(productosFiltrados.length / itemsPorPagina);
  const productosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    return productosFiltrados.slice(inicio, inicio + itemsPorPagina);
  }, [productosFiltrados, paginaActual]);

  // Resetear página al buscar o cambiar origen
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, origen]);



  // --- HANDLERS ---
  const transferirProductos = async (e: React.MouseEvent<HTMLButtonElement>) => {

    const timeZone = "America/Mexico_City";
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);
    const fechaFormateada = format(zonedDate, "yyyy-MM-dd HH:mm:ss");
    e.preventDefault();
    if (!origen || !destino || carrito.length === 0) {
      toast.error("Error al crear la transferencia. Intenta nuevamente.", {
        description: "Faltan datos por llenar",
      });
      return;
    }

    // Payload final basado en tu imagen de base de datos
    const nuevaTransferencia = {
      id_sucursal_origen: Number(origen),
      id_sucursal_destino: Number(destino),
      id_usuario_origen: user?.id_usuario,
      id_usuario_autoriza: null,
      id_usuario_recibe: null,
      fecha_creacion: fechaFormateada,
      fecha_recepcion: null,
      fecha_autorizacion: null,
      estado: "pendiente", // Default según DB
      motivo: motivo,
      productos: carrito.map((item) => ({
        id_producto: item.product.id_producto,
        cantidad: item.quantity,
        id_unidad_venta: item.product.id_unidad_venta
      })),
    };

    const res = await nuevaTransferenciaApi(nuevaTransferencia);
    if (res.success) {
      toast.success('Transferencia generada correctamente', {
        description: `La transferencia se ha generado correctamente, FOLIO ${res.data}`,
      });
      setMotivo("");
      clearCart();
      setDestino("");
    } else {
      toast.error("Error al crear la transferencia. Intenta nuevamente.", {
        description: res.message || "Error desconocido.",
      });
    }



  };

  return (
    <div className="new-transfer-container">

      {/* ---------------- IZQUIERDA: SELECCIÓN Y TABLA ---------------- */}
      <div className="transfer-panel transfer-left">
        <div className="t-panel-header">
          <div className="t-panel-title">
            <PackageOpen className="w-5 h-5 text-primary" />
            Nueva Transferencia
          </div>
          <p className="t-panel-desc">
            Selecciona el origen y destino para ver los productos disponibles.
          </p>
        </div>

        <div className="t-panel-content">
          {/* Selectores de Sucursal */}
          <div className="form-grid">
            <div className="space-y-2">
              <Label>Sucursal Origen</Label>
              <Select value={origen} onValueChange={setOrigen} disabled={user.id_rol != 1} >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar origen..." />
                </SelectTrigger>
                <SelectContent>
                  {sucursalLista.map((s) => (
                    <SelectItem key={s.id_sucursal} value={s.id_sucursal.toString()}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sucursal Destino</Label>
              <Select
                value={destino}
                onValueChange={setDestino}
                disabled={!origen}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar destino..." />
                </SelectTrigger>
                <SelectContent>
                  {sucursalLista
                    .filter((s) => s.id_sucursal.toString() !== origen)
                    .map((s) => (
                      <SelectItem key={s.id_sucursal} value={s.id_sucursal.toString()}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Buscador */}
          <div className="search-container">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o SKU..."
              className="search-input"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              disabled={!origen}
            />
          </div>

          {/* Tabla de Productos */}
          <div className="products-table-wrapper">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Presentación</th>
                  <th className="text-center">Stock Disp.</th>
                  <th className="text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {!origen ? (
                  <tr>
                    <td colSpan={4} className="h-24 text-center text-muted-foreground p-4">
                      Selecciona una sucursal de origen para comenzar.
                    </td>
                  </tr>
                ) : productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="h-24 text-center text-muted-foreground p-4">
                      No se encontraron productos.
                    </td>
                  </tr>
                ) : (
                  productosPaginados.map((prod) => {
                    // Calcular stock restante en tiempo real restando lo que ya está en el carrito
                    const itemEnCarrito = carrito.find(item => item.product.id_producto === prod.id_producto);
                    const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.quantity : 0;
                    const stockReal = prod.stock_disponible_presentacion - cantidadEnCarrito;
                    const sinStock = stockReal <= 0;

                    return (
                      <tr key={prod.id_producto}>
                        <td className="font-medium">
                          <div>{prod.nombre_producto}</div>
                          <div className="text-xs text-muted-foreground">{prod.sku_pieza}</div>
                        </td>
                        <td>{prod.nombre_presentacion}</td>
                        <td className="text-center">
                          <Badge variant={sinStock ? "destructive" : "default"} className={sinStock ? "" : "bg-slate-200 text-slate-800 hover:bg-slate-300"}>
                            {stockReal}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <Button
                            size="sm"
                            variant={sinStock ? "ghost" : "default"}
                            disabled={sinStock}
                            onClick={() => addProduct(prod as ProductoVenta)} // Cast si TS se queja por campos extra
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between py-2 border-t mt-2">
              <span className="text-sm text-muted-foreground">
                Página {paginaActual} de {totalPaginas}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                  disabled={paginaActual === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- DERECHA: RESUMEN / CARRITO ---------------- */}
      <div className="transfer-panel transfer-right">
        <div className="t-panel-header">
          <div className="t-panel-title flex justify-between w-full">
            <span>Resumen de Envío</span>
            <span className="text-sm font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {getTotalItems()} Items
            </span>
          </div>
        </div>

        <div className="t-panel-content">
          <ScrollArea className="h-full pr-4">
            {carrito.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground space-y-2">
                <PackageOpen className="h-10 w-10 opacity-20" />
                <p className="text-sm">El carrito de transferencia está vacío.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {carrito.map((item) => (
                  <div key={item.product.id_producto} className="cart-item">
                    {/* Header Item */}
                    <div className="cart-item-header">
                      <div>
                        <p className="font-semibold text-sm line-clamp-1">{item.product.nombre_producto}</p>
                        <p className="text-xs text-muted-foreground">{item.product.nombre_presentacion}</p>
                      </div>
                      <button
                        className="text-destructive hover:text-destructive/80 p-1"
                        onClick={() => removeProduct(item.product.id_producto)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Controles Cantidad */}
                    <div className="cart-controls">
                      <span className="text-muted-foreground text-xs ml-1">
                        Disp: {item.product.stock_disponible_presentacion}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost" size="sm" className="h-6 w-6 p-0"
                          onClick={() => decrementQuantity(item.product.id_producto)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                        <Button
                          variant="ghost" size="sm" className="h-6 w-6 p-0"
                          disabled={item.quantity >= item.product.stock_disponible_presentacion}
                          onClick={() => incrementQuantity(item.product.id_producto)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="p-4 border-t bg-slate-50 flex flex-col gap-4">
          <div className="w-full space-y-2">
            <Label htmlFor="motivo">Motivo de la transferencia *</Label>
            <Textarea
              id="motivo"
              placeholder="Ej. Reabastecimiento semanal..."
              className="resize-none bg-white"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          <Button
            className="w-full gap-2"
            size="lg"
            onClick={transferirProductos}
            disabled={carrito.length === 0 || !motivo || !origen || !destino}
          >
            <Send className="h-4 w-4" />
            Crear Transferencia
          </Button>
        </div>
      </div>

    </div>
  );
}