import { rentalTable, useDB } from "@/db";
import { desc, inArray, sql } from "drizzle-orm";
import { RouteHandlerMethod } from "fastify";

const db = useDB();

const getMostPopularBikes: RouteHandlerMethod = async (req, res) => {
    const bikeTypes = req.query.bikeTypes?.split(",").map(Number);
    const limit = +req.query.limit || 20;

    if (limit > 200) return res.code(400).send({ error: "Limit cannot exceed 200" });

    const results = await db
        .select({
            bike_number: rentalTable.bike,
            bike_type: rentalTable.bike_type,
            rental_count: sql<number>`count(${rentalTable.id})`.as("rental_count"),
        })
        .from(rentalTable)
        .where(bikeTypes ? inArray(rentalTable.bike_type, bikeTypes) : undefined)
        .groupBy(rentalTable.bike, rentalTable.bike_type)
        .orderBy(desc(sql<number>`count(${rentalTable.id})`))
        .limit(limit);

    return results.map((bike) => ({
        bike: bike.bike_number,
        type: bike.bike_type,
        rentals: bike.rental_count,
    }));
};

export default getMostPopularBikes;
