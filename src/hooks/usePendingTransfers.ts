import { obtenerTransferenciasPendientesApi } from "@/api/transferenciasApi/transferenciasApi";
import { useCurrentUser } from "@/contexts/currentUser";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

const POLL_INTERVAL_MS = 45_000; // polling de respaldo cada 45s

export function usePendingTransfers() {
    const { user } = useCurrentUser();
    const [pendingCount, setPendingCount] = useState(0);
    const location = useLocation(); // cambia en cada navegación React Router

    // Ref que siempre apunta a la versión actual de fetchPending
    const fetchRef = useRef<() => Promise<void>>(async () => { });

    const fetchPending = useCallback(async () => {
        if (!user?.id_sucursal) return;
        try {
            const res = await obtenerTransferenciasPendientesApi(user.id_sucursal);
            if (res.success) {
                setPendingCount(res.data.length);
            }
        } catch {
            // silencioso
        }
    }, [user?.id_sucursal]);

    // Actualizar la ref con la versión más reciente
    useEffect(() => {
        fetchRef.current = fetchPending;
    }, [fetchPending]);

    // ✅ Refetch en cada cambio de ruta (React Router)
    useEffect(() => {
        fetchRef.current();
    }, [location.pathname]);

    // Polling de respaldo + eventos de foco/visibilidad
    useEffect(() => {
        fetchRef.current(); // llamada inicial

        const interval = setInterval(() => {
            fetchRef.current();
        }, POLL_INTERVAL_MS);

        const handleVisibility = () => {
            if (document.visibilityState === "visible") fetchRef.current();
        };
        const handleFocus = () => fetchRef.current();

        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("focus", handleFocus);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("focus", handleFocus);
        };
    }, [user?.id_sucursal]);

    return pendingCount;
}
