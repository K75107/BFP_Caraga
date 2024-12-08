import React, { Fragment, } from "react";

import { Outlet } from "react-router-dom";

export default function TrialBalance() {

    return (
        <Fragment>
            <div className="w-full h-full">
                <Outlet/>
            </div>
        </Fragment>
    );
}
