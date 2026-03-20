import { useCurrentUser } from "@/contexts/currentUser";
import { Reloj } from "./components/reloj";
import logo from "@/assets/banner.png";
import { ShoppingBag, Tag } from "lucide-react";
import { useState } from "react";
import DialogNuevoTurno from "./components/dialogNuevoTurno";
import { existCorteApi } from "@/api/cortesApi/cortesApi";
import { toast } from "sonner";
import "./bienvenida.css";

interface BienvenidaProps {
    onCajaOpened: () => void;
}

export default function Bienvenida({ onCajaOpened }: BienvenidaProps) {
    const { user } = useCurrentUser();
    const [isOpen, setIsOpen] = useState(false);

    const handleAbrirCaja = async () => {
        const res = await existCorteApi(user.id_usuario!, user.id_sucursal!);
        if (res.data.existe) {
            // @ts-ignore
            const api = window["electron-api"];
            await api?.setConfig("open_caja", res.data);
            localStorage.setItem("openCaja", JSON.stringify(res.data));
            onCajaOpened();
            toast.success("Caja abierta");
            const printerName = await api?.getConfig("printer_device");
            if (printerName) {
                // @ts-ignore
                api?.openCashDrawer(printerName);
            }
        } else {
            setIsOpen(true);
        }
    };

    return (
        <div className="bv-page">
            <div className="bv-card">

                {/* ======== LEFT PANEL ======== */}
                <div className="bv-left">
                    {/* Decorative background icon */}
                    <div className="bv-left-bg-icon">
                        <ShoppingBag size={400} color="#ffffff" />
                    </div>

                    {/* Top content */}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div className="bv-pill">
                            <Tag size={13} />
                            <span>Hola</span>
                        </div>
                        <h2 className="bv-left-title">
                            ¡Sistema <br />
                            <span>{user.sucursal}!</span>
                        </h2>
                        <p className="bv-left-subtitle">
                            Bienvenido, <strong>{user?.usuario}</strong>
                        </p>
                    </div>

                    {/* Logo / promo image */}
                    <div className="bv-logo-wrap">
                        <img src={logo} alt="Promo" className="bv-logo-img" />
                        <div className="bv-price-badge">
                            <span>Solo</span>
                            <span>$45</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bv-left-footer">
                        <p>*Aplican restricciones. Válido hasta agotar existencias. Consulte términos en caja.</p>
                    </div>
                </div>

                {/* ======== RIGHT PANEL ======== */}
                <div className="bv-right">
                    {/* Status bar */}
                    <div className="bv-status-bar">
                        <div className="bv-status-dot" />
                        <span className="bv-status-text">Caja Cerrada · En Línea</span>
                    </div>

                    {/* Center content */}
                    <div className="bv-center">
                        {/* Reloj */}
                        <div className="bv-clock-wrap">
                            <Reloj />
                        </div>

                        {/* Greeting */}
                        <div className="bv-greeting">
                            <div className="bv-greeting-hi">Hola de nuevo,</div>
                            <div className="bv-greeting-name">{user?.usuario || "Operador"}</div>
                        </div>

                        {/* CTA */}
                        <button className="bv-btn-caja" onClick={handleAbrirCaja}>
                            Iniciar Turno
                        </button>
                    </div>

                    {/* Footer label */}
                    <div className="bv-footer-label">
                        Sistema de Punto de Venta · El Amigo
                    </div>
                </div>
            </div>

            <DialogNuevoTurno isOpen={isOpen} onOpenChange={setIsOpen} onCajaOpened={onCajaOpened} />
        </div>
    );
}