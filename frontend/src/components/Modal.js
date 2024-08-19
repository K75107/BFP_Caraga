import React from "react"

export default function GeneralLedgerModal({ isVisible, children }){
    if( !isVisible ) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
             {children}
        </div>
    );
}
