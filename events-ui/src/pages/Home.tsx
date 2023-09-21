import React from "react";
import { Navbar } from "../components";
import partyTwo from "../images/party-two.jpg";
import partyThree from "../images/party-three.jpg";
import partyFive from "../images/party-five.jpg";
import negroni from "../images/negroni.jpg";
import "../index.css";

export const Home = () => {
  return (
    <div>
      <Navbar />
      <div className="relative mt-16 flex h-[1200px] justify-center">
        <img
          className="absolute h-[1200px] w-8/12 rounded-2xl object-cover opacity-90"
          alt="ahh"
          src={partyTwo}
        />
        <div className="relative ml-20 mt-10 w-8/12">
          <h2 className="text-8xl font-semibold text-gray-200">
            <span className="text-rose-400">Highkey partying</span>
            <br />
            lowkey planning
          </h2>
        </div>
      </div>

      <div className="mt-28 flex w-full flex-col items-center">
        <h2 className="w-5/12 text-7xl font-semibold text-gray-600">
          Remove the stress
          <br />
          <span className="text-rose-500">from event planning</span>
        </h2>

        <div className="mt-10 w-5/12 text-xl font-light text-black">
          {
            "Social events are some of the most fun and meaningful experiences of your life. They're also the best way to get to know people in your broader networks. Everyone's too busy for awkward 1:1 meetups with strangers. We want to make it easier to get to know friends-of-friends casually in group settings, while having the time of your life."
          }
        </div>
        <div className="my-16 flex justify-center gap-12">
          <img
            className="h-[600px] w-1/3 rounded-xl object-cover"
            alt="mhmm"
            src={negroni}
          />
          <img
            className="h-[600px] w-1/3 rounded-xl object-cover"
            alt="hmmm"
            src={partyThree}
          />
          <img
            className="h-[600px] w-1/3 rounded-xl object-cover"
            alt="ooo"
            src={partyFive}
          />
        </div>
      </div>

      <div className="mb-24 mt-8 flex w-full flex-col items-center">
        <h2 className="w-1/2 text-center text-7xl font-semibold text-gray-600">
          <span className="text-rose-500">Make parties</span> fun again
        </h2>

        <div className="mt-10 w-5/12 text-xl font-light text-black">
          {
            "Social events are some of the most fun and meaningful experiences of your life. They're also the best way to get to know people in your broader networks. Everyone's too busy for awkward 1:1 meetups with strangers. We want to make it easier to get to know friends-of-friends casually in group settings, while having the time of your life."
          }
        </div>
      </div>
    </div>
  );
};

export default Home;
