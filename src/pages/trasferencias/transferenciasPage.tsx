import { useCurrentUser } from "@/contexts/currentUser"
import { ArrowRightLeft, Plus } from "lucide-react";
import { Link } from "react-router";
import MisTransferencias from "./components/misTransferencia";
import "./transferencias.css";

export default function TransferenciasPage() {

    const { user } = useCurrentUser();

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen transferencias-container p-4 md:p-8 text-black">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Aero Header Card */}
                <div className="aero-card overflow-hidden">
                    <div className="gradient-header flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4 text-black">
                            <div className="w-14 h-14 header-icon-box rounded-2xl flex items-center justify-center text-white">
                                <ArrowRightLeft className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                    Transferencias
                                </h1>
                                <p className="text-slate-600 font-bold text-sm">
                                    {user.id_rol === 1
                                        ? 'Vista Administrativa Principal'
                                        : `Movimientos de Sucursal: ${user.sucursal}`
                                    }
                                </p>
                            </div>
                        </div>

                        <Link
                            to="/transferencias/nueva"
                            className="btn-nueva flex items-center gap-2 px-6 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="text-sm font-black uppercase">Nueva Transferencia</span>
                        </Link>
                    </div>

                    <div className="p-2">
                        <MisTransferencias />
                    </div>
                </div>
            </div>
        </div>
    )
}