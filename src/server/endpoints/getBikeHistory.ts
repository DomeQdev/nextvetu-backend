import { dbSelect } from "@/db";
import { RouteHandlerMethod } from "fastify";

const getBikeHistory: RouteHandlerMethod = async (req, res) => {
    const bike = req.query.bike;
    const limit = +req.query.limit || 10;

    if (!bike) return res.code(400).send({ error: "Missing bike query parameter" });
    if (limit > 1000) return res.code(400).send({ error: "Limit cannot exceed 1000" });

    return dbSelect(
        `SELECT *
        FROM rentals
        WHERE bike_number = {bike:String}
        ORDER BY start_time DESC
        LIMIT {limit:UInt32}`,
        { bike, limit }
    );
};

export default getBikeHistory;
