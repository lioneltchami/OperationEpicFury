/**
 * Utility script to seed location data for existing events.
 * This will add coordinates to the latest events so the map appears.
 */
import { getAllEvents, addEvent } from "./src/lib/kv";

async function seedLocations() {
    console.log("Fetching events...");
    const events = await getAllEvents();

    if (events.length === 0) {
        console.log("No events found to seed.");
        return;
    }

    // Predefined locations for the region
    const locations = [
        { lat: 35.6892, lng: 51.3890, name: "Tehran, Iran" },
        { lat: 32.6546, lng: 51.6680, name: "Isfahan, Iran" },
        { lat: 29.5918, lng: 52.5837, name: "Shiraz, Iran" },
        { lat: 27.1833, lng: 56.2667, name: "Bandar Abbas, Iran" },
        { lat: 34.6416, lng: 50.8746, name: "Qom, Iran" },
        { lat: 26.0000, lng: 55.0000, name: "Strait of Hormuz" },
    ];

    console.log(`Seeding locations for the latest ${Math.min(events.length, 10)} events...`);

    // Update the latest 10 events with a random location from the list
    const updatedEvents = events.map((event, index) => {
        if (index >= events.length - 10) {
            const loc = locations[index % locations.length];
            return { ...event, location: loc };
        }
        return event;
    });

    for (const event of updatedEvents) {
        await addEvent(event);
    }

    console.log("Success! Map should now show 10 clusters.");
}

seedLocations().catch(console.error);
