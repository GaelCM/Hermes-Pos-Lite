/* eslint-disable @typescript-eslint/no-explicit-any */
import { obtenerCategoriasApi } from "@/api/categoriasApi/categoriasApi";
import { actualizarProductoApi, obtenerProductoGeneral } from "@/api/productosApi/productosApi";
import { obtenerSucursalesApi } from "@/api/sucursalApi/sucursalApi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/contexts/currentUser";
import type { Categoria } from "@/types/Categoria";
import type { ProductoFormFinal } from "@/types/Producto";
import type { Sucursal } from "@/types/Sucursal";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2, Package, Plus, Trash2 } from "lucide-react";
import React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import "./editarProducto.css";
import { redondearCantidad } from "@/lib/utils";
import "@/AeroPremium.css";


const formSchema = z.object({
  nombre_producto: z.string().min(1, 'El nombre del producto es requerido'),
  descripcion: z.string().optional().default(''),
  id_categoria: z.string().min(1, 'La categoría es requerida'),
  precio_costo: z.coerce.number().min(0, { message: 'El precio de costo debe ser mayor o igual a 0' }),
  sku_pieza: z.string().min(1, 'El SKU de la pieza es requerido'),
  es_granel: z.boolean().default(false),
  sucursales_inventario: z.array(z.object({
    id_sucursal: z.number(),
    cantidad_actual: z.coerce.number().min(0, { message: 'La cantidad debe ser un número válido' }),
    cantidad_minima: z.coerce.number().min(0, { message: 'La cantidad mínima debe ser un número válido' })
  })).min(1, 'Selecciona al menos una sucursal para el inventario'),
  variantes: z.array(
    z.object({
      id_unidad_venta: z.number().optional(), // ID para actualizar
      nombre_presentacion: z.string().min(1, 'El nombre es requerido'),
      factor_conversion_cantidad: z.number().positive('El factor debe ser mayor a 0'),
      sku_presentacion: z.string().min(1, 'El SKU de la presentación es requerido'),
      sucursales_venta: z.array(
        z.object({
          id_precio: z.number().optional(), // ID para actualizar
          id_sucursal: z.number(),
          precio_venta: z.coerce.number().min(0, { message: 'El precio de venta debe ser mayor o igual a 0' }),
          precio_mayoreo: z.coerce.number().min(0, { message: 'El precio de mayoreo debe ser mayor o igual a 0' })
        })
      ).min(1, 'Asigna al menos una sucursal a esta presentación')
    })
  ).min(1, 'Debes agregar al menos una presentación')
});

type FormValues = z.infer<typeof formSchema>;


