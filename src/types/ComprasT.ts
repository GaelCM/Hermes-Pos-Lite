
export interface NuevaCompra {
    id_sucursal: number;
    id_usuario: number;
    id_turno: number;
    id_proveedor: number;
    monto: number;
    metodo_pago: number;
    folio: string;
    descripcion: string;
    items: {
        id_producto: number;
        id_unidad_venta: number;
        cantidad: number;
        precio_unitario: number;
    }[];
}



export interface DetalleCompraItem {
    id_detalle_compra: number;
    id_compra: number;
    id_producto: number;
    nombre_producto: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    id_unidad_venta: number | null;
    nombre_unidad: string | null;
    sku_presentacion: string | null;
    fecha_compra: string;
    monto_total: number;
    folio: string | null;
    descripcion_compra: string | null;
    metodo_pago: number;
    metodo_pago_descripcion: string;
    nombre_usuario: string;
    nombre_sucursal: string;
    nombre_proveedor: string;
}