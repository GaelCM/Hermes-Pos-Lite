import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Define paths
const EXCEL_PATH = 'C:\\Users\\GaelCM\\Desktop\\InventarioElamigo_ParaDB.xlsx';
const OUTPUT_PATH = 'import_inventario.sql';

console.log(`Reading Excel from: ${EXCEL_PATH}`);

try {
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    console.log(`Found ${data.length} rows.`);
    if (data.length > 0) {
        console.log('Keys of row 0:', Object.keys(data[0]));
        console.log('Row 0 data:', data[0]);
    }

    let sql = `DO $$
DECLARE
    cat_id INT;
    prod_id INT;
    unit_id INT;
    sucursal_id INT := 2; -- El Amigo
BEGIN
`;

    // Normalization helper
    const cleanString = (str) => {
        if (!str) return '';
        return String(str).replace(/'/g, "''").trim();
    };

    const cleanNumber = (val) => {
        if (typeof val === 'string') {
            // Remove $ and ,
            const cleaned = val.replace(/[^0-9.-]/g, '');
            return parseFloat(cleaned) || 0;
        }
        return Number(val) || 0;
    };


    // Helper to find key case-insensitively
    const findKey = (obj, pattern) => {
        const keys = Object.keys(obj);
        return keys.find(k => k.toLowerCase().trim() === pattern.toLowerCase().trim());
    };

    // Helper to extract unit factor from name
    const extractFactor = (name) => {
        if (!name) return 1;
        const normalized = name.toLowerCase();

        // Patterns: "Con 12pz", "12 Pz", "15pz", "Con 6"
        const patterns = [
            /con\s+(\d+)\s*pz/i,      // "Con 12pz"
            /con\s+(\d+)\s*pieza/i,   // "Con 12 piezas"
            /(\d+)\s*pz/i,            // "12pz" or "12 pz"
            /(\d+)\s*pieza/i,         // "12 pieza"
            /con\s+(\d+)\s*$/i        // "Con 12" at end
        ];

        for (const regex of patterns) {
            const match = normalized.match(regex);
            if (match && match[1]) {
                const val = parseInt(match[1], 10);
                if (val > 1) return val;
            }
        }
        return 1;
    };

    data.forEach((row, index) => {
        // Find keys dynamically
        const keySku = findKey(row, 'sku_pieza') || 'sku_pieza';
        const keyNombre = findKey(row, 'nombre_producto') || 'nombre_producto';
        const keyCosto = findKey(row, 'precio_costo') || 'precio_costo';
        const keyVenta = findKey(row, 'precio_venta') || 'precio_venta';
        const keyMayoreo = findKey(row, 'P. Mayoreo') || 'P. Mayoreo';
        const keyCant = findKey(row, 'stock_inicial') || 'cantidad_actual';
        const keyMin = findKey(row, 'Inv. Mínimo') || 'cantidad_minima';
        const keyCat = findKey(row, 'nombre_categoria') || 'categoria';

        const sku = cleanString(row[keySku]);
        if (!sku) return; // Skip empty SKU

        const nombre = cleanString(row[keyNombre]);
        const costo = cleanNumber(row[keyCosto]);
        const venta = cleanNumber(row[keyVenta]);
        const mayoreo = cleanNumber(row[keyMayoreo]);
        const cantidad = cleanNumber(row[keyCant]);
        const minima = cleanNumber(row[keyMin]);

        // Category ID is now direct
        let catId = parseInt(row[keyCat], 10) || 1; // Default to 1 if parsing fails

        // Determine Unit
        const factor = extractFactor(nombre);
        const unitName = factor > 1 ? 'PAQUETE' : 'Pieza';


        sql += `
    -- Row ${index + 2}: ${sku} (${nombre}) - [Factor: ${factor}]
    
    -- 1. Get or Create Product
    SELECT id_producto INTO prod_id FROM productos WHERE sku_pieza = '${sku}';
    
    IF prod_id IS NULL THEN
        INSERT INTO productos (sku_pieza, nombre_producto, id_categoria, precio_costo) 
        VALUES ('${sku}', '${nombre}', ${catId}, ${costo}) 
        RETURNING id_producto INTO prod_id;
    END IF;

    -- 2. Get or Create Unit '${unitName}' (Factor: ${factor})
    -- Logic: If 'Pieza', look for standard piece. If 'PAQUETE', look for specific factor.
    IF ${factor} = 1 THEN
        SELECT id_unidad_venta INTO unit_id FROM unidadesventa 
        WHERE id_producto = prod_id AND (LOWER(nombre_presentacion) = 'pieza' OR factor_conversion_cantidad = 1) 
        LIMIT 1;
    ELSE
        SELECT id_unidad_venta INTO unit_id FROM unidadesventa 
        WHERE id_producto = prod_id AND LOWER(nombre_presentacion) = 'paquete' AND factor_conversion_cantidad = ${factor} 
        LIMIT 1;
    END IF;
    
    IF unit_id IS NULL THEN
        INSERT INTO unidadesventa (id_producto, nombre_presentacion, factor_conversion_cantidad) 
        VALUES (prod_id, '${unitName}', ${factor}) 
        RETURNING id_unidad_venta INTO unit_id;
    END IF;

    -- 3. Upsert Price for Branch 2
    IF EXISTS (SELECT 1 FROM precios WHERE id_unidad_venta = unit_id AND id_sucursal = sucursal_id) THEN
        UPDATE precios SET precio_venta = ${venta}, precio_mayoreo = ${mayoreo} 
        WHERE id_unidad_venta = unit_id AND id_sucursal = sucursal_id;
    ELSE
        INSERT INTO precios (id_unidad_venta, id_sucursal, precio_venta, precio_mayoreo) 
        VALUES (unit_id, sucursal_id, ${venta}, ${mayoreo});
    END IF;

    -- 4. Upsert Stock for Branch 2
    IF EXISTS (SELECT 1 FROM inventariostock WHERE id_producto = prod_id AND id_sucursal = sucursal_id) THEN
        UPDATE inventariostock SET cantidad_actual = ${cantidad}, cantidad_minima = ${minima} 
        WHERE id_producto = prod_id AND id_sucursal = sucursal_id;
    ELSE
        INSERT INTO inventariostock (id_producto, id_sucursal, cantidad_actual, cantidad_minima) 
        VALUES (prod_id, sucursal_id, ${cantidad}, ${minima});
    END IF;
`;
    });

    sql += `
END $$;
`;

    fs.writeFileSync(OUTPUT_PATH, sql);
    console.log(`Successfully generated ${OUTPUT_PATH} with ${data.length} items.`);

} catch (error) {
    console.error("Error generating SQL:", error);
}
