import React, { Fragment, } from "react";

import { Outlet } from "react-router-dom";

export default function GeneralLedger() {

    return (
        <Fragment>
            <div className="w-full h-full">
                <Outlet />
            </div>
        </Fragment>
    );
}
