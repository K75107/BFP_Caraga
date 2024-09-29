import React, { Fragment, } from "react";

import { Outlet } from "react-router-dom";

export default function GeneralLedger() {

    return (
        <Fragment>
            <div className="bg-white h-[calc(92vh)] py-5 px-6 w-full rounded-lg">
                <Outlet/>
            </div>
        </Fragment>
    );
}
