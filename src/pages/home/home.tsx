import Bienvenida from "./bienvenida";
import Caja from "./caja";
import { useState } from "react";




export default function Home() {

  const [openCaja, setOpenCaja] = useState<string | null>(() => localStorage.getItem("openCaja"));

  const handleCajaOpened = () => {
    setOpenCaja(localStorage.getItem("openCaja"));
  };

  return (
    <div>
      {openCaja ? <Caja /> : <Bienvenida onCajaOpened={handleCajaOpened} />}
    </div>
  )

}