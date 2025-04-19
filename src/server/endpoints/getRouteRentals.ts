import { rentalTable, useDB } from "@/db";
import { and, desc, eq } from "drizzle-orm";
import { RouteHandlerMethod } from "fastify";

const db = useDB();

const getRouteRentals: RouteHandlerMethod = async (req, res) => {
    const start = req.query.start;
    const end = req.query.end;
    const limit = +req.query.limit || 20;

    if (!start || !end) return res.code(400).send({ error: "Missing start or end query parameters" });
    if (limit > 1000) return res.code(400).send({ error: "Limit cannot exceed 1000" });

    return db.query.rentalTable.findMany({
        where: and(eq(rentalTable.start_name, start), eq(rentalTable.end_name, end)),
        orderBy: desc(rentalTable.start),
        limit,
    });
};

export default getRouteRentals;
