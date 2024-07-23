import React from "react";

//React Grid Import
import { render } from "react-dom";
import { ReactGrid, Column, Row } from "@silevis/reactgrid";
import "@silevis/reactgrid/styles.css";


export default function Users(){

    const columns = [
        { columnId: "Fire Station", width: 200 },
        { columnId: "User Type", width: 200 },
        { columnId: "Username", width: 200 },
        { columnId: "Password", width: 200 },

      ];
      
      const rows = [
        {
          rowId: 0,
          cells: [
            { type: "header", text: "Fire Station" },
            { type: "header", text: "User Type" },
            { type: "header", text: "Username" },
            { type: "header", text: "Password" },
          ],
        },
        {
          rowId: 1,
          cells: [
            { type: "text", text: "Thomas" },
            { type: "text", text: "Goldman" },
          ],
        },
        {
          rowId: 2,
          cells: [
            { type: "text", text: "Susie" },
            { type: "text", text: "Spencer" },
          ],
        },
        {
          rowId: 3,
          cells: [
            { type: "text", text: "" },
            { type: "text", text: "" },
          ],
        }
      ];


    return(
        <div className="flex h-full">
            
            <div className="flex-1 w-60 h-full bg-white rounded-3xl">
                <div className="flex h-full mt-2">
                    <ReactGrid
                        rows={rows}
                        columns={columns}
                    />
                </div>

            </div>
            
        </div>


    );
}