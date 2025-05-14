import { Bike, dateToString, dbSelect, Place } from "@/db";
import { RouteHandlerMethod } from "fastify";

const getFeatures: RouteHandlerMethod = async (req, res) => {
    if (!req.query.bounds) return res.code(400).send({ error: "Missing bounds query parameter" });

    const bounds = req.query.bounds.split(",");
    if (bounds.length !== 4) return res.code(400).send({ error: "Invalid bounds format" });

    const places = await dbSelect<Place>(
        `SELECT id, name, place_number, location
        FROM places FINAL
        WHERE pointInPolygon(
            location,
            [
                ({minLng: Float64}, {minLat: Float64}),
                ({maxLng: Float64}, {minLat: Float64}),
                ({maxLng: Float64}, {maxLat: Float64}),
                ({minLng: Float64}, {maxLat: Float64})
            ]
        )`,
        {
            minLng: +bounds[0],
            minLat: +bounds[1],
            maxLng: +bounds[2],
            maxLat: +bounds[3],
        }
    );

    const bikes = await dbSelect<Bike>(
        `SELECT id, bike_number, type, battery, place_id
        FROM bikes FINAL
        WHERE place_id IN {places:Array(Int32)} AND last_seen > {twoMinutesAgo:DateTime64(3, 'UTC')}`,
        {
            places: places.map((place) => place.id),
            twoMinutesAgo: dateToString(new Date(Date.now() - 2 * 60 * 1000)),
        }
    ).then((bikes) => {
        const bikesMap = new Map<number, Bike[]>();

        for (const bike of bikes) {
            if (!bikesMap.has(bike.place_id)) bikesMap.set(bike.place_id, []);
            bikesMap.get(bike.place_id)!.push(bike);
        }

        return bikesMap;
    });

    const stations = [];
    const freestandingBikes = [];

    for (const place of places) {
        const isFreestanding = place.place_number === 0;
        const stationsBikes = bikes.get(place.id) || [];

        if (isFreestanding) {
            const bike = stationsBikes[0];
            if (!bike) continue;

            freestandingBikes.push([+bike.id, bike.bike_number, bike.type, bike.battery, place.location]);
        } else {
            stations.push([
                place.id,
                place.name,
                place.place_number,
                place.location,
                stationsBikes.map((bike) => [+bike.id, bike.bike_number, bike.type, bike.battery]),
            ]);
        }
    }

    return {
        stations,
        freestandingBikes,
    };
};

export default getFeatures;
