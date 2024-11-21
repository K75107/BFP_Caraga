import React, { Fragment, } from "react";

import { Outlet } from "react-router-dom";

export default function BalanceSheet() {

    return (
        <Fragment>
            <div className=" w-full rounded-lg">
                <Outlet/>
            </div>
        </Fragment>
    );
}
