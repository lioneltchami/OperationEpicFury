"use client";

import { FormLabel, FormSection, inputClass } from "../AdminEventForm";

interface LocationSectionProps {
  locationName: string;
  setLocationName: (v: string) => void;
  locationLat: string;
  setLocationLat: (v: string) => void;
  locationLng: string;
  setLocationLng: (v: string) => void;
  inputClass: string;
}

export function LocationSection({
  locationName,
  setLocationName,
  locationLat,
  setLocationLat,
  locationLng,
  setLocationLng,
}: LocationSectionProps) {
  return (
    <FormSection title="Location">
      <p className="text-xs text-zinc-600">
        Optional. Add coordinates to show this event on the map.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-3">
          <FormLabel>Location Name</FormLabel>
          <input
            className={inputClass}
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Tehran, Iran"
          />
        </div>
        <div>
          <FormLabel>Latitude</FormLabel>
          <input
            className={`${inputClass} font-mono`}
            type="number"
            step="any"
            value={locationLat}
            onChange={(e) => setLocationLat(e.target.value)}
            placeholder="35.6892"
          />
        </div>
        <div>
          <FormLabel>Longitude</FormLabel>
          <input
            className={`${inputClass} font-mono`}
            type="number"
            step="any"
            value={locationLng}
            onChange={(e) => setLocationLng(e.target.value)}
            placeholder="51.3890"
          />
        </div>
      </div>
    </FormSection>
  );
}
