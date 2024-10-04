import React, { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";

export default function FireStationDeposits() {


  return (
    <Fragment>
      <div className="bg-white h-[calc(92vh)] py-5 px-6 w-full rounded-lg">
          <Outlet />
        </div>
     
    </Fragment>
  );
}
