import React from "react";

export const Navbar = () => {
  // const pathname = usePathname();
  // const [home, events, about] = useMemo(() => {
  //   const isHomePage = pathname === "/";
  //   const isEventsPage = pathname === "/events";
  //   const isAboutPage = pathname === "/about";
  //   return [isHomePage, isEventsPage, isAboutPage];
  // }, [pathname]);
  const home = false;
  const events = false;
  const about = false;
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
            className={`mt-2 border-b-2 border-transparent font-light hover:cursor-pointer hover:border-b-rose-600 ${
              home && "border-b-rose-600"
            }`}
          >
            <a href="/">Home</a>
          </div>
          <div
            className={`mt-2 border-b-2 border-transparent font-light hover:cursor-pointer hover:border-b-rose-600 ${
              events && "border-b-rose-600"
            }`}
          >
            <a href="/events">Upcoming Events</a>
          </div>
          <div className="mt-2 border-b-2 border-transparent font-light hover:cursor-pointer hover:border-b-rose-600">
            My Events
          </div>
          <div
            className={`mt-2 border-b-2 border-transparent font-light hover:cursor-pointer hover:border-b-rose-600 ${
              about && "border-b-rose-600"
            }`}
          >
            <a href="/about">About</a>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-rose-700">
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
