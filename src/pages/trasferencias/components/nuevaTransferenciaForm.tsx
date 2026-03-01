import { obtenerSucursalesApi } from "@/api/sucursalApi/sucursalApi";
import { nuevaTransferenciaApi, obtenerProductosTransferirApi } from "@/api/transferenciasApi/transferenciasApi";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/contexts/currentUser";
import { useTransferirProductos } from "@/contexts/listaTransferencia";
import type { ProductoVenta } from "@/types/Producto";
import type { Sucursal } from "@/types/Sucursal";
import {
  Minus,
  Plus,
  Send,
  Trash2,
  ArrowRightLeft,
  Store,
  Search,
  Box,
  ClipboardList,
  PackageCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import "../transferencias.css";
import { Button } from "@/components/ui/button";

const transferSchema = z.object({
  origen: z.string().min(1, "La sucursal de origen es obligatoria"),
  destino: z.string().min(1, "La sucursal de destino es obligatoria"),
  motivo: z.string().min(5, "El motivo debe tener al menos 5 caracteres"),
}).refine((data) => data.origen !== data.destino, {
  message: "La sucursal de destino no puede ser la misma que la de origen",
  path: ["destino"],
});

type TransferFormValues = z.infer<typeof transferSchema>;

export default function CrearTransferencia() {
  const { user } = useCurrentUser();
  const [busqueda, setBusqueda] = useState("");
  const [sucursalLista, setSucursalLista] = useState<Sucursal[]>([]);
  const [productosLista, setProductosLista] = useState<ProductoVenta[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      origen: user?.id_sucursal.toString() || "",
      destino: "",
      motivo: "",
    },
  });

  const origen = watch("origen");

  const {
    carrito,
    addProduct,
    incrementQuantity,
    decrementQuantity,
    removeProduct,
    clearCart,
    getTotalItems,
  } = useTransferirProductos();

  useEffect(() => {
    obtenerSucursalesApi()
      .then((res) => {
        if (res.data) setSucursalLista(res.data);
      })
      .catch((err) => console.error("Error al cargar sucursales", err));
  }, []);

  useEffect(() => {
    let mounted = true;
    clearCart();
    setProductosLista([]);

    const fetchProductos = async () => {
      try {
        const res = await obtenerProductosTransferirApi(origen);
        if (mounted && res.success) {
          setProductosLista(res.data);
        }
      } catch (error) {
        console.error("Error al cargar productos:", error);
      }
    };

    if (origen) {
      fetchProductos();
    }
    return () => { mounted = false; };
  }, [origen, clearCart]);

  const productosFiltrados = useMemo(() => {
    const term = busqueda.toLowerCase().trim();
    const filtrados = term
      ? productosLista.filter((p) =>
        (p.nombre_producto?.toLowerCase() || "").includes(term) ||
        (p.sku_pieza?.toLowerCase() || "").includes(term)
      )
      : productosLista;

    // Limit to 100 items for performance and clarity
    return filtrados.slice(0, 100);
  }, [productosLista, busqueda]);

  const onSubmit = async (data: TransferFormValues) => {
    if (carrito.length === 0) {
      toast.error("La bandeja de envío está vacía.");
      return;
    }

    setIsSubmitting(true);
    const timeZone = "America/Mexico_City";
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);
    const fechaFormateada = format(zonedDate, "yyyy-MM-dd HH:mm:ss");

    const payload = {
      id_sucursal_origen: Number(data.origen),
      id_sucursal_destino: Number(data.destino),
      id_usuario_origen: user?.id_usuario,
      id_usuario_autoriza: null,
      id_usuario_recibe: null,
      fecha_creacion: fechaFormateada,
      fecha_recepcion: null,
      fecha_autorizacion: null,
      estado: "pendiente",
      motivo: data.motivo,
      productos: carrito.map((item) => ({
        id_producto: item.product.id_producto,
        cantidad: item.quantity,
        id_unidad_venta: item.product.id_unidad_venta
      })),
    };

    try {
      const res = await nuevaTransferenciaApi(payload);
      if (res.success) {
        toast.success("Transferencia exitosa", {
          description: `Se generó el folio ${res.data} correctamente.`,
        });
        reset({
          origen: user?.id_sucursal.toString() || "",
          destino: "",
          motivo: "",
        });
        clearCart();
      } else {
        toast.error("Error en la transferencia", {
          description: res.message || "No se pudo procesar la solicitud.",
        });
      }
    } catch (error) {
      toast.error("Error de red o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFormError = (errors: any) => {
    if (errors.origen) toast.error("Sucursal de origen requerida.");
    if (errors.destino) toast.error("Sucursal de destino requerida.");
    if (errors.motivo) toast.error("Motivo / Observaciones inválidas", {
      description: errors.motivo.message
    });
  };

  return (
    <div className="w-full h-[calc(100vh-2.5rem)] flex flex-col bg-slate-50 p-2 md:p-3 lg:p-4 gap-4 overflow-hidden">
      {/* HEADER COMPACTO */}
      <Card className="aero-card border-none shadow-sm shrink-0 bg-white/95">
        <CardContent className="p-3">
          <div className="flex flex-row items-center gap-4">
            <div className={`flex-1 flex items-center gap-3 bg-blue-50/50 p-2 rounded-xl border ${errors.origen ? "border-destructive" : "border-blue-100"}`}>
              <Store className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <Label className={`text-[10px] font-black uppercase mb-0.5 block ${errors.origen ? "text-destructive" : "text-blue-600"}`}>
                  Origen {errors.origen && <span className="lowercase font-bold">({errors.origen.message})</span>}
                </Label>
                <Controller
                  name="origen"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={user.id_rol !== 1}>
                      <SelectTrigger className="h-8 font-black text-xs border-none bg-transparent shadow-none p-0 uppercase focus:ring-0">
                        <SelectValue placeholder="Origen..." />
                      </SelectTrigger>
                      <SelectContent className="font-bold">
                        {sucursalLista.map((s) => (
                          <SelectItem key={s.id_sucursal} value={s.id_sucursal.toString()}>{s.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <ArrowRightLeft className="w-5 h-5 text-slate-300 shrink-0" />

            <div className={`flex-1 flex items-center gap-3 bg-indigo-50/50 p-2 rounded-xl border ${errors.destino ? "border-destructive" : "border-indigo-100"}`}>
              <Send className="w-5 h-5 text-indigo-600" />
              <div className="flex-1">
                <Label className={`text-[10px] font-black uppercase mb-0.5 block ${errors.destino ? "text-destructive" : "text-indigo-600"}`}>
                  Destino {errors.destino && <span className="lowercase font-bold">({errors.destino.message})</span>}
                </Label>
                <Controller
                  name="destino"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={!origen}>
                      <SelectTrigger className="h-8 font-black text-xs border-none bg-transparent shadow-none p-0 uppercase focus:ring-0">
                        <SelectValue placeholder="Destino..." />
                      </SelectTrigger>
                      <SelectContent className="font-bold">
                        {sucursalLista.filter(s => s.id_sucursal.toString() !== origen).map((s) => (
                          <SelectItem key={s.id_sucursal} value={s.id_sucursal.toString()}>{s.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="hidden lg:flex flex-col items-end shrink-0">
              <span className="text-[11px] font-black text-slate-900 uppercase">{user?.usuario}</span>
              <Badge className="bg-emerald-600 text-white text-[10px] font-bold uppercase h-6 px-3">Activo</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-row gap-4 min-h-0 overflow-hidden">
        {/* PANEL IZQUIERDO */}
        <Card className="flex-[1.3] aero-card flex flex-col min-h-0 border-none shadow-lg bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-100 shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-[12px] font-black text-slate-900 uppercase flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" /> Selección de Artículos
              </h2>
              <Badge className="bg-slate-950 text-white font-black text-[10px] uppercase h-6">
                {productosFiltrados.length} Visibles
              </Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Escanea SKU o nombre..."
                className="pl-10 h-10 font-bold text-sm bg-slate-50 border-none shadow-inner rounded-xl ring-offset-white focus-visible:ring-1 focus-visible:ring-blue-100"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {!origen ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300 opacity-50">
                  <Store className="w-12 h-12 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Elige Origen</p>
                </div>
              ) : (
                <div className="p-4 pt-0">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white/95 z-20 backdrop-blur-sm">
                      <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="text-[11px] font-black text-slate-400 uppercase h-12">Producto</TableHead>
                        <TableHead className="text-[11px] font-black text-center text-slate-400 uppercase h-12">Stock</TableHead>
                        <TableHead className="w-12 h-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productosFiltrados.map((prod) => {
                        const itemInCart = carrito.find(cl => cl.product.id_unidad_venta === prod.id_unidad_venta);
                        const currentStock = prod.stock_disponible_presentacion - (itemInCart?.quantity || 0);
                        const isOutOfStock = currentStock <= 0;

                        return (
                          <TableRow key={prod.id_unidad_venta} className="group border-slate-50 hover:bg-blue-50/30 transition-colors">
                            <TableCell className="p-3 py-4">
                              <div className="flex flex-col">
                                <span className="text-[13px] font-black text-slate-800 uppercase leading-none truncate max-w-[200px]">
                                  {prod.nombre_producto}
                                </span>
                                <span className="text-[11px] font-bold text-slate-400 uppercase mt-1">
                                  {prod.sku_pieza} • {prod.nombre_presentacion}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center p-3">
                              <div className={`inline-flex flex-col items-center ${isOutOfStock ? "text-red-500 opacity-50" : "text-slate-900"}`}>
                                <span className="text-sm font-black">{currentStock}</span>
                                <span className="text-[9px] font-black uppercase opacity-50">Stock</span>
                              </div>
                            </TableCell>
                            <TableCell className="p-3 text-right">
                              <button
                                disabled={isOutOfStock}
                                onClick={() => addProduct(prod as ProductoVenta)}
                                className={`h-10 w-10 flex items-center justify-center rounded-lg transition-all shadow-sm active:scale-90 ${isOutOfStock ? "bg-slate-50 text-slate-200" : "bg-white text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white"}`}
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </ScrollArea>
          </div>
        </Card>

        {/* PANEL DERECHO */}
        <Card className="flex-1 aero-card flex flex-col min-h-0 border-none shadow-xl bg-slate-900/5 overflow-hidden ring-1 ring-slate-200/50">
          <div className="p-4 border-b border-black/5 shrink-0 flex items-center justify-between bg-white/60 backdrop-blur-md">
            <h2 className="text-[12px] font-black text-slate-950 uppercase flex items-center gap-2">
              <Box className="w-5 h-5 text-indigo-600" /> Artículos a Transferir
            </h2>
            <button onClick={() => clearCart()} className="text-[10px] font-black text-slate-400 hover:text-red-600 uppercase transition-colors px-2 py-1 rounded-md hover:bg-red-50">Vaciar</button>
          </div>

          <div className="flex-1 overflow-hidden px-2 py-3 bg-white/20">
            <ScrollArea className="h-full">
              <div className="space-y-3 px-1">
                {carrito.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20">
                    <ClipboardList className="w-12 h-12 text-slate-400" />
                    <p className="text-[10px] font-black uppercase mt-2">Bandeja Vacía</p>
                  </div>
                ) : (
                  carrito.map((item) => (
                    <div key={item.product.id_unidad_venta} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[12px] font-black text-slate-900 truncate uppercase">{item.product.nombre_producto}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{item.product.sku_pieza} • {item.product.nombre_presentacion}</p>
                        </div>
                        <button onClick={() => removeProduct(item.product.id_unidad_venta)} className="text-slate-200 hover:text-red-500 transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                          <button onClick={() => decrementQuantity(item.product.id_unidad_venta)} className="w-7 h-7 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-md transition-all">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-9 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                          <button disabled={item.quantity >= item.product.stock_disponible_presentacion} onClick={() => incrementQuantity(item.product.id_unidad_venta)} className="w-7 h-7 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-md transition-all disabled:opacity-20">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-right flex items-center gap-1.5">
                          <span className="text-sm font-black text-indigo-600 font-mono">{(item.quantity * (item.product.factor_conversion_cantidad || 1)).toLocaleString()}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase">Pzas</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <CardContent className="p-4 bg-white border-t border-slate-100 shrink-0 space-y-4 shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.1)] z-50">
            <div className="space-y-1.5 translate-x-0">
              <Label className={`text-[11px] font-black uppercase ml-1 block ${errors.motivo ? "text-destructive" : "text-slate-400"}`}>
                Motivo / Observaciones * {errors.motivo && <span className="lowercase font-bold text-destructive">({errors.motivo.message})</span>}
              </Label>
              <Controller
                name="motivo"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Escribe el motivo aquí..."
                    className={`h-11 font-bold text-sm bg-slate-50 border-none rounded-xl shadow-inner focus:ring-1 focus:ring-blue-200 transition-all ${errors.motivo ? "ring-1 ring-destructive" : ""}`}
                  />
                )}
              />
            </div>

            <Button
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmit, onFormError)}
              className={`w-full h-14 !bg-primary !text-white hover:opacity-90 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-[0.98] ${isSubmitting ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
            >
              {isSubmitting ? (
                <div className="w-7 h-7 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <PackageCheck className="w-6 h-6 !text-white" />
                  <span className="!text-white">CREAR TRANSFERENCIA</span>
                  <Badge className="bg-white/20 text-[12px] !text-white border-none px-3 h-7 ml-auto">
                    {getTotalItems()} ITEMS
                  </Badge>
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
