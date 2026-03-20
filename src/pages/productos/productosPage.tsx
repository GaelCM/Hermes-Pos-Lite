import { obtenerSucursalesApi } from "@/api/sucursalApi/sucursalApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUser } from "@/contexts/currentUser";
import type { Sucursal } from "@/types/Sucursal";
import { ArrowRight, Building2, MapPin, Package, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import "./productos-page.css";

export default function ProductosPage() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>();

  useEffect(() => {
    if (user.id_rol === 2) {
      navigate(`/`);
      return;
    }
    setLoading(true);
    obtenerSucursalesApi().then(data => setSucursales(data.data)).catch(err => { setError(err.message) }).finally(() => setLoading(false));
  }, [user.id_rol, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen productos-page-container">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-bold uppercase text-xs tracking-widest">Sincronizando centros de distribución...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen productos-page-container">
        <div className="text-center bg-white p-8 rounded-3xl shadow-xl border border-red-100">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-800 mb-2">Error de Conexión</h2>
          <p className="text-slate-500 text-sm font-medium">{error || "No se pudo establecer conexión con el servidor"}</p>
          <Button onClick={() => window.location.reload()} className="mt-6 bg-blue-600 font-bold">Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="productos-page-container p-6 overflow-y-auto h-screen">
      <div className="p-4 mx-auto max-w-7xl">
        {/* Header Aero */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 sucursal-icon-box text-blue-600">
                <Package className="w-7 h-7" />
              </div>
              <h1 className="text-4xl header-title-aero">
                Control de Inventarios
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 w-2 h-2 rounded-full animate-pulse" />
              <p className="text-slate-600 font-bold text-sm">
                Sesión activa: <span className="text-blue-600 uppercase tracking-wider">{user.usuario}</span>
              </p>
            </div>
          </div>
          <div className="bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white shadow-sm self-start">
            <p className="text-slate-500 text-xs font-black uppercase tracking-[2px]">Seleccione una sucursal para operar</p>
          </div>
        </div>

        {/* Listado de Sucursales en Filas Compactas */}
        <div className="flex flex-col gap-4">
          {sucursales.map((sucursal) => (
            <Card
              key={sucursal.id_sucursal}
              className="sucursal-card group cursor-pointer"
              onClick={() => { navigate(`/productos/sucursal?id=${sucursal.id_sucursal}&sucursal=${sucursal.nombre}`) }}
            >
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* 1. Identificación de la Sucursal */}
                  <div className="flex items-center gap-4 lg:w-[25%] shrink-0">
                    <div className="w-12 h-12 sucursal-icon-box shrink-0 shadow-md">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-slate-800 leading-tight truncate group-hover:text-blue-600 transition-colors">
                        {sucursal.nombre}
                      </h3>
                      <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{sucursal.direccion}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Panel de Datos en Fila */}
                  <div className="flex-1 flex flex-wrap lg:flex-nowrap items-center justify-between gap-6 py-3 lg:py-0 border-t lg:border-t-0 border-slate-100 lg:px-8 lg:border-x border-slate-100">
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-black text-slate-800 leading-none">{sucursal.total_productos}</span>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mt-1">Modelos</span>
                    </div>
                    <div className="hidden sm:flex flex-col items-center">
                      <span className="text-xl font-black text-slate-800 leading-none">{sucursal.total_presentaciones}</span>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mt-1">Variantes</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-black text-slate-800 leading-none">{sucursal.stock_total_piezas}</span>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mt-1">Stock Total</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-black text-green-700 leading-none">${sucursal.valor_inventario_venta.toLocaleString()}</span>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mt-1">Val. Venta</span>
                    </div>

                    {/* Indicadores de Alerta */}
                    <div className="flex items-center gap-2">
                      {sucursal.productos_stock_bajo > 0 && (
                        <div className="badge-stock-bajo-page px-2 py-1 rounded-md flex items-center gap-1.5" title="Productos con stock bajo">
                          <AlertCircle className="w-3 h-3" />
                          <span className="text-xs font-black">{sucursal.productos_stock_bajo}</span>
                        </div>
                      )}
                      {sucursal.productos_sin_stock > 0 && (
                        <div className="badge-sin-stock-page px-2 py-1 rounded-md flex items-center gap-1.5" title="Productos agotados">
                          <Package className="w-3 h-3" />
                          <span className="text-xs font-black">{sucursal.productos_sin_stock}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Acción Directa */}
                  <div className="shrink-0 flex items-center justify-end lg:w-[15%]">
                    <Button
                      className="btn-gestionar w-full lg:w-auto h-11 px-8 group-hover:scale-105"
                    >
                      <span className="text-xs">Entrar</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
