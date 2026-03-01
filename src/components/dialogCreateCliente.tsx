import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createCliente } from "@/api/clientesApi/clientesApi";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, UserPlus, Phone, MapPin, CheckCircle2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import "./create-cliente-dialog.css";

const clientSchema = z.object({
    nombre_cliente: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    direccion: z.string().optional(),
    telefono: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

type props = {
    isOpen: boolean,
    onClose: (open: boolean) => void,
    onSuccess?: (id: number) => void
}

export default function DialogCreateCliente({ isOpen, onClose, onSuccess }: props) {
    const [loading, setLoading] = useState(false);

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            nombre_cliente: "",
            direccion: "",
            telefono: "",
        },
    });

    const onSubmit = async (values: ClientFormValues) => {
        setLoading(true);
        try {
            const res = await createCliente({
                nombre_cliente: values.nombre_cliente,
                direccion: values.direccion || "",
                telefono: values.telefono || ""
            });

            if (res.success) {
                toast.success("Cliente creado correctamente");
                form.reset();
                onSuccess?.(res.data);
                onClose(false);
            } else {
                toast.error("Error al crear cliente", { description: res.message });
            }
        } catch (error) {
            console.error("Error creating client:", error);
            toast.error("Error de conexión al crear el cliente");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 icon-container-aero">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tight text-slate-800">Registrar Cliente</DialogTitle>
                            <DialogDescription className="text-xs font-bold uppercase text-slate-400">
                                Introduzca los datos del nuevo cliente
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="nombre_cliente"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="label-aero">
                                            Nombre Completo <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ej. Juan Pérez"
                                                {...field}
                                                className="form-field-aero"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[10px] font-black uppercase text-red-500" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="telefono"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="label-aero">
                                            Teléfono de Contacto
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    placeholder="10 dígitos"
                                                    {...field}
                                                    className="form-field-aero pl-10"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px] font-black uppercase text-red-500" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="direccion"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="label-aero">
                                            Dirección Fiscal / Domicilio
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    placeholder="Calle, Colonia, Ciudad..."
                                                    {...field}
                                                    className="form-field-aero pl-10"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px] font-black uppercase text-red-500" />
                                    </FormItem>
                                )}
                            />

                            <div className="flex gap-3 pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onClose(false)}
                                    className="flex-1 btn-cancel-cliente"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-2 btn-save-cliente"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Guardando
                                        </>
                                    ) : (
                                        "Guardar Cliente"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
