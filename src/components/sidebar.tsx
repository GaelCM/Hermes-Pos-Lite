import * as LucideIcons from "lucide-react";
import { Plus, X, Lock, LogOut } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router"
import { useHotkeys } from "react-hotkeys-hook";
import AddCliente from "./dialogAddCliente";
import { useCurrentUser } from "@/contexts/currentUser";
import logo from "../assets/logo.jpg";
import { useListaProductos } from "@/contexts/listaProductos";
import "./sidebar.css";

type sideBarProps = {
    sidebarOpen: boolean,
    setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ setSidebarOpen, sidebarOpen }: sideBarProps) {
    const { user } = useCurrentUser();
    const { carritoActivo, asignarClienteCarrito } = useListaProductos();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setOpen] = useState(false);
    const rutaActual = location.pathname;

    useHotkeys('f1', (e) => {
        e.preventDefault();
        navigate("/");
    }, { enableOnFormTags: true });

    const fallbackIconMap: Record<string, string> = {
        "Dashboard": "Home",
        "Transferencias": "ArrowRightLeft",
        "Sucursales": "Store",
        "Categorias": "Layers",
        "Egresos": "DollarSign",
        "Mis Ventas": "FileText",
        "Proveedores": "Truck",
        "Productos": "Package",
        "Usuarios": "Users",
        "Configuracion": "Settings"
    };

    const sidebarItemsFiltrados = (user?.permisos || []).map((permiso) => {
        let iconName = (permiso.icon || "").trim();
        if (!iconName) {
            iconName = fallbackIconMap[permiso.nombre_menu] || "Home";
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allIcons = LucideIcons as any;
        let Icon = allIcons[iconName];

        if (!Icon) {
            const lowerName = iconName.toLowerCase();
            const matchingKey = Object.keys(allIcons).find(key => key.toLowerCase() === lowerName);
            if (matchingKey) Icon = allIcons[matchingKey];
        }

        if (!Icon) Icon = LucideIcons.Home;

        return {
            id: permiso.id_menu,
            label: permiso.nombre_menu,
            icon: Icon,
            ruta: permiso.ruta,
        };
    });

    return (
        <>
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={`aero-sidebar ${sidebarOpen ? "open" : "closed"}`}>
                <div className="sidebar-logo-container">
                    <img src={logo} alt="Logo" className="sidebar-logo" />
                    <button className="close-sidebar-mobile" onClick={() => setSidebarOpen(false)}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="sidebar-scroll-content">
                    <button className="new-sale-btn" onClick={() => navigate("/")}>
                        <Plus className="w-5 h-5" />
                        <span>Nueva Venta (F1)</span>
                    </button>

                    <nav className="aero-nav-list">
                        {sidebarItemsFiltrados.map((item) => {
                            const Icon = item.icon;
                            const isActive = rutaActual === item.ruta;
                            return (
                                <Link
                                    key={item.id}
                                    to={item.ruta}
                                    onClick={() => {
                                        if (window.innerWidth < 768) {
                                            setSidebarOpen(false);
                                        }
                                    }}
                                    className={`aero-nav-item ${isActive ? 'active' : ''}`}
                                >
                                    <Icon className="aero-nav-item-icon" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="sidebar-footer">
                    <div className="user-profile-mini">
                        <div className="user-avatar-circle">
                            {user?.usuario?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="user-info-text">
                            <span className="user-name-label">{user?.usuario}</span>
                            <span className="user-role-label">{user?.rol}</span>
                        </div>
                    </div>

                    <div className="footer-actions">
                        <button className="aero-footer-btn btn-close-box" onClick={() => navigate("/cerrar-caja")}>
                            <Lock className="w-4 h-4" />
                            <span>Cerrar Caja</span>
                        </button>
                        <button className="aero-footer-btn btn-logout" onClick={() => {
                            if (localStorage.getItem("openCaja") != null) {
                                navigate("/cerrar-caja");
                                return;
                            }
                            localStorage.removeItem("tkn");
                            localStorage.removeItem("currentUser");
                            localStorage.removeItem("openCaja");
                            navigate("/login");
                        }}>
                            <LogOut className="w-4 h-4" />
                            <span>Salir</span>
                        </button>
                    </div>
                </div>
            </aside>

            <AddCliente
                isOpen={isOpen}
                setIsOpen={setOpen}
                onSelect={(selectedCliente) => {
                    if (carritoActivo) {
                        asignarClienteCarrito(carritoActivo, selectedCliente);
                    }
                }}
            />
        </>
    )
}
