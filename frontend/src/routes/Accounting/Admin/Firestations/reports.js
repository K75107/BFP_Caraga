import React, { Fragment, } from "react";

import { Outlet } from "react-router-dom";

export default function Reports() {

    return (
        <Fragment>
            <div className="bg-white h-screen py-5 px-6 w-full rounded-lg">
                <Outlet/>
            </div>
        </Fragment>
    );
}
