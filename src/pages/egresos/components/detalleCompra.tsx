import { obtenerDetalleCompra } from "@/api/egresosApi/compras";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { DetalleCompraItem } from "@/types/ComprasT";
import {
    Package,
    ShoppingCart,
    Calendar,
    Tag,
    Hash,
    ChevronLeft,
    FileText,
    DollarSign,
    User,
    Building2,
    Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function DetalleCompra() {
    const { id_compra } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<DetalleCompraItem[]>([]);

    useEffect(() => {
        if (!id_compra) {
            toast.error("No se proporcionó un ID de compra");
            navigate(-1);
            return;
        }

        const fetchDetalle = async () => {
            try {
                setLoading(true);
                const response = await obtenerDetalleCompra(Number(id_compra));
                if (response.success) {
                    setItems(response.data);
                } else {
                    toast.error(response.message || "Error al obtener el detalle de la compra");
                }
            } catch (error) {
                console.error("Error fetching purchase detail:", error);
                toast.error("Error de conexión al servidor");
            } finally {
                setLoading(false);
            }
        };

        fetchDetalle();
    }, [id_compra, navigate]);

    const totalCompra = items.length > 0 ? Number(items[0].monto_total) : 0;
    const totalArticulos = items.reduce((acc, item) => acc + Number(item.cantidad), 0);
    const compraInfo = items.length > 0 ? items[0] : null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString('es-MX', {
            dateStyle: 'long',
            timeStyle: 'short'
        });
    };

    if (loading) {
        return (
            <div className="p-8 space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32 rounded-3xl" />
                    <Skeleton className="h-32 rounded-3xl" />
                    <Skeleton className="h-32 rounded-3xl" />
                </div>
                <Skeleton className="h-[400px] w-full rounded-3xl" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="rounded-full hover:bg-white shadow-sm transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                                Detalle de Compra
                            </h1>
                            <p className="text-slate-500 font-medium">
                                Registro de adquisición #{id_compra}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="px-3 py-1 text-sm bg-blue-100 text-blue-700 border-none">
                            <Hash className="w-3 h-3 mr-1" /> ID: {id_compra}
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1 text-sm border-slate-200">
                            <Calendar className="w-3 h-3 mr-1" /> {formatDate(compraInfo?.fecha_compra)}
                        </Badge>
                    </div>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* General Info */}
                    <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xl flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-6 text-primary">
                            <FileText className="w-5 h-5" />
                            <h2 className="font-bold text-lg text-slate-800">Información de la Operación</h2>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Proveedor</p>
                                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{compraInfo?.nombre_proveedor || "N/A"}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sucursal</p>
                                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{compraInfo?.nombre_sucursal || "N/A"}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Método Pago</p>
                                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-none">
                                    {compraInfo?.metodo_pago_descripcion || "N/A"}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registrado por</p>
                                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{compraInfo?.nombre_usuario || "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Card */}
                    <div className="bg-primary p-6 rounded-3xl shadow-xl shadow-primary/20 flex flex-col justify-between text-white">
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <Badge className="bg-white/20 text-white border-none backdrop-blur-md">Efectuado</Badge>
                        </div>
                        <div className="mt-4">
                            <p className="text-white/60 text-sm font-medium">Inversión Total</p>
                            <h3 className="text-3xl font-black">{formatCurrency(totalCompra)}</h3>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <CardKpi
                        title="Subtotal Productos"
                        value={formatCurrency(totalCompra)}
                        icon={<DollarSign className="w-6 h-6 text-emerald-500" />}
                        description="Suma de precios unitarios"
                        variant="emerald"
                    />
                    <CardKpi
                        title="Total Artículos"
                        value={totalArticulos}
                        icon={<ShoppingCart className="w-6 h-6 text-blue-500" />}
                        description="Unidades ingresadas al inventario"
                        variant="blue"
                    />
                    <CardKpi
                        title="Referencia/Folio"
                        value={compraInfo?.folio || "Sin Folio"}
                        icon={<Tag className="w-6 h-6 text-amber-500" />}
                        description="Documento de respaldo"
                        variant="amber"
                    />
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-bold text-slate-800">Productos Adquiridos</h2>
                        </div>
                        <span className="text-sm font-medium text-slate-50">{items.length} partidas</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-500 border-b border-slate-100">
                                    <th className="px-6 py-4 font-semibold text-sm">Producto / SKU</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-center">Cantidad</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-right">Costo Unit.</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {items.map((item) => (
                                    <tr
                                        key={item.id_detalle_compra}
                                        className="group hover:bg-slate-50 transition-colors duration-200"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700">{item.nombre_producto}</span>
                                                <span className="text-xs text-slate-400 font-mono">{item.sku_presentacion || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold text-slate-700">{item.cantidad}</span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-tighter">{item.nombre_unidad || 'Unidad'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-600">
                                            {formatCurrency(item.precio_unitario)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-slate-900">{formatCurrency(item.subtotal)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {items.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                            No hay productos registrados en esta compra.
                        </div>
                    )}

                    {/* Description Section */}
                    {compraInfo?.descripcion_compra && (
                        <div className="p-6 bg-slate-50/30 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Descripción / Notas</h3>
                            <p className="text-sm text-slate-600 italic">"{compraInfo.descripcion_compra}"</p>
                        </div>
                    )}

                    {/* Footer Summary */}
                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <div className="w-full md:w-80 space-y-4">
                            <div className="flex justify-between text-slate-500 text-sm">
                                <span>Partidas totales</span>
                                <span className="font-medium">{items.length}</span>
                            </div>
                            <div className="flex justify-between text-slate-500 text-sm">
                                <span>Unidades totales</span>
                                <span className="font-medium">{totalArticulos}</span>
                            </div>
                            <Separator className="bg-slate-200" />
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-primary">Inversión Final</span>
                                <span className="text-3xl font-black text-primary">
                                    {formatCurrency(totalCompra)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface CardKpiProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    description: string;
    variant: 'emerald' | 'blue' | 'amber' | 'purple';
}

function CardKpi({ title, value, icon, description, variant }: CardKpiProps) {
    const borders = {
        emerald: "border-emerald-100",
        blue: "border-blue-100",
        amber: "border-amber-100",
        purple: "border-purple-100",
    };

    return (
        <div className={`bg-white p-6 rounded-3xl border ${borders[variant]} shadow-lg transition-all duration-300 hover:-translate-y-1`}>
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-50 rounded-2xl">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{value}</h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">{description}</p>
            </div>
        </div>
    );
}