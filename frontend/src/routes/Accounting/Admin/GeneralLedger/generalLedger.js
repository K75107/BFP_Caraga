import React, { Fragment, } from "react";

import { Outlet } from "react-router-dom";

export default function GeneralLedger() {

    return (
        <Fragment>
            <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
                <Outlet/>
            </div>
        </Fragment>
    );
}
