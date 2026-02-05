

export interface ReporteBajoStockItem {
    id_producto: number;
    nombre_producto: string;
    sku_pieza: string | null;
    id_sucursal: number;
    nombre_sucursal: string;
    cantidad_actual: number;
    cantidad_minima: number;
    estado: 'Agotado' | 'Bajo Stock';
}

export interface ReporteBajoStockResponse {
    success: boolean;
    message: string;
    data: ReporteBajoStockItem[];
}


export interface ReporteMovimientoItem {
    id_movimiento: number;
    id_usuario: number;
    nombre_usuario: string;
    id_producto: number;
    nombre_producto: string;
    sku_pieza: string | null;
    id_sucursal: number;
    nombre_sucursal: string;
    cantidad: number;
    cantidad_antes: number;
    cantidad_despues: number;
    tipo_movimiento: 'transferencia_salida' | 'transferencia_entrada' | 'venta' | 'compra' | 'ajuste' | 'merma' | 'devolucion';
    referencia: string | null;
    fecha_movimiento: string;
    motivos: string | null;
}

export interface FiltrosReporteMovimientos {
    fecha_desde: string;
    fecha_hasta: string;
    id_sucursal?: number | null;
    tipo_movimiento?: string | null;
}

