import { rentalTable, useDB } from "@/db";
import { desc, inArray } from "drizzle-orm";
import { RouteHandlerMethod } from "fastify";

const db = useDB();

const getLastRentals: RouteHandlerMethod = async (req, res) => {
    const bikeTypes = req.query.bikeTypes?.split(",").map(Number);
    const limit = +req.query.limit || 20;

    if (limit > 1000) return res.code(400).send({ error: "Limit cannot exceed 1000" });

    return db.query.rentalTable.findMany({
        where: bikeTypes ? inArray(rentalTable.bike_type, bikeTypes) : undefined,
        orderBy: desc(rentalTable.start),
        limit,
    });
};

export default getLastRentals;
