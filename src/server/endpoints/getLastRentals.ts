import { dbSelect } from "@/db";
import { RouteHandlerMethod } from "fastify";

const getLastRentals: RouteHandlerMethod = async (req, res) => {
    const bikeTypes = req.query.bikeTypes?.split(",").map(Number);
    const limit = +req.query.limit || 20;

    if (limit > 1000) return res.code(400).send({ error: "Limit cannot exceed 1000" });

    return dbSelect(
        `SELECT *
        FROM rentals
        ${bikeTypes ? "WHERE bike_type IN {bikeTypes:Array(UInt32)}" : ""}
        ORDER BY start_time DESC
        LIMIT {limit:UInt32}`,
        { bikeTypes, limit }
    );
};

export default getLastRentals;
