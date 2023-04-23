"use client";

import React, { useRef } from "react";
import { Logo } from "./logo";
import { useAuth } from "../auth/authProvider";
import MenuElements from "./MenuElements";
import NavBar from "./navbar";

export default function Drawer({ children }: { children: React.ReactNode }) {
  const [user, _login, logout] = useAuth();
  const drawerInput = useRef<HTMLInputElement | null>(null);

  const hideDrawer = () => {
    if (drawerInput.current) drawerInput.current.checked = false;
  };

  return (
    <div className="drawer">
      <input id="sidebar" type="checkbox" className="drawer-toggle" ref={drawerInput} />
      <div className="drawer-content flex flex-col">
        <>
          <NavBar />
          {children}
        </>
      </div>
      <div className="drawer-side">
        <label htmlFor="sidebar" className="drawer-overlay"></label>
        <ul className="w-80 navbar-drawer" onClick={hideDrawer}>
          <div className="block lg:hidden w-auto p-2">
            <Logo />
          </div>
          <MenuElements isDrawer={true} user={user} logout={logout} />
        </ul>
      </div>
    </div>
  );
}