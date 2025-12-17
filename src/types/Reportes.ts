

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