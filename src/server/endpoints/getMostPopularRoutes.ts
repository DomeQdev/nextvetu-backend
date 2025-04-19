import { rentalTable, useDB } from "@/db";
import { desc, sql } from "drizzle-orm";
import { RouteHandlerMethod } from "fastify";

const db = useDB();

const getMostPopularRoutes: RouteHandlerMethod = async (req, res) => {
    const limit = +req.query.limit || 20;
    const bikeTypes = req.query.bikeTypes?.split(",").map(Number);

    if (limit > 200) return res.code(400).send({ error: "Limit cannot exceed 200" });

    const routesQuery = await db.execute(sql`
        WITH route_counts AS (
            SELECT 
                start_name,
                end_name,
                1 as count,
                CASE
                    WHEN id IS NOT NULL THEN 1
                    ELSE 0
                END AS forward,
                CASE
                    WHEN id IS NOT NULL THEN 0
                    ELSE 1
                END AS backward
            FROM ${rentalTable}
            WHERE start_name != end_name
            ${bikeTypes ? sql`AND bike_type IN ${bikeTypes}` : sql``}
        )
            
        SELECT 
            start_name,
            end_name,
            COUNT(*) AS total_rides,
            SUM(forward) AS forward_rides,
            SUM(backward) AS backward_rides
        FROM route_counts
        GROUP BY start_name, end_name
        ORDER BY total_rides DESC
        LIMIT ${limit}
    `);

    return routesQuery.rows.map((row) => ({
        start: row.start_name,
        end: row.end_name,
        totalRides: row.total_rides,
        forwardRides: row.forward_rides,
        backwardRides: row.backward_rides,
    }));
};

export default getMostPopularRoutes;
