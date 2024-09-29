import React, { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";

export default function FireStationCollections() {
  const navigate = useNavigate();

  return (
    <Fragment>
      <div className="bg-white h-[calc(92vh)] py-5 px-6 w-full rounded-lg">
        
          <div className="flex flex-col space-y-6 w-full mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-800">
                Fire Station Reports - Collections
              </h1>
            </div>
          </div>

          <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
            <ul
              className="flex flex-wrap -mb-px text-sm font-medium text-center"
              id="default-styled-tab"
              role="tablist"
            >
              <li className="me-2" role="presentation">
                <button
                  onClick={() => navigate("unsubmitted")}  // Corrected
                  className="inline-block p-4 border-b-2 rounded-t-lg"
                  id="profile-styled-tab"
                  type="button"
                  role="tab"
                  aria-controls="profile"
                  aria-selected="false"
                >
                  Unsubmitted
                </button>
              </li>
              <li className="me-2" role="presentation">
                <button
                  onClick={() => navigate("submitted")}  // Corrected
                  className="inline-block p-4 border-b-2 rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  id="dashboard-styled-tab"
                  type="button"
                  role="tab"
                  aria-controls="dashboard"
                  aria-selected="false"
                >
                  Submitted
                </button>
              </li>
            </ul>
          </div>

          <div id="default-styled-tab-content">
            <div
              className="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
              id="styled-profile"
              role="tabpanel"
              aria-labelledby="profile-tab"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This is some placeholder content the{" "}
                <strong className="font-medium text-gray-800 dark:text-white">
                  Profile tab's associated content
                </strong>
                . Clicking another tab will toggle the visibility of this one for
                the next. The tab JavaScript swaps classes to control the content
                visibility and styling.
              </p>
            </div>
            <div
              className="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
              id="styled-dashboard"
              role="tabpanel"
              aria-labelledby="dashboard-tab"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This is some placeholder content the{" "}
                <strong className="font-medium text-gray-800 dark:text-white">
                  Dashboard tab's associated content
                </strong>
                . Clicking another tab will toggle the visibility of this one for
                the next. The tab JavaScript swaps classes to control the content
                visibility and styling.
              </p>
            </div>
          </div>

          <Outlet />
        </div>
     
    </Fragment>
  );
}
