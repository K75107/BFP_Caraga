import React, { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";

export default function FireStationCollections() {


  return (
    <Fragment>
      <div className="bg-white h-[calc(92vh)] py-8 px-8 w-full rounded-lg">
          <Outlet />
        </div>
     
    </Fragment>
  );
}
