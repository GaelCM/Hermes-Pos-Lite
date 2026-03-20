import { useCurrentUser } from "@/contexts/currentUser"
import { ArrowRightLeft, Plus } from "lucide-react";
import { Link } from "react-router";
import MisTransferencias from "./components/misTransferencia";
import "./transferencias.css";

export default function TransferenciasPage() {

    const { user } = useCurrentUser();

    if (!user) {
        return (
            <div className="mtf-loading-screen">
                <div className="mtf-spinner-huge"></div>
            </div>
        )
    }

    return (
        <div className="mtf-page-root">
            {/* Header / Nav de Transferencias */}
            <header className="mtf-header-bar">
                <div className="mtf-header-left">
                    <div className="mtf-header-icon">
                        <ArrowRightLeft size={32} />
                    </div>
                    <div className="mtf-header-text">
                        <h1 className="mtf-title">Operaciones de Transferencia</h1>
                        <p className="mtf-subtitle">
                            {user.id_rol === 1
                                ? 'Panel de Administración Principal'
                                : `Sucursal Activa: ${user.sucursal}`
                            }
                        </p>
                    </div>
                </div>

                <div className="mtf-header-right">
                    <Link to="/transferencias/nueva" className="mtf-btn-primary">
                        <Plus size={20} />
                        Nueva Transferencia
                    </Link>
                </div>
            </header>

            {/* Contenedor principal 100% width */}
            <main className="mtf-main-content">
                <MisTransferencias />
            </main>
        </div>
    )
}