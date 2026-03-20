import { AlertTriangle } from "lucide-react";
import "./dialogTransferencias.css";

interface DialogConfirmarCancelacionProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onConfirm: () => void;
    idTransferencia: number;
    loading?: boolean;
}

export default function DialogConfirmarCancelacion({
    isOpen,
    setIsOpen,
    onConfirm,
    idTransferencia,
    loading = false,
}: DialogConfirmarCancelacionProps) {
    if (!isOpen) return null;

    return (
        <div className="dtf-overlay" onClick={() => !loading && setIsOpen(false)}>
            <div className="dtf-dialog dtf-dialog-sm" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="dtf-header">
                    <div className="dtf-header-row">
                        <div className="dtf-icon-wrap red">
                            <AlertTriangle size={20} color="#dc2626" />
                        </div>
                        <div>
                            <div className="dtf-title red">Confirmar Cancelación</div>
                        </div>
                    </div>
                    <div className="dtf-desc">
                        ¿Estás seguro de que deseas cancelar la <strong>Transferencia #{idTransferencia}</strong>?
                    </div>
                </div>

                {/* Body */}
                <div className="dtf-body">
                    <div className="dtf-warning">
                        <p>
                            <strong>Atención:</strong> Si la transferencia ya fue enviada, el stock se devolverá
                            automáticamente a la sucursal de origen. Esta acción no se puede deshacer.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="dtf-footer">
                    <button
                        className="dtf-btn dtf-btn-outline"
                        onClick={() => setIsOpen(false)}
                        disabled={loading}
                    >
                        No, volver
                    </button>
                    <button
                        className="dtf-btn dtf-btn-red"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="dtf-spinner" style={{ width: 18, height: 18, borderWidth: 3 }} />
                                Cancelando...
                            </>
                        ) : (
                            "Sí, cancelar transferencia"
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
