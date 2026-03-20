import type { Cliente } from "@/types/Cliente";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search, UserPlus, Check, Phone, MapPin, RefreshCcw, Plus } from "lucide-react";
import { useCliente } from "@/contexts/globalClient";
import { getClientes } from "@/api/clientesApi/clientesApi";
import { toast } from "sonner";
import DialogCreateCliente from "./dialogCreateCliente";
import "./add-cliente-dialog.css";

type props = {
  isOpen: boolean,
  setIsOpen: (isOpen: boolean) => void,
  inputRef?: React.RefObject<{ focus: () => void } | null>;
  onSelect?: (cliente: Cliente) => void;
}

export default function AddCliente({ isOpen, setIsOpen, inputRef, onSelect }: props) {
  const { addCliente } = useCliente();
  const [searchTerm, setSearchTerm] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  // Estado para la navegación por teclado
  const [selectedIndex, setSelectedIndex] = useState(0);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await getClientes();
      if (res.success) {
        setClientes(res.data);
      } else {
        toast.error("Error al cargar clientes", { description: res.message });
      }
    } catch (error) {
      console.error("Error fetching clientes:", error);
      toast.error("Error de conexión al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchClientes();
      // Resetear búsqueda y selección al abrir
      setSearchTerm("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filtrado local para la búsqueda rápida
  const filteredClientes = clientes.filter(c =>
    c.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefono.includes(searchTerm) ||
    c.id_cliente.toString().includes(searchTerm)
  );

  // Resetear selección cuando cambia la búsqueda
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  const handleSelect = (cliente: Cliente) => {
    if (onSelect) {
      onSelect(cliente);
    } else {
      addCliente(cliente);
    }
    setIsOpen(false);
    setSearchTerm("");
    setTimeout(() => {
      inputRef?.current?.focus();
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Importante: Detener propagación para evitar conflicto con Caja.tsx
    e.stopPropagation();

    if (filteredClientes.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredClientes.length - 1));

      // Scroll automático
      const nextIndex = Math.min(selectedIndex + 1, filteredClientes.length - 1);
      document.getElementById(`cliente-row-${nextIndex}`)?.scrollIntoView({ block: 'nearest' });

    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));

      // Scroll automático
      const prevIndex = Math.max(selectedIndex - 1, 0);
      document.getElementById(`cliente-row-${prevIndex}`)?.scrollIntoView({ block: 'nearest' });

    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredClientes[selectedIndex];
      if (selected) {
        handleSelect(selected);
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          setIsOpen(false);
          setSearchTerm("");
          setTimeout(() => {
            inputRef?.current?.focus();
          }, 100);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl border-none add-cliente-container">
          <DialogHeader className="p-6 pb-2 bg-slate-50 border-b border-slate-100 pr-12">
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="text-xl flex items-center gap-2 font-black text-slate-800">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Seleccionar Cliente
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenCreate(true)}
                  className="h-8 rounded-full border-blue-200 hover:bg-blue-50 text-blue-600 transition-all font-black uppercase text-[10px] gap-1 px-4"
                >
                  <Plus className="w-3 h-3" />
                  Nuevo
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchClientes}
                  disabled={loading}
                  className="h-8 w-8 rounded-full text-slate-400"
                >
                  <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-4 border-b bg-white sticky top-0 z-10">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="Buscar cliente... (↑ ↓ Enter para escoger)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-12 h-12 text-base rounded-xl border-2 search-input-aero"
                autoFocus
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {loading && clientes.length === 0 ? (
              <div className="py-20 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Sincronizando clientes...</p>
              </div>
            ) : (
              <div className="grid gap-2 text-slate-700">
                {filteredClientes.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto opacity-50">
                      <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-black uppercase text-xs tracking-widest">No hay resultados</p>
                    <Button variant="link" onClick={() => setSearchTerm("")} className="text-blue-600 font-bold">
                      Limpiar Filtros
                    </Button>
                  </div>
                ) : (
                  filteredClientes.map((c, index) => (
                    <button
                      key={c.id_cliente}
                      id={`cliente-row-${index}`}
                      onClick={() => handleSelect(c)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all text-left btn-cliente-row
                        ${index === selectedIndex ? 'selected' : ''}`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <p className="font-black text-lg leading-tight truncate m-0">
                          {c.nombre_cliente}
                        </p>

                        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded id-badge bg-slate-100 text-slate-500">
                            ID: {c.id_cliente}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400 px-2 py-0.5">
                            <Phone className="w-3 h-3 icon-subtle" />
                            {c.telefono || "S/N"}
                          </span>
                        </div>

                        {c.direccion && (
                          <div className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold bg-slate-50 text-slate-500 italic address-box">
                            <MapPin className="w-3 h-3 shrink-0 icon-subtle" />
                            <span className="truncate">{c.direccion}</span>
                          </div>
                        )}
                      </div>

                      <div className={`ml-4 transition-all ${index === selectedIndex ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
                        <div className="bg-white/20 p-2 rounded-full border border-white/30">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <DialogCreateCliente
        isOpen={openCreate}
        onClose={setOpenCreate}
        onSuccess={() => {
          fetchClientes();
        }}
      />
    </>
  );
}