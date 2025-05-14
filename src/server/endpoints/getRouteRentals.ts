import { dbSelect } from "@/db";
import { RouteHandlerMethod } from "fastify";

const getRouteRentals: RouteHandlerMethod = async (req, res) => {
    const start = req.query.start;
    const end = req.query.end;
    const limit = +req.query.limit || 20;

    if (!start || !end) return res.code(400).send({ error: "Missing start or end query parameters" });
    if (limit > 1000) return res.code(400).send({ error: "Limit cannot exceed 1000" });

    return dbSelect(
        `SELECT *
        FROM rentals
        WHERE start_name = {start:String} AND end_name = {end:String}
        ORDER BY start_time DESC
        LIMIT {limit:UInt32}`,
        { start, end, limit }
    );
};

export default getRouteRentals;
