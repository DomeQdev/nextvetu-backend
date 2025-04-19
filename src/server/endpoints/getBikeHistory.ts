import { rentalTable, useDB } from "@/db";
import { desc, eq } from "drizzle-orm";
import { RouteHandlerMethod } from "fastify";

const db = useDB();

const getBikeHistory: RouteHandlerMethod = async (req, res) => {
    const bike = req.query.bike;
    const limit = +req.query.limit || 10;

    if (!bike) return res.code(400).send({ error: "Missing bike query parameter" });
    if (limit > 1000) return res.code(400).send({ error: "Limit cannot exceed 1000" });

    return db.query.rentalTable.findMany({
        where: eq(rentalTable.bike, bike),
        orderBy: desc(rentalTable.start),
        limit,
    });
};

export default getBikeHistory;
