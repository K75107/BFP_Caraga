import React, { Fragment, } from "react";

import { Outlet } from "react-router-dom";

export default function changesInEquityMain() {

    return (
        <Fragment>
            
                <Outlet />
         
        </Fragment>
    );
}