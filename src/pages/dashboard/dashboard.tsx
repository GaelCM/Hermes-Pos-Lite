import { useEffect, useState } from "react";
import DashboardAdmon from "./components/dashboardAdmon";
import DashboardUser from "./components/dashboardUser";
import NoTurnoError from "./components/noTurnoError";
import { useCurrentUser } from "@/contexts/currentUser";


export default function DashboardPage() {
    const { user } = useCurrentUser()
    const [turnoId, setTurnoId] = useState<number | null>(null);

    useEffect(() => {
        const fetchTurno = async () => {
            // @ts-ignore
            const api = window["electron-api"];
            const storeTurno = await api?.getConfig("open_caja");
            let id: number | null = null;
            if (storeTurno) {
                id = typeof storeTurno === 'number' ? storeTurno : (storeTurno.id_turno || storeTurno.id);
            }

            if (!id) {
                const localTurno = localStorage.getItem("openCaja");
                if (localTurno) {
                    try {
                        const parsed = JSON.parse(localTurno);
                        id = typeof parsed === 'number' ? parsed : (parsed.id_turno || parsed.id);
                    } catch (e) {
                        if (!isNaN(Number(localTurno))) id = Number(localTurno);
                    }
                }
            }
            if (id) setTurnoId(id);
        };
        fetchTurno();
    }, []);

    if (!turnoId && user.id_rol == 1) {
        return <DashboardAdmon />;
    }

    if (!turnoId) {
        return <NoTurnoError />;
    }

    return (
        <div>
            {turnoId && user.id_rol == 1 ? <DashboardAdmon /> : <DashboardUser idTurno={turnoId} />}
        </div>
    )
}