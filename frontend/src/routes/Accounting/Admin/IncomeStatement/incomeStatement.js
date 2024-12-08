import React, { Fragment, } from "react";

import { Outlet } from "react-router-dom";

export default function IncomeStatement() {

    return (
        <Fragment>
            <div className="h-full w-full ">
                <Outlet/>
            </div>
        </Fragment>
    );
}
