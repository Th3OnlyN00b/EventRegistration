import React from "react";
import { useNavigate, useMatch } from "react-router-dom";

export const Navbar = () => {
  const navigate = useNavigate();

  const home = useMatch("/");
  const events = useMatch("/events");
  const about = useMatch("/about");
  return (
    <nav className="flex h-24 w-full items-center justify-center text-black">
      <div className="flex w-8/12 items-center justify-between">
        <div className="flex min-w-min items-center text-2xl font-semibold text-rose-600">
          <div className="mr-1 h-[10px] w-[10px] rounded-full bg-rose-600" />
          EventEasy
          <div className="ml-1 h-[10px] w-[10px] rounded-full bg-rose-600" />
        </div>
        <div className="flex w-full items-center justify-end gap-10">
          <div
            onClick={() => navigate("/")}
            className={`mt-2 border-b-2 border-transparent font-light hover:cursor-pointer hover:border-b-rose-600 ${
              home && "border-b-rose-600"
            }`}
          >
            Home
          </div>
          <div
            onClick={() => navigate("/events")}
            className={`mt-2 border-b-2 border-transparent font-light hover:cursor-pointer hover:border-b-rose-600 ${
              events && "border-b-rose-600"
            }`}
          >
            Upcoming Events
          </div>
          <div className="mt-2 border-b-2 border-transparent font-light hover:cursor-pointer hover:border-b-rose-600">
            My Events
          </div>
          <div
            onClick={() => navigate("/about")}
            className={`mt-2 border-b-2 border-transparent font-light hover:cursor-pointer hover:border-b-rose-600 ${
              about && "border-b-rose-600"
            }`}
          >
            About
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/create")}
              className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-rose-700"
            >
              Create event
            </button>
            <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow hover:bg-gray-200">
              Sign in
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
