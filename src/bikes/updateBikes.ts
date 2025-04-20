import { bikeTable, placeTable, Rental, rentalTable, useDB } from "@/db";
import getLiveData from "./getLiveData";
import { lt, sql } from "drizzle-orm";

const db = useDB();

export default async () => {
    await db.delete(bikeTable).where(lt(bikeTable.last_seen, new Date(Date.now() - 2.5 * 60 * 60 * 1000)));
    await db.delete(placeTable).where(lt(placeTable.last_seen, new Date(Date.now() - 2.5 * 60 * 60 * 1000)));

    const [previousBikes, liveData] = await Promise.all([db.query.bikeTable.findMany({}), getLiveData()]);

    if (!liveData) return;

    if (liveData.places.length) {
        await batchProcess(liveData.places, async (placeBatch) => {
            await db
                .insert(placeTable)
                .values(
                    placeBatch.map((place) => ({
                        id: place.uid,
                        location: [place.lng, place.lat] as [number, number],
                        name: place.name.trim(),
                        number: place.number,
                        last_seen: new Date(),
                    }))
                )
                .onConflictDoUpdate({
                    target: [placeTable.id],
                    set: {
                        name: sql`excluded.name`,
                        last_seen: new Date(),
                    },
                });
        });
    }

    if (liveData.bikes.length) {
        const uniqueBikes = new Map();

        for (const bike of liveData.bikes) {
            if (bike.boardcomputer === 0) continue;
            const bikeId = String(bike.boardcomputer);

            uniqueBikes.set(bikeId, bike);
        }

        await batchProcess(Array.from(uniqueBikes.values()), async (bikeBatch) => {
            await db
                .insert(bikeTable)
                .values(
                    bikeBatch.map((bike) => ({
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
        });
    }

    const previousBikesMap = new Map(previousBikes.map((bike) => [bike.id, bike]));
    const placesMap = new Map(liveData.places.map((place) => [place.uid, place]));
    const rentals: Rental[] = [];

    for (const bike of liveData.bikes) {
        if (bike.boardcomputer === 0) continue;

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
            battery_start: previousBike.battery,
            battery_end: bike.pedelec_battery,
        });
    }

    if (rentals.length) {
        await batchProcess(rentals, async (rentalBatch) => {
            await db.insert(rentalTable).values(rentalBatch);
        });
    }
};

const batchSize = 500;

async function batchProcess<T>(items: T[], processFn: (batch: T[]) => Promise<void>): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await processFn(batch);
    }
}