export default function EditarProductoForm() {
  const [searchParams] = useSearchParams();
  const id_producto = searchParams.get("id");
  const [currentStep, setCurrentStep] = useState(4);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const { user } = useCurrentUser();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [initialQuantities, setInitialQuantities] = useState<Record<number, number>>({});
  const [adjustments, setAdjustments] = useState<Record<number, Record<number, number | undefined>>>({}); // sucursalId -> variantIndex -> cantidad


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre_producto: '',
      descripcion: '',
      id_categoria: '',
      precio_costo: 0,
      sku_pieza: '',
      es_granel: false,
      sucursales_inventario: [],
      variantes: []
    }
  });

  const { watch } = form;
  const variantes = watch("variantes") || [];


  // Cargar datos del producto
  useEffect(() => {
    if (!id_producto) return;

    const cargarProducto = async () => {
      try {
        setLoading(true);
        obtenerSucursalesApi().then(res => {
          if (res.success) {
            setSucursales(res.data);
          } else {
            setSucursales([]);
          }
        });
        const categoriasData = await obtenerCategoriasApi();
        if (categoriasData.success) {
          setCategorias(categoriasData.data);
        }

        const data = await obtenerProductoGeneral(parseInt(id_producto));

        // Si el backend devuelve sucursales_inventario como number[] (ids), mapear a objetos con cantidades por defecto
        const payload = { ...data.data } as any;
        if (payload.sucursales_inventario && payload.sucursales_inventario.length > 0 && typeof payload.sucursales_inventario[0] === 'number') {
          payload.sucursales_inventario = payload.sucursales_inventario.map((id: number) => ({ id_sucursal: id, cantidad_actual: 0, cantidad_minima: 0 }));
        }
        payload.descripcion = payload.descripcion ?? '';
        payload.sku_pieza = payload.sku_pieza ?? '';
        payload.es_granel = payload.es_granel ?? false;
        form.reset(payload);

        // Almacenar cantidades iniciales
        const initialQ: Record<number, number> = {};
        if (payload.sucursales_inventario) {
          payload.sucursales_inventario.forEach((si: any) => {
            initialQ[si.id_sucursal] = si.cantidad_actual || 0;
          });
        }
        setInitialQuantities(initialQ);

        setLoading(false);
      } catch (error) {
        toast.error('Error al cargar el producto');
        console.error(error);
        setLoading(false);
      }
    };

    cargarProducto();
  }, [id_producto, form.reset]);




  const onSubmit = async (values: FormValues) => {
    setUpdating(true);
    try {
      const data = await actualizarProductoApi(parseInt(id_producto!), values as ProductoFormFinal, user?.id_usuario || 1);
      if (data.success) {
        toast.success(data.message);
        window.history.back();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error al actualizar el producto');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  /* ---------------------- SIGUIENTE ------------------------ */
  const handleNext = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    let valid = false;

    if (currentStep === 1) {
      valid = await form.trigger([
        "nombre_producto",
        "id_categoria",
        "precio_costo",
        "sku_pieza",
      ]);
    }
    else if (currentStep === 2) {
      const promises = variantes.flatMap((_, i) => [
        form.trigger(`variantes.${i}.nombre_presentacion`),
        form.trigger(`variantes.${i}.factor_conversion_cantidad`),
        form.trigger(`variantes.${i}.sku_presentacion`)
      ]);
      valid = (await Promise.all(promises)).every(r => r);
    }
    else if (currentStep === 3) {
      // Step 3 = Precios: validar precios de venta por sucursal
      const fieldsToValidate: any[] = [];
      variantes.forEach((v, vIdx) => {
        v.sucursales_venta.forEach((_, svIdx) => {
          fieldsToValidate.push(`variantes.${vIdx}.sucursales_venta.${svIdx}.precio_venta`);
          fieldsToValidate.push(`variantes.${vIdx}.sucursales_venta.${svIdx}.precio_mayoreo`);
        });
      });

      if (fieldsToValidate.length === 0) {
        toast.error("Debes asignar al menos una sucursal de venta a una presentación.");
        valid = false;
      } else {
        valid = await form.trigger(fieldsToValidate);
      }
    }
    else if (currentStep === 4) {
      // Step 4 = Stock: validar inventario
      valid = await form.trigger(["sucursales_inventario"]);
    }

    if (valid) setCurrentStep(currentStep + 1);
  };

  /* ----------------- AÑADIR / REMOVER VARIANTE ----------------- */
  const addVariante = () => {
    form.setValue("variantes", [
      ...form.getValues("variantes"),
      {
        nombre_presentacion: "",
        factor_conversion_cantidad: 1,
        sku_presentacion: "",
        sucursales_venta: []
      }
    ]);
  };

  const removeVariante = (index: number) => {
    const curr = form.getValues("variantes");
    if (curr.length > 1) {
      const varianteAEliminar = curr[index];
      if (varianteAEliminar.id_unidad_venta) {
        console.log('Marcar para eliminar:', varianteAEliminar.id_unidad_venta);
      }

      form.setValue(
        "variantes",
        curr.filter((_, i) => i !== index)
      );
    }
  };

  /* ----------------- TOGGLE SUCURSAL VENTA -------------------- */
  const toggleSucursalVenta = (varIndex: number, idSucursal: number) => {
    const curr = form.getValues(`variantes.${varIndex}.sucursales_venta`);
    const exists = curr.find(s => s.id_sucursal === idSucursal);

    if (exists) {
      if (exists.id_precio) {
        console.log('Marcar precio para eliminar:', exists.id_precio);
      }

      const updatedVenta = curr.filter(s => s.id_sucursal !== idSucursal);
      form.setValue(`variantes.${varIndex}.sucursales_venta`, updatedVenta);

      // Limpieza automática
      const allVariantes = form.getValues("variantes");
      const isStillSoldSomewhere = allVariantes.some((v, idx) => {
        const venta = idx === varIndex ? updatedVenta : v.sucursales_venta;
        return venta.some(sv => sv.id_sucursal === idSucursal);
      });

      if (!isStillSoldSomewhere) {
        const inv = form.getValues("sucursales_inventario") || [];
        form.setValue("sucursales_inventario", inv.filter((s: any) => s.id_sucursal !== idSucursal));
      }
    } else {
      // Al habilitar venta, asegurar que esté en inventario
      const inv = form.getValues("sucursales_inventario") || [];
      if (!inv.find((s: any) => s.id_sucursal === idSucursal)) {
        form.setValue("sucursales_inventario", [...inv, { id_sucursal: idSucursal, cantidad_actual: 0, cantidad_minima: 10 }]);
      }

      form.setValue(
        `variantes.${varIndex}.sucursales_venta`,
        [...curr, { id_sucursal: idSucursal, precio_venta: 0, precio_mayoreo: 0 }]
      );
    }
  };

  /* ----------------- TOGGLE SUCURSAL INVENTARIO -------------------- */
  const toggleSucursalInventario = (idSucursal: number) => {
    const curr = form.getValues("sucursales_inventario") || [];
    const exists = curr.find((s: any) => s.id_sucursal === idSucursal);
    if (exists) {
      // 1. Remover de inventario
      const updatedInventario = curr.filter((s: any) => s.id_sucursal !== idSucursal);
      form.setValue("sucursales_inventario", updatedInventario);

      // 2. Mantener consistencia: remover de la venta en todas las variantes
      const currentVariantes = form.getValues("variantes");
      const updatedVariantes = currentVariantes.map(v => ({
        ...v,
        sucursales_venta: v.sucursales_venta.filter(sv => sv.id_sucursal !== idSucursal)
      }));
      form.setValue("variantes", updatedVariantes);
    } else {
      const newEntry = { id_sucursal: idSucursal, cantidad_actual: 0, cantidad_minima: 0 };
      form.setValue("sucursales_inventario", [...curr, newEntry]);
    }
  };

  /* ----------------------- HELPERS UI ----------------------- */
  const handleVariantAdjustment = (idSucursal: number, variantIndex: number, amount: number | undefined) => {
    const newAdjustments = {
      ...adjustments,
      [idSucursal]: {
        ...(adjustments[idSucursal] || {}),
        [variantIndex]: amount
      }
    };
    setAdjustments(newAdjustments);

    // Calcular el total de piezas a sumar/restar basado en todas las variantes de esa sucursal
    let totalPiezasAAjustar = 0;
    const branchAdjusts = newAdjustments[idSucursal];

    Object.keys(branchAdjusts).forEach(vIdx => {
      const vIndex = parseInt(vIdx);
      const factor = variantes[vIndex]?.factor_conversion_cantidad || 1;
      const valInput = branchAdjusts[vIndex];
      const cant = (valInput === undefined || isNaN(valInput as number)) ? 0 : valInput as number;
      totalPiezasAAjustar += (cant * factor);
    });

    const initial = initialQuantities[idSucursal] || 0;
    const result = initial + totalPiezasAAjustar;

    // Actualizar el form
    const currentInv = form.getValues("sucursales_inventario") || [];
    const idx = currentInv.findIndex((si: any) => si.id_sucursal === idSucursal);
    if (idx !== -1) {
      const es_granel = form.getValues("es_granel");
      form.setValue(`sucursales_inventario.${idx}.cantidad_actual`, Math.max(0, redondearCantidad(result, es_granel)));
    }
  };



  /* ----------------------- STEP 1 --------------------------- */
  const renderStep1 = () => (
    <div className="space-y-6 animate-aero">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="nombre_producto"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-black text-black">Nombre del Producto *</FormLabel>
                <FormControl>
                  <Input {...field} className="aero-input h-11 text-lg font-black text-black" placeholder="Ej: Sabritas Original 45g" onFocus={(e) => e.target.select()} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="id_categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-black text-black">Categoría *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="aero-input h-11 font-black text-black">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="aero-glass">
                    {categorias.map(cat => (
                      <SelectItem key={cat.id_categoria} value={String(cat.id_categoria)} className="font-black text-black">
                        {cat.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sku_pieza"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-black text-black">SKU Base (Pieza) *</FormLabel>
                <FormControl>
                  <Input {...field} className="aero-input h-11 font-mono font-black text-black" placeholder="Escanear código..." onFocus={(e) => e.target.select()} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="precio_costo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-black text-black">Precio Costo ($) *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black font-black">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      className="aero-input h-11 pl-8 text-xl font-black text-black"
                      value={field.value ?? ""}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-black text-black">Descripción</FormLabel>
                <FormControl>
                  <Textarea {...field} className="aero-input min-h-[110px] font-black text-black" rows={3} value={field.value || ''} placeholder="Descripción opcional del producto..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <FormField
        control={form.control}
        name="es_granel"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl p-4 aero-glass border-2 border-black hover:border-black transition-colors">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                className="w-5 h-5 border-black data-[state=checked]:bg-black"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="font-black text-black text-base">
                ¿Venta a Granel?
              </FormLabel>
              <CardDescription className="font-black text-black">
                Activa si el producto se vende por peso, litros o medida (kg, m, l).
              </CardDescription>
            </div>
          </FormItem>
        )}
      />
    </div>
  );

  /* ----------------------- STEP 2 (DEFINIR VARIANTES) --------------------------- */
  const renderStep2 = () => (
    <div className="space-y-6 animate-aero">
      <Alert className="aero-glass border-black bg-white/50 backdrop-blur-md">
        <AlertTitle className="text-lg font-black text-black flex items-center gap-2 uppercase tracking-tight">
          📦 Gestión de Paquetes
        </AlertTitle>
        <AlertDescription className="text-black font-black italic">
          Configura cómo se vende este producto (Cajas, Six-packs, etc.).
          Esto activará el cálculo automático de inventario para tus sucursales.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {variantes.map((_, index) => (
          <Card key={index} className="aero-card aero-glass border-2 border-black relative group">
            <CardContent className="pt-8 space-y-6">
              {index > 0 && (
                <Button
                  variant="ghost"
                  className="absolute top-2 right-2 text-black hover:text-black hover:bg-gray-200 rounded-full transition-all"
                  size="sm"
                  type="button"
                  onClick={() => removeVariante(index)}
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                </Button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name={`variantes.${index}.nombre_presentacion`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-black tracking-widest">Nombre del Paquete *</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={index === 0} placeholder="Ej: Caja 24 piezas" className="aero-input h-10 font-black text-black border-2 border-black" onFocus={(e) => e.target.select()} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`variantes.${index}.factor_conversion_cantidad`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-black tracking-widest">Contenido (unidades) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            className="aero-input h-10 font-black text-black border-2 border-black"
                            value={field.value}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                            disabled={index === 0}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-black font-black uppercase">Piezas</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name={`variantes.${index}.sku_presentacion`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-black tracking-widest">Código de Barras del Paquete *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4" />
                        <Input
                          {...field}
                          className="aero-input h-10 pl-10 font-mono font-black text-black border-2 border-black"
                          placeholder="Escanea el SKU del paquete..."
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addVariante}
        className="w-full border-dashed border-2 py-10 aero-glass border-black hover:border-black hover:bg-gray-100/50 text-black rounded-2xl transition-all group"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-black uppercase text-xs tracking-widest line-clamp-1 text-black">Nuevo Paquete / Presentación</span>
        </div>
      </Button>
    </div>
  );

  /* ----------------------- STEP 3 (INVENTARIO POR PRESENTACIÓN) --------------------------- */
  const renderStep3 = () => (
    <div className="space-y-6 animate-aero">
      <Alert className="aero-glass border-black bg-white/50">
        <AlertTitle className="text-lg font-black text-black flex items-center gap-2 uppercase tracking-tight">
          <Package className="w-5 h-5" /> Stock por Sucursal
        </AlertTitle>
        <AlertDescription className="text-black font-black italic">
          Ajusta las cantidades físicas sumando (+) o restando (-) paquetes. El sistema hará las cuentas por ti.
        </AlertDescription>
      </Alert>

      <FormField
        control={form.control}
        name="sucursales_inventario"
        render={({ field }) => (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sucursales.map(s => {
              const invIndex = (field.value || []).findIndex((si: any) => si.id_sucursal === s.id_sucursal);
              const selected = invIndex !== -1;

              return (
                <Card key={s.id_sucursal} className={`aero-card border-2 transition-all duration-300 ${selected ? 'border-black aero-glass scale-[1.03] shadow-2xl' : 'border-dashed border-black bg-white/30'}`}>
                  {/* Header Sucursal */}
                  <div
                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${selected ? 'bg-black text-white rounded-t-lg' : 'hover:bg-gray-200/50'}`}
                    onClick={() => toggleSucursalInventario(s.id_sucursal)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selected ? 'bg-white border-white text-black' : 'bg-white border-black text-black'}`}>
                        {selected && <Check className="w-4 h-4 text-black font-black" />}
                      </div>
                      <span className={`font-black uppercase tracking-tight ${selected ? 'text-white' : 'text-black'}`}>{s.nombre}</span>
                    </div>
                    {!selected && <Plus className="w-5 h-5 text-black" />}
                  </div>

                  {selected && (
                    <CardContent className="p-5 space-y-6 animate-aero">
                      <div className="grid grid-cols-2 gap-4 bg-white border-2 border-black text-black p-4 rounded-2xl shadow-inner">
                        <div className="text-center border-r border-black">
                          <p className="text-[8px] uppercase font-black text-black tracking-widest mb-1">Stock Actual</p>
                          <p className="text-2xl font-black">{initialQuantities[s.id_sucursal] || 0}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[8px] uppercase font-black text-black tracking-widest mb-1">Stock Final</p>
                          <p className="text-2xl font-black text-black">
                            {form.watch(`sucursales_inventario.${invIndex}.cantidad_actual`)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-[10px] font-black text-black uppercase tracking-[0.2em] block mb-2">Entradas / Salidas</Label>
                        <div className="space-y-2">
                          {variantes.map((v, vIdx) => {
                            const isEnabledInBranch = v.sucursales_venta.some(sv => sv.id_sucursal === s.id_sucursal);
                            if (v.factor_conversion_cantidad !== 1 && !isEnabledInBranch) return null;

                            return (
                              <div key={vIdx} className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border-2 border-black transition-all group">
                                <div className="flex-1">
                                  <p className="text-sm font-black text-black leading-tight uppercase tracking-tight">
                                    {v.nombre_presentacion || "Sin nombre"}
                                  </p>
                                  <p className="text-[9px] text-black font-black uppercase">× {v.factor_conversion_cantidad} pzas</p>
                                </div>
                                <Input
                                  type="number"
                                  placeholder="+/-"
                                  className="h-9 w-20 text-center font-black text-black border-2 border-black focus:border-black rounded-lg bg-white aero-input"
                                  value={adjustments[s.id_sucursal]?.[vIdx] ?? ""}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                                    handleVariantAdjustment(s.id_sucursal, vIdx, isNaN(val as number) ? undefined : val);
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-black">
                        <FormField
                          control={form.control}
                          name={`sucursales_inventario.${invIndex}.cantidad_minima`}
                          render={({ field: f }) => (
                            <div className="flex items-center justify-between border-2 border-black bg-white/50 p-3 rounded-xl">
                              <div className="flex flex-col">
                                <Label className="text-[10px] font-black text-black uppercase">Aviso Mínimo</Label>
                                <span className="text-[8px] text-black font-black">Piezas en reserva</span>
                              </div>
                              <Input
                                type="number"
                                className="h-8 w-16 text-center font-black text-black bg-white border-2 border-black"
                                {...f}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => f.onChange(e.target.value)}
                              />
                            </div>
                          )}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full text-[10px] font-black text-black uppercase tracking-widest hover:bg-black hover:text-white transition-all rounded-lg border-2 border-black mt-2"
                        onClick={() => {
                          const initial = initialQuantities[s.id_sucursal] || 0;
                          handleVariantAdjustment(s.id_sucursal, 0, -initial);
                          setAdjustments({ ...adjustments, [s.id_sucursal]: { "0": -initial } });
                        }}
                      >
                        BORRAR TODO EL STOCK
                      </Button>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      />
    </div>
  );

  /* ----------------------- STEP 4 --------------------------- */
  const renderStep4 = () => (
    <div className="space-y-10 animate-aero">
      <Alert className="aero-glass border-black bg-white/50">
        <AlertTitle className="text-lg font-black text-black flex items-center gap-2 uppercase tracking-tight">
          💰 Catálogo de Precios
        </AlertTitle>
        <AlertDescription className="text-black font-black italic">
          Configura los márgenes de ganancia por sucursal. Los cambios se reflejarán inmediatamente en caja.
        </AlertDescription>
      </Alert>

      <div className="space-y-12">
        {variantes.map((v, vIndex) => (
          <div key={vIndex} className="space-y-6">
            <div className="flex items-center gap-4 border-l-8 border-black pl-4 py-1">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-black tracking-[0.3em]">Presentación</span>
                <h3 className="text-2xl font-black text-black uppercase italic tracking-tighter">
                  {v.nombre_presentacion || "Sin nombre"}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sucursales.map(suc => {
                const svIndex = v.sucursales_venta.findIndex(sv => sv.id_sucursal === suc.id_sucursal);
                const selected = svIndex !== -1;

                return (
                  <Card key={suc.id_sucursal} className={`aero-card border-none transition-all duration-300 overflow-hidden ${selected ? 'aero-glass scale-[1.03] shadow-2xl ring-2 ring-black' : 'bg-white/30 border-2 border-black'}`}>
                    <div
                      className={`p-4 flex items-center justify-between cursor-pointer transition-all ${selected ? 'bg-black text-white' : 'hover:bg-gray-200/50'}`}
                      onClick={() => toggleSucursalVenta(vIndex, suc.id_sucursal)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selected ? 'bg-white border-white' : 'bg-white border-black'}`}>
                          {selected && <Check className="w-4 h-4 text-black font-black" />}
                        </div>
                        <span className={`font-black uppercase tracking-tight ${selected ? 'text-white' : 'text-black'}`}>
                          {suc.nombre}
                        </span>
                      </div>
                    </div>

                    {selected && (
                      <CardContent className="p-5 space-y-5 animate-aero border-x-2 border-b-2 border-black rounded-b-xl">
                        <FormField
                          control={form.control}
                          name={`variantes.${vIndex}.sucursales_venta.${svIndex}.precio_venta`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[9px] font-black text-black uppercase tracking-widest pl-1">Precio Unitario ($)</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black font-black text-xl">$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="aero-input h-14 pl-10 text-3xl font-black text-black border-2 border-black shadow-inner"
                                    value={field.value}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => field.onChange(e.target.value)}
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`variantes.${vIndex}.sucursales_venta.${svIndex}.precio_mayoreo`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[9px] font-black text-black uppercase tracking-widest pl-1">Precio Mayoreo ($)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black font-black text-lg">$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="aero-input h-12 pl-9 text-xl font-black text-black border-2 border-black bg-white/50"
                                    value={field.value}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => field.onChange(e.target.value)}
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 p-6">
        <Card className="aero-glass w-full max-w-sm p-8 flex flex-col items-center space-y-6 shadow-2xl border-2 border-white/50">
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
            <Package className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight italic">Hermes POS</h2>
            <p className="text-gray-500 font-bold animate-pulse uppercase text-[10px] tracking-widest">Cargando catálogo maestro...</p>
          </div>
        </Card>
      </div>
    );
  }

  const steps = [
    { title: "Básico", icon: "📝" },
    { title: "Paquetes", icon: "📦" },
    { title: "Precios", icon: "💰" },
    { title: "Stock", icon: "🏢" }
  ];

  return (
    <div className="ep-wrapper" data-step={currentStep}>
      <div className="ep-header">
        <div>
          <h1 className="ep-title">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="mr-4 -mt-2">
              <ArrowLeft className="w-8 h-8 text-black" />
            </Button>
            Producto #{id_producto}
          </h1>
          <p className="ep-subtitle">Configuración Maestro de Inventarios</p>
        </div>

        {/* Stepper puro CSS */}
        <div className="ep-steps-header" style={{ borderRadius: "8px", overflow: "hidden" }}>
          {steps.map((s, i) => (
            <div key={i} className={`ep-step-item ${currentStep === i + 1 ? 'active' : ''}`}>
              <span style={{ fontSize: "20px", marginRight: "8px" }}>{s.icon}</span>
              <span>{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ep-main-card">
        <div className="ep-step-content">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

              <div className="min-h-[450px]">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep4()}
                {currentStep === 4 && renderStep3()}
              </div>

              {/* Botonera de Navegación Final en Puro CSS */}
              <div className="ep-actions">
                <button
                  type="button"
                  disabled={currentStep === 1 || updating}
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="ep-btn ep-btn-outline"
                >
                  <ChevronLeft className="mr-2" /> Atrás
                </button>

                <div className="ep-actions-right">
                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="ep-btn ep-btn-primary"
                    >
                      Continuar <ChevronRight className="ml-2" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={updating}
                      className="ep-btn ep-btn-success"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="mr-2 animate-spin" /> Guardando
                        </>
                      ) : (
                        <>
                          <Check className="mr-2" /> Confirmar
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Disclaimer de seguridad Lite */}
      <div className="max-w-6xl mx-auto mt-6 px-4 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] opacity-60">
        <span>© 2024 Hermes Advanced POS System</span>
        <div className="flex gap-4">
          <span>Security Level: High</span>
          <span className="text-blue-500">Lite Edition for Win Legacy</span>
        </div>
      </div>
    </div >
  );
}