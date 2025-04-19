import { bikeTable, placeTable, useDB } from "@/db";
import { RouteHandlerMethod } from "fastify";
import { eq } from "drizzle-orm";

const db = useDB();

const getFreeBikeStatus: RouteHandlerMethod = async () => {
    const bikes = await db
        .select({
            number: bikeTable.number,
            location: placeTable.location,
        })
        .from(bikeTable)
        .innerJoin(placeTable, eq(bikeTable.place, placeTable.id))
        .where(eq(placeTable.number, 0));

    return {
        last_updated: Math.floor(Date.now() / 1000),
        ttl: 30,
        data: {
            bikes: bikes.map((bike) => ({
                bike_id: bike.number,
                lon: bike.location[0],
                lat: bike.location[1],
                is_reserved: 0,
                is_disabled: 0,
            })),
        },
    };
};

export default getFreeBikeStatus;
