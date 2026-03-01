import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useListaProductos } from "@/contexts/listaProductos"

import { useEffect } from "react"
import type { ProductoVenta } from "@/types/Producto"
import { useCurrentUser } from "@/contexts/currentUser"
import { Plus, DollarSign, Layers, ShoppingCart, Tag } from "lucide-react"
import "./temp-product-dialog.css"

/**
 * Esquema de validación para el producto temporal
 * Se requieren campos básicos como nombre y precio.
 */
const tempProductSchema = z.object({
    nombre_producto: z.string().min(1, "El nombre es requerido"),
    descripcion: z.string().optional(),
    precio_venta: z.coerce.number().min(0.01, "El precio debe ser mayor a 0"),
    precio_mayoreo: z.coerce.number().min(0, "El precio no puede ser negativo").optional(),
    nombre_presentacion: z.string().default("Pieza"),
    cantidad: z.coerce.number().min(1, "Mínimo 1"),
})

type TempProductFormValues = z.infer<typeof tempProductSchema>

interface DialogNuevoProductoTempProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    inputRef?: React.RefObject<{ focus: () => void } | null>;
}

export default function DialogNuevoProductoTemp({ isOpen, setIsOpen, inputRef }: DialogNuevoProductoTempProps) {
    const { addProduct } = useListaProductos()
    const { user } = useCurrentUser();

    const form = useForm<TempProductFormValues>({
        resolver: zodResolver(tempProductSchema),
        defaultValues: {
            nombre_producto: "",
            descripcion: "",
            precio_venta: 0,
            precio_mayoreo: 0,
            nombre_presentacion: "Pieza",
            cantidad: 1,
        },
    })

    // Reset form when dialog opens
    useEffect(() => {
        if (isOpen) {
            form.reset({
                nombre_producto: "",
                descripcion: "",
                precio_venta: 0,
                precio_mayoreo: 0,
                nombre_presentacion: "Unidad",
                cantidad: 1,
            })
        }
    }, [isOpen, form])

    const onSubmit = (data: TempProductFormValues) => {
        const tempId = -Date.now();

        const newProduct: ProductoVenta = {
            id_producto: tempId,
            sku_pieza: `temp-${Math.abs(tempId)}`,
            nombre_producto: data.nombre_producto,
            descripcion: data.descripcion || "Producto Temporal",
            precio_costo: 0,
            es_producto_compuesto: 0,
            id_unidad_venta: tempId, // Crucial for cart logic (addProduct checks this)
            nombre_presentacion: data.nombre_presentacion,
            factor_conversion_cantidad: 1,
            sku_presentacion: `temp-vp-${Math.abs(tempId)}`,
            id_precio: 0,
            precio_venta: data.precio_venta,
            precio_mayoreo: data.precio_mayoreo || data.precio_venta,
            id_sucursal: user?.id_sucursal,
            stock_piezas: 9999,
            stock_disponible_presentacion: 9999,
            es_granel: false,
        }

        addProduct(newProduct, data.cantidad)

        setIsOpen(false)

        // Return focus to the search bar or main input if provided
        setTimeout(() => {
            inputRef?.current?.focus();
        }, 100);
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open)
            if (!open) {
                setTimeout(() => {
                    inputRef?.current?.focus();
                }, 100);
            }
        }}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl temp-product-container">
                <DialogHeader className="p-6 temp-product-header">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center header-icon-temp text-blue-600">
                            <Plus className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-slate-800">
                                Producto Express
                            </DialogTitle>
                            <DialogDescription className="text-slate-700 text-xs font-bold">
                                Cobro rápido fuera de inventario
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">

                        {/* Nombre del Producto */}
                        <div className="field-group-aero">
                            <FormField
                                control={form.control}
                                name="nombre_producto"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="label-aero-temp flex items-center gap-2">
                                            <Tag className="w-3 h-3" />
                                            Nombre del Producto
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej. Servicio de Mantenimiento..." {...field} className="input-aero-temp" autoFocus />
                                        </FormControl>
                                        <FormMessage className="text-[10px] font-black uppercase text-red-500" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Precios */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="field-group-aero">
                                <FormField
                                    control={form.control}
                                    name="precio_venta"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="label-aero-temp flex items-center gap-2 text-blue-600">
                                                <DollarSign className="w-3 h-3" />
                                                Precio Venta
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="currency-box">$</span>
                                                    <Input type="number" step="0.01" placeholder="0.00" {...field} className="input-aero-temp input-with-currency" />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[10px] font-black uppercase text-red-500" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="field-group-aero">
                                <FormField
                                    control={form.control}
                                    name="precio_mayoreo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="label-aero-temp flex items-center gap-2 opacity-60">
                                                <DollarSign className="w-3 h-3" />
                                                Mayoreo
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="currency-box">$</span>
                                                    <Input type="number" step="0.01" placeholder="0.00" {...field} className="input-aero-temp input-with-currency" />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[10px] font-black uppercase text-red-500" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Cantidad y Unidad */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="field-group-aero">
                                <FormField
                                    control={form.control}
                                    name="nombre_presentacion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="label-aero-temp flex items-center gap-2">
                                                <Layers className="w-3 h-3" />
                                                Unidad
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. Pza" {...field} className="input-aero-temp" />
                                            </FormControl>
                                            <FormMessage className="text-[10px] font-black uppercase text-red-500" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="field-group-aero">
                                <FormField
                                    control={form.control}
                                    name="cantidad"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="label-aero-temp flex items-center gap-2">
                                                <ShoppingCart className="w-3 h-3" />
                                                Cantidad
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} className="input-aero-temp text-center font-black" />
                                            </FormControl>
                                            <FormMessage className="text-[10px] font-black uppercase text-red-500" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="field-group-aero">
                            <FormField
                                control={form.control}
                                name="descripcion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="label-aero-temp">Descripción (Opcional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Nota rápida..."
                                                className="resize-none input-aero-temp h-16"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[10px] font-black uppercase text-red-500" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="submit" className="btn-add-temp group">
                                <Plus className="w-5 h-5 mr-3 group-hover:scale-125 transition-transform" />
                                Agregar a la Venta
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
