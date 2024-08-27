import React, { Fragment } from "react";

export default function generalLedgerTable(){


    return(
        <Fragment>
            <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
                <div className="flex justify-between w-full">
                    <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">General Ledger</h1>
                    <button className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-3 text-[11px] font-medium">+ ADD ACCOUNT</button>
                </div>

                <hr className="border-t border-[#7694D4] my-4" />

            </div>


            {/*MODALS*/}
            
        </Fragment>
    );
}