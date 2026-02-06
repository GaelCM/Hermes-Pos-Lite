import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListaProductos } from "@/contexts/listaProductos";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CarritoTabs() {
  const { carritos, carritoActivo, cambiarCarritoActivo, crearCarrito, eliminarCarrito, renombrarCarrito } = useListaProductos();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const saveRename = (id: string) => {
    if (editingName.trim()) {
      renombrarCarrito(id, editingName);
    }
    setEditingId(null);
    setEditingName("");
  };

  const confirmDelete = () => {
    if (deleteId) {
      eliminarCarrito(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="flex gap-2 items-center overflow-x-auto pb-2 shrink-0">
        {/* Botón para crear nuevo carrito */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => crearCarrito()}
          className="shrink-0"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nuevo
        </Button>

        {/* Tabs de carritos */}
        <div className="flex gap-2 overflow-x-auto flex-1">
          {carritos.map((carrito) => (
            <div
              key={carrito.id}
              className={`flex items-center gap-2 pl-4 pr-1 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all shrink-0 border select-none ${carritoActivo === carrito.id
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background hover:bg-muted text-muted-foreground border-border"
                }`}
            >
              {editingId === carrito.id ? (
                <Input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => saveRename(carrito.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRename(carrito.id);
                    if (e.key === "Escape") {
                      setEditingId(null);
                      setEditingName("");
                    }
                  }}
                  className="h-6 text-xs w-24 bg-transparent border-none focus-visible:ring-0 px-0 text-inherit"
                />
              ) : (
                <>
                  <span
                    onClick={() => cambiarCarritoActivo(carrito.id)}
                    onDoubleClick={() => handleRename(carrito.id, carrito.nombre)}
                    className="flex-1 font-semibold text-sm"
                  >
                    {carrito.nombre}
                    <span className="text-xs ml-1 opacity-80 font-normal">({carrito.productos.length})</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(carrito.id);
                    }}
                    className={`w-6 h-6 rounded-full ml-1 ${carritoActivo === carrito.id
                      ? "hover:bg-primary-foreground/20 text-primary-foreground/80 hover:text-primary-foreground"
                      : "hover:bg-destructive/10 hover:text-destructive"
                      }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>

        {carritos.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No hay carritos. Crea uno nuevo para comenzar.
          </p>
        )}
      </div>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar carrito?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará el carrito "{carritos.find(c => c.id === deleteId)?.nombre}" y todos sus productos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
