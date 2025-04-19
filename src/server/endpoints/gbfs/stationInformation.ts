import { RouteHandlerMethod } from "fastify";
import { placeTable, useDB } from "@/db";
import { ne } from "drizzle-orm";

const db = useDB();

const getStationInformation: RouteHandlerMethod = async (req, res) => {
    const stations = await db.query.placeTable.findMany({
        where: ne(placeTable.number, 0),
    });

    return {
        last_updated: Math.floor(Date.now() / 1000),
        ttl: 60 * 60,
        data: {
            stations: stations.map((place) => ({
                station_id: String(place.id),
                name: place.name,
                short_name: String(place.number),
                lon: place.location[0],
                lat: place.location[1],
                capacity: 1000,
            })),
        },
    };
};

export default getStationInformation;
