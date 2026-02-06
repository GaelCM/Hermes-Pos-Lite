import { useCurrentUser } from "@/contexts/currentUser"
import { Package, Plus } from "lucide-react";
import { Link } from "react-router";
import MisTransferencias from "./components/misTransferencia";
import "./transferencias.css";

export default function TransferenciasPage() {

    const { user } = useCurrentUser();

    if (!user) {
        return <div>error</div>
    }

    return (
        <div className="transferencias-page">
            <div className="transferencias-header">
                <div className="transferencias-header-content">
                    <Package className="w-8 h-8 text-primary" />
                    <h1 className="transferencias-title">
                        Transferencias de Productos
                    </h1>
                </div>
            </div>

            <div className="transferencias-actions">
                <Link to={"/transferencias/nueva"} className="action-btn btn-primary shadow-md hover:shadow-lg h-10 px-4 py-2 rounded-md">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Transferencia
                </Link>
            </div>

            <div>
                <MisTransferencias />
            </div>

        </div>
    )
}