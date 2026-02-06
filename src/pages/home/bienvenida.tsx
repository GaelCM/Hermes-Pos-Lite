import { useCurrentUser } from "@/contexts/currentUser"
import { Reloj } from "./components/reloj";
import logo from "@/assets/banner.png"
import { ShoppingBag, Tag, Store } from "lucide-react";
import { useState } from "react";
import DialogNuevoTurno from "./components/dialogNuevoTurno";
import { existCorteApi } from "@/api/cortesApi/cortesApi";
import { toast } from "sonner";

interface BienvenidaProps {
    onCajaOpened: () => void;
}

export default function Bienvenida({ onCajaOpened }: BienvenidaProps) {

    const { user } = useCurrentUser();
    const [isOpen, setIsOpen] = useState(false);

    const handleAbrirCaja = async () => {

        const res = await existCorteApi(user.id_usuario!, user.id_sucursal!);
        if (res.data.existe) {
            localStorage.setItem("openCaja", JSON.stringify(res.data));
            onCajaOpened();
            toast.success("Caja abierta");
        } else {
            setIsOpen(true);
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center p-6 animate-in fade-in duration-700">

            <div className="w-full max-w-7xl h-[80vh] bg-card rounded-3xl shadow-2xl overflow-hidden flex ring-1 ring-border relative">

                {/* Left Side - Publicidad / Digital Signage - Ahora usando Primary (Violeta) */}
                <div className="w-1/3 bg-primary relative flex flex-col justify-between text-primary-foreground p-8 overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute -top-20 -right-20 opacity-10">
                        <ShoppingBag size={400} />
                    </div>

                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

                    {/* Header Promoción */}
                    <div className="z-10 pt-4">
                        <div className="inline-flex items-center gap-2 bg-white/10 text-primary-foreground px-4 py-1.5 rounded-full font-bold text-xs tracking-wider uppercase mb-6 shadow-md backdrop-blur-md border border-white/20">
                            <Tag size={14} />
                            <span>Bienvenido</span>
                        </div>
                        <h2 className="text-4xl font-extrabold leading-tight mb-4 tracking-tight drop-shadow-sm">
                            Sistema <br /><span className="text-chart-4">{user.sucursal}!</span>
                        </h2>
                        <p className="text-primary-foreground/90 text-lg font-medium leading-relaxed">
                            Bienvenido, <span className="font-bold border-b-2 border-chart-4/50">{user?.usuario}</span>
                        </p>
                    </div>

                    {/* Featured Product Image Layout */}
                    <div className="z-10 relative flex-1 flex items-center justify-center my-4 group cursor-pointer">
                        <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-500 scale-75" />
                        <img
                            src={logo}
                            alt="Brand Logo"
                            className="relative w-[85%] object-contain drop-shadow-2xl transform group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                    </div>

                    {/* Footer Legal */}
                    <div className="z-10 text-center border-t border-white/10 pt-4">
                        <p className="text-primary-foreground/70 text-xs font-medium">
                            *Sistema optimizado para alto rendimiento y estabilidad.
                        </p>
                    </div>
                </div>

                {/* Right Side - System Interaction */}
                <div className="w-2/3 flex flex-col items-center justify-center relative bg-muted/30">
                    {/* Status Bar */}
                    <div className="absolute top-6 right-6 flex items-center gap-3">
                        <div className="px-4 py-1.5 bg-background rounded-full border border-border shadow-sm flex items-center gap-2.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse shadow-[0_0_8px] shadow-destructive/50"></div>
                            <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Caja Cerrada</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-10 z-10 w-full max-w-md">
                        {/* Clock Container */}
                        <div className="transform scale-110 mb-2 text-foreground/80 bg-background/50 p-4 rounded-2xl border border-border/50 shadow-sm backdrop-blur-sm">
                            <Reloj />
                        </div>

                        <div className="text-center space-y-3">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
                                <Store size={32} />
                            </div>
                            <h1 className="text-2xl font-medium text-muted-foreground">
                                Hola de nuevo,
                            </h1>
                            <h2 className="text-5xl font-black text-foreground tracking-tight">
                                {user?.usuario || "Operador"}
                            </h2>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                Listo para comenzar un nuevo turno de ventas.
                            </p>
                        </div>

                        <button
                            onClick={handleAbrirCaja}
                            className="mt-4 group relative w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 ease-out transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <span className="relative flex items-center justify-center gap-3 font-bold text-lg tracking-wide uppercase">
                                Iniciar Turno
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right group-hover:translate-x-1 transition-transform"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                            </span>
                        </button>
                    </div>

                    <div className="absolute bottom-6 text-muted-foreground/40 text-[10px] font-mono tracking-widest uppercase flex items-center gap-2">
                        <span>Hermes POS Lite</span>
                        <span className="w-1 h-1 rounded-full bg-current" />
                        <span>v3.0.0</span>
                    </div>
                </div>
            </div>
            <DialogNuevoTurno isOpen={isOpen} onOpenChange={setIsOpen} onCajaOpened={onCajaOpened} />
        </div>
    )
}