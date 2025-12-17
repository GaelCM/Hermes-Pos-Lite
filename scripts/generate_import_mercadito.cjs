const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// CONFIGURATION
const INPUT_FILE = 'C:\\Users\\GaelCM\\Desktop\\InventarioMiMercadito_ParaDB.xlsx';
const OUTPUT_FILE = 'import_mercadito.sql';
// TODO: VERIFICAR EL ID DE SUCURSAL CORRECTO PARA "MI MERCADITO"
// Asumimos 3 por ser diferente a El Amigo (2) y Vicka (1)
const SUCURSAL_ID = 3;

// Helper to clean strings
function cleanString(str) {
    if (!str) return '';
    return String(str).trim().replace(/'/g, "''"); // Escape single quotes for SQL
}

// Helper to clean numbers
function cleanNumber(val) {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(String(val).replace(/[^0-9.-]+/g, '')) || 0;
}

// Helper to find key case-insensitive
function findKey(row, keyName) {
    const keys = Object.keys(row);
    const key = keys.find(k => k.toLowerCase().trim() === keyName.toLowerCase().trim());
    return key ? row[key] : undefined;
}

function generateSQL() {
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`Error: File not found at ${INPUT_FILE}`);
        return;
    }

    console.log(`Reading Excel from: ${INPUT_FILE}`);
    const workbook = XLSX.readFile(INPUT_FILE);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Found ${data.length} rows.`);

    let sql = `DO $$\nDECLARE\n    cat_id INT;\n    prod_id INT;\n    unit_id INT;\n    sucursal_id INT := ${SUCURSAL_ID};\nBEGIN\n\n`;

    data.forEach((row, index) => {
        // Map Columns based on the ParaDB file structure
        const sku = cleanString(findKey(row, 'sku_pieza'));
        const nombre = cleanString(findKey(row, 'nombre_producto'));
        const costo = cleanNumber(findKey(row, 'precio_costo'));
        const precio = cleanNumber(findKey(row, 'precio_venta'));
        const mayoreo = cleanNumber(findKey(row, 'precio_mayoreo')); // Note: Check if column is 'P. Mayoreo' or 'precio_mayoreo'
        const stock = cleanNumber(findKey(row, 'cantidad_actual'));
        const minStock = cleanNumber(findKey(row, 'cantidad_minima'));
        const catId = cleanNumber(findKey(row, 'categoria'));

        if (!sku) return; // Skip empty rows

        // Handle inconsistent column names from the Python script
        // The python script output columns: sku_pieza, nombre_producto, precio_costo, precio_venta, P. Mayoreo, cantidad_actual, cantidad_minima, categoria
        // cleanNumber/cleanString helpers handle potential missing keys if we use findKey correctly.
        // Specifically for Mayoreo, the python script uses 'P. Mayoreo' or 'precio_mayoreo' depending on exact mapping (mapped to 'P. Mayoreo' in script).
        const mayoreoVal = findKey(row, 'P. Mayoreo') !== undefined ? cleanNumber(findKey(row, 'P. Mayoreo')) : cleanNumber(findKey(row, 'precio_mayoreo'));

        sql += `    -- Row ${index + 2}: ${sku} (${nombre})\n`;
        sql += `    \n`;

        // 1. Get or Create Product
        // Logic: If exists, use it. If not, insert it (Base Product).
        sql += `    -- 1. Get or Create Product\n`;
        sql += `    SELECT id_producto INTO prod_id FROM productos WHERE sku_pieza = '${sku}';\n`;
        sql += `    \n`;
        sql += `    IF prod_id IS NULL THEN\n`;
        sql += `        INSERT INTO productos (sku_pieza, nombre_producto, id_categoria, precio_costo) \n`;
        sql += `        VALUES ('${sku}', '${nombre}', ${catId}, ${costo}) \n`;
        sql += `        RETURNING id_producto INTO prod_id;\n`;
        sql += `    END IF;\n`;
        sql += `    \n`;

        // 2. Upsert Unit (Always Factor 1, SKU Presentacion = SKU Pieza)
        sql += `    -- 2. Upsert Unit (Factor: 1, SKU Presentacion: ${sku})\n`;
        sql += `    SELECT id_unidad_venta INTO unit_id FROM unidadesventa \n`;
        sql += `    WHERE id_producto = prod_id AND factor_conversion_cantidad = 1 \n`;
        sql += `    LIMIT 1;\n`;
        sql += `    \n`;
        sql += `    IF unit_id IS NULL THEN\n`;
        // Insert with sku_presentacion = sku_pieza
        sql += `        INSERT INTO unidadesventa (id_producto, nombre_presentacion, factor_conversion_cantidad, sku_presentacion) \n`;
        sql += `        VALUES (prod_id, 'Pieza', 1, '${sku}') \n`;
        sql += `        RETURNING id_unidad_venta INTO unit_id;\n`;
        sql += `    ELSE\n`;
        // Update existing unit to ensure sku_presentacion is set (optional, based on user request "o agregar")
        // User said: "si ya existe solo agregamos las unidsadesVenta y si no existe agregamos producto base y unidadesventa"
        // Also: "copiarlo en sku presentacion en todos los productos donde factor_conversion sea igual a 1" -> this implies we should ensure it matches.
        sql += `        UPDATE unidadesventa SET sku_presentacion = '${sku}' WHERE id_unidad_venta = unit_id;\n`;
        sql += `    END IF;\n`;
        sql += `    \n`;

        // 3. Upsert Price
        sql += `    -- 3. Upsert Price\n`;
        sql += `    IF EXISTS (SELECT 1 FROM precios WHERE id_unidad_venta = unit_id AND id_sucursal = sucursal_id) THEN\n`;
        sql += `        UPDATE precios SET precio_venta = ${precio}, precio_mayoreo = ${mayoreoVal} \n`;
        sql += `        WHERE id_unidad_venta = unit_id AND id_sucursal = sucursal_id;\n`;
        sql += `    ELSE\n`;
        sql += `        INSERT INTO precios (id_unidad_venta, id_sucursal, precio_venta, precio_mayoreo) \n`;
        sql += `        VALUES (unit_id, sucursal_id, ${precio}, ${mayoreoVal});\n`;
        sql += `    END IF;\n`;
        sql += `    \n`;

        // 4. Upsert Stock
        sql += `    -- 4. Upsert Stock\n`;
        sql += `    IF EXISTS (SELECT 1 FROM inventariostock WHERE id_producto = prod_id AND id_sucursal = sucursal_id) THEN\n`;
        sql += `        UPDATE inventariostock SET cantidad_actual = ${stock}, cantidad_minima = ${minStock} \n`;
        sql += `        WHERE id_producto = prod_id AND id_sucursal = sucursal_id;\n`;
        sql += `    ELSE\n`;
        sql += `        INSERT INTO inventariostock (id_producto, id_sucursal, cantidad_actual, cantidad_minima) \n`;
        sql += `        VALUES (prod_id, sucursal_id, ${stock}, ${minStock});\n`;
        sql += `    END IF;\n`;
        sql += `    \n`;
    });

    sql += `END $$;\n`;

    fs.writeFileSync(path.join(__dirname, '..', OUTPUT_FILE), sql);
    console.log(`Successfully generated ${OUTPUT_FILE} with ${data.length} items.`);
}

generateSQL();
