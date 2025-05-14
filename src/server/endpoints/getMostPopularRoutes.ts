import { dbSelect } from "@/db";
import { RouteHandlerMethod } from "fastify";

const getMostPopularRoutes: RouteHandlerMethod = async (req, res) => {
    const limit = +req.query.limit || 20;
    const bikeTypes = req.query.bikeTypes?.split(",").map(Number);

    if (limit > 200) return res.code(400).send({ error: "Limit cannot exceed 200" });

    return dbSelect(
        `SELECT
            LEAST(start_name, end_name) AS start,
            GREATEST(start_name, end_name) AS end,
            COUNT(*) AS totalRides,
            SUM(CASE WHEN start_name = LEAST(start_name, end_name) THEN 1 ELSE 0 END) AS forwardRides,
            SUM(CASE WHEN start_name = GREATEST(start_name, end_name) THEN 1 ELSE 0 END) AS backwardRides
        FROM rentals
        WHERE start_name != end_name
        ${bikeTypes ? "WHERE bike_type IN {bikeTypes:UInt32}" : ""}
        GROUP BY start, end
        ORDER BY totalRides DESC
        LIMIT {limit:UInt32}`,
        { bikeTypes, limit }
    );
};

export default getMostPopularRoutes;
