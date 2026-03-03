"use client";
import dynamic from "next/dynamic";

const AggregateMapLazy = dynamic(() => import("./AggregateMap"), {
  ssr: false,
});

export { AggregateMapLazy as AggregateMap };
