import { dbSelect } from "@/db";
import { RouteHandlerMethod } from "fastify";

const getStationHistory: RouteHandlerMethod = async (req, res) => {
    const station = req.query.station;
    const limit = +req.query.limit || 10;

    if (!station) return res.code(400).send({ error: "Missing station query parameter" });
    if (limit > 1000) return res.code(400).send({ error: "Limit cannot exceed 1000" });

    return dbSelect(
        `SELECT *
        FROM rentals
        WHERE start_name = {station:String} OR end_name = {station:String}
        ORDER BY start_time DESC
        LIMIT {limit:UInt32}`,
        { station, limit }
    );
};

export default getStationHistory;
