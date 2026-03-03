"use client";
import dynamic from "next/dynamic";

const EventMapLazy = dynamic(() => import("./EventMap"), { ssr: false });

export { EventMapLazy as EventMap };
