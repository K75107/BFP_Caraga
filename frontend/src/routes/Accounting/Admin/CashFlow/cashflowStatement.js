import React, { Fragment, } from "react";

import { Outlet } from "react-router-dom";

export default function cashflowStatement() {

    return (
        <Fragment>
            
                <Outlet />
         
        </Fragment>
    );
}
