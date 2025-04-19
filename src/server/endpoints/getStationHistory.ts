import { rentalTable, useDB } from "@/db";
import { desc, eq, or } from "drizzle-orm";
import { RouteHandlerMethod } from "fastify";

const db = useDB();

const getStationHistory: RouteHandlerMethod = async (req, res) => {
    const station = req.query.station;
    const limit = +req.query.limit || 10;

    if (!station) return res.code(400).send({ error: "Missing station query parameter" });
    if (limit > 1000) return res.code(400).send({ error: "Limit cannot exceed 1000" });

    return db.query.rentalTable.findMany({
        where: or(eq(rentalTable.start_name, station), eq(rentalTable.end_name, station)),
        orderBy: desc(rentalTable.start),
        limit,
    });
};

export default getStationHistory;
