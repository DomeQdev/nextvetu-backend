import { bikeTable, placeTable, Rental, rentalTable, useDB } from "@/db";
import getLiveData from "./getLiveData";
import { lt, sql } from "drizzle-orm";

const db = useDB();

export default async () => {
    await Promise.all([
        db.delete(bikeTable).where(lt(bikeTable.last_seen, new Date(Date.now() - 2.5 * 60 * 60 * 1000))),
        db.delete(placeTable).where(lt(placeTable.last_seen, new Date(Date.now() - 2.5 * 60 * 60 * 1000))),
    ]);

    const [previousBikes, liveData] = await Promise.all([db.query.bikeTable.findMany({}), getLiveData()]);

    if (!liveData) return;

    if (liveData.places.length) {
        await db
            .insert(placeTable)
            .values(
                liveData.places.map((place) => ({
                    id: place.uid,
                    location: [place.lng, place.lat] as [number, number],
                    name: place.name,
                    number: place.number,
                    last_seen: new Date(),
                }))
            )
            .onConflictDoUpdate({
                target: [placeTable.id],
                set: {
                    last_seen: new Date(),
                },
            });
    }

    if (liveData.bikes.length) {
        await db
            .insert(bikeTable)
            .values(
                liveData.bikes.map((bike) => ({
                    id: String(bike.boardcomputer),
                    number: bike.number,
                    type: bike.bike_type,
                    battery: bike.pedelec_battery,
                    place: bike.place_id,
                    last_seen: new Date(),
                }))
            )
            .onConflictDoUpdate({
                target: [bikeTable.id],
                set: {
                    battery: sql`excluded.battery`,
                    place: sql`excluded.place`,
                    last_seen: new Date(),
                },
            });
    }

    const previousBikesMap = new Map(previousBikes.map((bike) => [bike.id, bike]));
    const placesMap = new Map(liveData.places.map((place) => [place.uid, place]));
    const rentals: Rental[] = [];

    for (const bike of liveData.bikes) {
        const previousBike = previousBikesMap.get(String(bike.boardcomputer));
        if (!previousBike || previousBike.place === bike.place_id) continue;

        const startPlace = placesMap.get(previousBike.place);
        const endPlace = placesMap.get(bike.place_id);
        if (!startPlace || !endPlace) continue;

        rentals.push({
            id: `${previousBike.id}-${Date.now()}`,
            bike: previousBike.number,
            bike_type: previousBike.type,
            start_location: [startPlace.lng, startPlace.lat] as [number, number],
            end_location: [endPlace.lng, endPlace.lat] as [number, number],
            start_name: startPlace.name,
            end_name: endPlace.name,
            start: previousBike.last_seen,
            end: new Date(),
            batteryStart: previousBike.battery,
            batteryEnd: bike.pedelec_battery,
        });
    }

    if (rentals.length) {
        await db.insert(rentalTable).values(rentals);
    }
};
