import { Bike, dateToString, dbInsert, dbSelect, Place, Point, Rental } from "@/db";
import getLiveData from "./getLiveData";

export default async () => {
    const [previousBikes, liveData] = await Promise.all([
        dbSelect<Bike>("SELECT id, bike_number, type, battery, place_id, last_seen FROM bikes FINAL"),
        getLiveData(),
    ]);

    if (!liveData) return;

    if (liveData.places.length) {
        await dbInsert<Place>(
            "places",
            liveData.places.map((place) => ({
                id: place.uid,
                location: [place.lng, place.lat] as Point,
                name: place.name.trim(),
                place_number: place.number,
                last_seen: dateToString(new Date()),
            }))
        );
    }

    if (liveData.bikes.length) {
        const uniqueBikes = new Map();

        for (const bike of liveData.bikes) {
            if (bike.boardcomputer === 0) continue;
            const bikeId = String(bike.boardcomputer);

            uniqueBikes.set(bikeId, bike);
        }

        await dbInsert<Bike>(
            "bikes",
            Array.from(uniqueBikes.values()).map((bike) => ({
                id: String(bike.boardcomputer),
                bike_number: bike.number,
                type: bike.bike_type,
                battery: bike.pedelec_battery,
                place_id: bike.place_id,
                last_seen: dateToString(new Date()),
            }))
        );
    }

    const previousBikesMap = new Map(previousBikes.map((bike) => [bike.id, bike]));
    const placesMap = new Map(liveData.places.map((place) => [place.uid, place]));
    const rentals: Rental[] = [];

    for (const bike of liveData.bikes) {
        if (bike.boardcomputer === 0) continue;

        const previousBike = previousBikesMap.get(String(bike.boardcomputer));
        if (!previousBike || previousBike.place_id === bike.place_id) continue;

        const startPlace = placesMap.get(previousBike.place_id);
        const endPlace = placesMap.get(bike.place_id);
        if (!startPlace || !endPlace) continue;

        rentals.push({
            id: `${previousBike.id}-${Date.now()}`,
            bike_number: previousBike.bike_number,
            bike_type: previousBike.type,
            start_location: [startPlace.lng, startPlace.lat] as [number, number],
            end_location: [endPlace.lng, endPlace.lat] as [number, number],
            start_name: startPlace.name,
            end_name: endPlace.name,
            start_time: previousBike.last_seen,
            end_time: dateToString(new Date()),
            battery_start: previousBike.battery,
            battery_end: bike.pedelec_battery,
        });
    }

    if (rentals.length) {
        await dbInsert<Rental>("rentals", rentals);
    }
};
