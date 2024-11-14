import React, { Fragment, } from "react";

import { Outlet } from "react-router-dom";

export default function TrialBalance() {

    return (
        <Fragment>
            <div className="bg-white h-[calc(92vh)] py-8 px-8 w-full rounded-lg">
                <Outlet/>
            </div>
        </Fragment>
    );
}
