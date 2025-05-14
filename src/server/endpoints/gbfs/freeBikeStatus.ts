import { dbSelect, Point } from "@/db";
import { RouteHandlerMethod } from "fastify";

const getFreeBikeStatus: RouteHandlerMethod = async () => {
    const bikes = await dbSelect<{ bike_number: string; location: Point }>(`
        SELECT
            bike.bike_number,
            place.location
        FROM
            bikes bike FINAL
        INNER JOIN
            places place ON bike.place_id = place.id
        WHERE
            place.place_number = '0'
    `);

    return {
        last_updated: Math.floor(Date.now() / 1000),
        ttl: 30,
        data: {
            bikes: bikes.map(({ bike_number, location }) => ({
                bike_id: bike_number,
                lon: location[0],
                lat: location[1],
                is_reserved: 0,
                is_disabled: 0,
            })),
        },
    };
};

export default getFreeBikeStatus;
