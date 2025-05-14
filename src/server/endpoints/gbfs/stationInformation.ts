import { dbSelect, Place } from "@/db";
import { RouteHandlerMethod } from "fastify";

const getStationInformation: RouteHandlerMethod = async () => {
    const stations = await dbSelect<Place>("SELECT * FROM places WHERE place_number != 0");

    return {
        last_updated: Math.floor(Date.now() / 1000),
        ttl: 60 * 60,
        data: {
            stations: stations.map((place) => ({
                station_id: String(place.id),
                name: `${place.place_number};${place.name}`,
                short_name: String(place.place_number),
                lon: place.location[0],
                lat: place.location[1],
                capacity: 1000,
            })),
        },
    };
};

export default getStationInformation;
