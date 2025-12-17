import { useEffect, useState } from "react";
import { Check, Printer, RefreshCw } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// Definimos la interfaz para lo que nos devuelve Electron
interface ElectronPrinter {
    name: string;
    displayName: string;
    description: string;
    status: number;
    isDefault: boolean;
    options: any;
}

export function ListPrints() {
    const [printers, setPrinters] = useState<ElectronPrinter[]>([]);
    const [selectedPrinter, setSelectedPrinter] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const fetchPrinters = async () => {
        setLoading(true);
        try {
            // @ts-ignore - Accedemos al API expuesto en preload
            const api = window["electron-api"];

            if (api && api.listPrints) {
                const list = await api.listPrints();
                console.log("Impresoras encontradas:", list);
                setPrinters(list);

                // Lógica de selección inicial:
                // 1. Buscamos si ya guardamos una en localStorage
                const savedPrinter = localStorage.getItem("printer_device");

                // 2. Verificamos que la guardada aún exista
                const printerExists = list.find((p: any) => p.name === savedPrinter);

                if (savedPrinter && printerExists) {
                    setSelectedPrinter(savedPrinter);
                } else {
                    // 3. Si no, usamos la default del sistema
                    const systemDefault = list.find((p: any) => p.isDefault);
                    if (systemDefault) {
                        setSelectedPrinter(systemDefault.name);
                        localStorage.setItem("printer_device", systemDefault.name);
                    }
                }
            } else {
                console.warn("API de electron no encontrada. ¿Estás en el navegador?");
            }
        } catch (error) {
            console.error("Error al cargar impresoras:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrinters();
    }, []);


    const handlePrinterChange = (value: string) => {
        setSelectedPrinter(value);
        localStorage.setItem("printer_device", value);
    };

    const handleTestPrint = async () => {
        if (!selectedPrinter) return;

        const testHtml = `
            <div style="font-family: monospace; width: 100%; text-align: center; font-size: 12px;">
                <h3>PRUEBA DE IMPRESION</h3>
                <p>--------------------------------</p>
                <p>Si puedes leer esto,</p>
                <p>la impresora funciona correctamente.</p>
                <p>--------------------------------</p>
                <p>El Amigos POS</p>
                <br/><br/>.
            </div>
        `;

        try {
            // @ts-ignore
            await window["electron-api"]?.printTicket({
                content: testHtml,
                printerName: selectedPrinter
            });
        } catch (error) {
            console.error("Error imprimiendo:", error);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-md">
            <CardHeader className="bg-muted/50 pb-4">
                <div className="flex items-center gap-2">
                    <Printer className="h-5 w-5 text-primary" />
                    <CardTitle>Configuración de Impresora</CardTitle>
                </div>
                <CardDescription>
                    Selecciona la impresora para los tickets de venta.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="printer-select">Impresora disponible</Label>
                    <div className="flex gap-2">
                        <Select
                            value={selectedPrinter}
                            onValueChange={handlePrinterChange}
                            disabled={loading}
                        >
                            <SelectTrigger id="printer-select" className="w-full">
                                <SelectValue placeholder="Seleccionar impresora..." />
                            </SelectTrigger>
                            <SelectContent>
                                {printers.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                        No se encontraron impresoras
                                    </div>
                                ) : (
                                    printers.map((printer) => (
                                        <SelectItem key={printer.name} value={printer.name}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{printer.displayName || printer.name}</span>
                                                {printer.description && (
                                                    <span className="text-xs text-muted-foreground">{printer.description}</span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchPrinters}
                            disabled={loading}
                            title="Recargar lista"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900 border border-blue-100 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 text-blue-600" />
                        <p>
                            Impresora seleccionada: <strong>{selectedPrinter || "Ninguna"}</strong>
                            <br />
                            <span className="text-xs text-blue-700 opacity-80">
                                Esta configuración se guardará automáticamente para esta terminal.
                            </span>
                        </p>
                    </div>

                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-full mt-2"
                        onClick={handleTestPrint}
                        disabled={!selectedPrinter || loading}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir Ticket de Prueba
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
