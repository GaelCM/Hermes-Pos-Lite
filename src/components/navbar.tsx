import { Calendar, ChevronDown,FileText, Menu, Package, Search,  TrendingUp, Users, Wifi } from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

import { Outlet, useNavigate } from "react-router";
import { useCurrentUser } from "@/contexts/currentUser";
import { useHotkeys } from "react-hotkeys-hook";
import { useState } from "react";
import DialogProducto from "./dialogProductos";

type navBarProps={
    sidebarOpen:boolean,
    setSidebarOpen:(open: boolean) => void;
}

export default function NavBar({setSidebarOpen}:navBarProps){ 
    const {user}=useCurrentUser();
    const navigate=useNavigate();
    const [openP,setOpenP]=useState(false);
    const [focusScanner, setFocusScanner] = useState<() => void>(() => {});
    
    useHotkeys('alt+F11', () => {
        console.log("Atajo Alt+F11 presionado desde react-hotkeys-hook");
        setOpenP(true)
        },{
            enableOnFormTags:true
        }, [setOpenP]); // El array de dependencias es opcional pero recomendado
    

    const openDialog=()=>{
      setOpenP(true)
      
    }

    return(
        <>
            <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
              <div className="min-w-0">
                
                <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">
                  Sistema de gestión farmacéutica
                </p>

                <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">
                  {user.sucursal}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" color="white" />
                <Button variant={"default"} className="px-10 cursor-pointer" onClick={openDialog}>Buscar Producto (alt+f11)</Button>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-1 text-xs lg:text-sm text-muted-foreground">
                  <Wifi className="w-3 h-3 lg:w-4 lg:h-4 text-green-500" />
                  <span>Online</span>
                </div>
                
              </div>

              <div className="hidden lg:flex items-center gap-4">
                {/* Dropdown de Reportes */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-transparent">
                      <FileText className="w-4 h-4" />
                      Reportes
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Reportes de Ventas</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2" onClick={()=>{navigate("/reportes?idReporte=1")}}>
                      <Calendar className="w-4 h-4" />
                      Por Mes
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={()=>{navigate("/reportes?idReporte=2")}}>
                      <Package className="w-4 h-4" />
                      Por Productos
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={()=>{navigate("/reportes?idReporte=3")}}>
                      <Users className="w-4 h-4" />
                      Por Cliente
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Reportes de Inventario</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Stock Bajo
                    </DropdownMenuItem>
                    
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Dropdown de Período */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-transparent">
                      <Calendar className="w-4 h-4" />
                      Este Mes
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={()=>{console.log(1)}}>Hoy</DropdownMenuItem>
                    <DropdownMenuItem>Esta Semana</DropdownMenuItem>
                    <DropdownMenuItem>Este Mes</DropdownMenuItem>
                    <DropdownMenuItem>Último Trimestre</DropdownMenuItem>
                    <DropdownMenuItem>Este Año</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="mt-3 sm:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" color="white" />
                <Button variant={"default"} className="px-10 cursor-pointer">Buscar Producto (alt+f11)</Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 bg-card overflow-auto">
          <Outlet context={{setFocusScanner}}></Outlet>
        </main>
       

      </div>

      <DialogProducto isOpen={openP} setIsOpen={(open) => {
        setOpenP(open);
        if (!open) focusScanner(); // 👈 AQUI
        }} idSucursal={user.id_sucursal}></DialogProducto>
        </>
    )
}