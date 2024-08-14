import React from "react"

export default function GeneralLedgerModal({ isVisible, onClose, children }){
    if( !isVisible ) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center">
            <div className="bg-white w-[600px] h-60 rounded py-2 px-4">
             {children}
            </div>
        </div>
    );
}
