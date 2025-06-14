import { dbSelect, stringToDate } from "@/db";
import { RouteHandlerMethod } from "fastify";

const getStationStatus: RouteHandlerMethod = async () => {
    const stations = await dbSelect<{ id: number; last_seen: string; bikes: number }>(`
        SELECT
            place.id AS id,
            place.last_seen AS last_seen,
            count(bike.bike_number) AS bikes
        FROM
            bikes bike FINAL
        INNER JOIN
            places place ON bike.place_id = place.id
        WHERE
            place.place_number != 0
        GROUP BY
            place.id,
            place.last_seen
    `);

    return {
        last_updated: Math.floor(Date.now() / 1000),
        ttl: 30,
        data: {
            stations: stations.map((place) => ({
                station_id: String(place.id),
                num_bikes_available: +place.bikes,
                num_docks_available: 1000 - +place.bikes,
                is_installed: 1,
                is_renting: 1,
                is_returning: 1,
                last_reported: Math.floor(stringToDate(place.last_seen).getTime() / 1000),
            })),
        },
    };
};

export default getStationStatus;
