import Bienvenida from "./bienvenida";
import Caja from "./caja";
import { useState, useEffect } from "react";


export default function Home() {

  const [openCaja, setOpenCaja] = useState<string | null>(null);

  const checkCaja = async () => {
    // @ts-ignore
    const api = window["electron-api"];
    const storeTurno = await api?.getConfig("open_caja");
    if (storeTurno) {
      setOpenCaja(JSON.stringify(storeTurno));
    } else {
      setOpenCaja(localStorage.getItem("openCaja"));
    }
  }

  useEffect(() => {
    checkCaja();
  }, []);

  const handleCajaOpened = () => {
    checkCaja();
  };

  return (
    <div>
      {openCaja ? <Caja /> : <Bienvenida onCajaOpened={handleCajaOpened} />}
    </div>
  )

}