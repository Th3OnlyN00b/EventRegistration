import React from "react";
import { GrLocation, GrCalendar, GrUnlock, GrLock } from "react-icons/gr";
import Image from "next/image";
import { Navbar } from "../components";
import gameNight from "../../public/card-games.jpg";
import charcuterie from "../../public/charcuterie.jpg";
import pool from "../../public/pool.jpg";
import tennis from "../../public/tennis.jpg";
import { StaticImport } from "next/dist/shared/lib/get-img-props";

type EventCardProps = {
  imageSrc: string | StaticImport;
  altText: string;
  title: string;
  location: string;
  date: string;
  isPrivate: boolean;
};

const EventCard = (props: EventCardProps) => {
  const { date, title, location, altText, imageSrc, isPrivate } = props;
  return (
    <div className="flex h-[375px] flex-col rounded-xl p-4 shadow-md hover:cursor-pointer hover:shadow-2xl">
      <Image
        className="h-3/4 w-full rounded-xl object-cover"
        priority
        alt={altText}
        src={imageSrc}
      />
      <div className="mt-3">
        {isPrivate && (
          <div className="flex items-center gap-2 text-xs font-light text-gray-500">
            <GrLock />
            Private
          </div>
        )}
        {!isPrivate && (
          <div className="flex items-center gap-2 text-xs font-light text-gray-500">
            <GrUnlock />
            Public
          </div>
        )}
        <div className="flex items-center gap-2 text-xs font-light text-gray-500">
          <GrCalendar />
          {date}
        </div>
        <div className="flex items-center gap-2 text-xs font-light text-gray-500">
          <GrLocation />
          {location}
        </div>
        <div className="text-sm font-semibold">{title}</div>
      </div>
    </div>
  );
};

export const Events = () => {
  return (
    <div>
      <Navbar />
      <div className="my-6 flex flex-col items-center">
        <div className="mt-4 flex w-2/3 text-3xl font-semibold text-rose-500">
          Upcoming Events
        </div>
        <div className="mt-8 grid w-2/3 grid-cols-3 gap-6">
          <EventCard
            title="Labor Day Weekend Mixed Doubles"
            date="September 4, 2023 || 7-9pm"
            altText="tennis-pic"
            location="Washington Park"
            imageSrc={tennis}
            isPrivate={false}
          />
          <EventCard
            title="Delta Sigma Theta Wine Wednesday"
            date="December 19, 2023"
            altText="charcuterie-pic"
            location="998 Massachusetts Ave, Arlington, MA 02476"
            imageSrc={charcuterie}
            isPrivate={true}
          />
          <EventCard
            title="Jennifer's Pool Party - June 2023"
            date="June 21, 2023"
            altText="pool-pic"
            location="1223 Forest Street, Tulsa, OK"
            imageSrc={pool}
            isPrivate={true}
          />
          <EventCard
            title="Friday Game Night"
            date="November 22, 2023"
            altText="cards-pic"
            location="Cole's House"
            imageSrc={gameNight}
            isPrivate={false}
          />
        </div>
      </div>
    </div>
  );
};

export default Events;
