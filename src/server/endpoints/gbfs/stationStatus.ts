import { RouteHandlerMethod } from "fastify";
import { bikeTable, useDB } from "@/db";
import { sql } from "drizzle-orm";

const db = useDB();

const getStationStatus: RouteHandlerMethod = async () => {
    const [stations, bikeCounts] = await Promise.all([
        db.query.placeTable.findMany({
            columns: {
                id: true,
                last_seen: true,
            },
        }),
        db
            .select({
                placeId: bikeTable.place,
                count: sql<number>`count(*)::int`,
            })
            .from(bikeTable)
            .groupBy(bikeTable.place)
            .then((bikes) => new Map(bikes.map((bike) => [bike.placeId, bike.count]))),
    ]);

    return {
        last_updated: Math.floor(Date.now() / 1000),
        ttl: 30,
        data: {
            stations: stations.map((place) => {
                const numBikesAvailable = bikeCounts.get(place.id) || 0;

                return {
                    station_id: String(place.id),
                    num_bikes_available: numBikesAvailable,
                    num_docks_available: 1000 - numBikesAvailable,
                    is_installed: 1,
                    is_renting: 1,
                    is_returning: 1,
                    last_reported: Math.floor(place.last_seen.getTime() / 1000),
                };
            }),
        },
    };
};

export default getStationStatus;
