import { Bike, dateToString, dbInsert, dbSelect, Place, Point, Rental, stringToDate } from "@/db";
import getLiveData from "./getLiveData";

const maxBikeSpeed = 30; // km/h

export default async () => {
    const [previousBikes, previousPlaces, liveData] = await Promise.all([
        dbSelect<Bike>("SELECT id, bike_number, type, battery, place_id, last_seen FROM bikes FINAL"),
        dbSelect<Place>("SELECT id, location, name, place_number, last_seen FROM places FINAL"),
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

    for (const place of previousPlaces) {
        placesMap.set(place.id, {
            uid: place.id,
            lat: place.location[1],
            lng: place.location[0],
            name: place.name,
            number: place.place_number,
        });
    }

    const rentals: Rental[] = [];

    for (const bike of liveData.bikes) {
        if (bike.boardcomputer === 0) continue;

        const previousBike = previousBikesMap.get(String(bike.boardcomputer));
        if (!previousBike || previousBike.place_id === bike.place_id) continue;

        const startPlace = placesMap.get(previousBike.place_id);
        const endPlace = placesMap.get(bike.place_id);
        if (!startPlace || !endPlace) continue;

        const startLocation = [startPlace.lng, startPlace.lat] as Point;
        const endLocation = [endPlace.lng, endPlace.lat] as Point;

        const rentalDistance = calculateDistance(startLocation, endLocation);

        const duration = (Date.now() - stringToDate(previousBike.last_seen).getTime()) / 3600000;
        const avgSpeed = rentalDistance / duration; // in km/h
        if (avgSpeed > maxBikeSpeed) continue;

        rentals.push({
            id: `${previousBike.id}-${Date.now()}`,
            bike_number: previousBike.bike_number,
            bike_type: previousBike.type,
            start_location: startLocation,
            end_location: endLocation,
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

const calculateDistance = (start: Point, end: Point): number => {
    const dLat = (end[1] - start[1]) * (Math.PI / 180);
    const dLon = (end[0] - start[0]) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(start[1] * (Math.PI / 180)) *
            Math.cos(end[1] * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
