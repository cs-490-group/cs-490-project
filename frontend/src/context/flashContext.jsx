import React, { createContext, useContext, useState } from "react";


const FlashContext = createContext();

export const FlashProvider = ({ children }) => {
  const [flash, setFlash] = useState({message:"",type:"error"}); 

   const showFlash = (message, type,duration = 3000) => { 

        setFlash({message,type});
        setTimeout(() => { setFlash(prev => ({ ...prev, message: ""}));}, duration); // When duration is up, resets the flash message back to ""
    };

  return <FlashContext.Provider value={{flash,showFlash}}>{children}</FlashContext.Provider>;
};

export const useFlash = () => useContext(FlashContext); //Allows Flash messages to be used globally.

export const FlashMessage = () => { // This just renders the message itself whenever the flash obj is updated.
  const { flash } = useFlash();
  if (!flash || !flash.message) return null; // if flash doesnt have a message, do nothing.

  return (
    <div // Feel free to change this styling if needed.
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        padding: "10px 20px",
        backgroundColor: flash.type === "error" ? "red" : "green",
        color: "white",
        borderRadius: 5,
        zIndex: 9999,
      }}
    >
      {flash.message}
    </div>
  );
};