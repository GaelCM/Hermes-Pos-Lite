import { Calendar, ChevronDown, DollarSign, FileText, Menu, Package, Settings, TrendingUp } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

import { Link, Outlet, useNavigate } from "react-router";
import { useCurrentUser } from "@/contexts/currentUser";
import { useHotkeys } from "react-hotkeys-hook";
import { useState } from "react";
import DialogProducto from "./dialogProductos";
import "./navbar.css";

type navBarProps = {
  sidebarOpen: boolean,
  setSidebarOpen: (open: boolean) => void;
}

export default function NavBar({ setSidebarOpen }: navBarProps) {
  const { user } = useCurrentUser();
  const [openP, setOpenP] = useState(false);
  const [focusScanner, setFocusScanner] = useState<() => void>(() => { });
  const navigate = useNavigate();

  const openDialog = () => { setOpenP(true) }
  const moverAInventario = () => { navigate("/productos") }
  const verMisVentas = () => { navigate("/reportes/misVentas") }

  useHotkeys('F10', () => { setOpenP(true) }, { enableOnFormTags: true }, [setOpenP]);
  useHotkeys('F4', (event) => {
    event.preventDefault()
    moverAInventario()
  }, { enableOnFormTags: true }, [moverAInventario]);

  return (
    <>
      <div className="app-main-layout">
        <header className="aero-navbar">
          <div className="navbar-left">
            <button className="hamburger-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="navbar-branch-info">
              <span className="navbar-branch-title">Sucursal : {user?.sucursal}</span>
            </div>
          </div>

          <div className="navbar-actions">
            {user?.id_rol === 1 && (
              <button className="aero-nav-button nav-btn-inventory" onClick={moverAInventario}>
                <Package className="w-4 h-4" />
                Inventario (F4)
              </button>
            )}

            <button className="aero-nav-button nav-btn-sales" onClick={verMisVentas}>
              <TrendingUp className="w-4 h-4" />
              Ventas de hoy
            </button>

            <button className="aero-nav-button aero-nav-button-primary" onClick={openDialog}>
              Buscar Producto (F10)
            </button>

            <div className="status-badge">
              <div className="status-dot pulse" />
              ONLINE
            </div>

            {user?.id_rol === 1 && (
              <div className="nav-reports-dropdown">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="aero-dropdown-trigger">
                      <FileText className="w-4 h-4" />
                      Reportes
                      <ChevronDown className="w-3 h-3" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Ventas</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link to={"reportes/ventasGeneral"} className="flex items-center gap-2 w-full">
                        <Calendar className="w-4 h-4 text-blue-500" /> Ventas Generales
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link to={"reportes/ventasPorMes"} className="flex items-center gap-2 w-full">
                        <Calendar className="w-4 h-4 text-purple-500" /> Por Mes
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Egresos</DropdownMenuLabel>
                    <DropdownMenuItem>
                      <Link to={"reportes/misEgresos"} className="flex items-center gap-2 w-full">
                        <DollarSign className="w-4 h-4 text-orange-500" /> Mis Egresos
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Gestión</DropdownMenuLabel>
                    <DropdownMenuItem>
                      <Link to={"reportes/stockBajo"} className="flex items-center gap-2 w-full">
                        <TrendingUp className="w-4 h-4 text-red-500" /> Stock Bajo
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link to={"reportes/misCortes"} className="flex items-center gap-2 w-full">
                        <TrendingUp className="w-4 h-4 text-green-500" /> Cortes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link to={"/creditos"} className="flex items-center gap-2 w-full">
                        <TrendingUp className="w-4 h-4 text-indigo-500" /> Créditos
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <Link to={"/configuraciones"} className="config-icon-link">
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </header>

        <main className="content-outlet-area">
          <Outlet context={{ setFocusScanner }} />
        </main>
      </div>

      <DialogProducto
        isOpen={openP}
        setIsOpen={(open) => {
          setOpenP(open);
          if (!open) focusScanner();
        }}
        idSucursal={user.id_sucursal}
      />
    </>
  )
}
