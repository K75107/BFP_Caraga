import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';

const Main = () => {
  return (
    <div>
      <Sidebar />
      <div>
        <Outlet />
      </div>
    </div>
  );
};

export default Main;
