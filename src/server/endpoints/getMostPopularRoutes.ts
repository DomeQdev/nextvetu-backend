import { rentalTable, useDB } from "@/db";
import { sql } from "drizzle-orm";
import { RouteHandlerMethod } from "fastify";

const db = useDB();

const getMostPopularRoutes: RouteHandlerMethod = async (req, res) => {
    const limit = +req.query.limit || 20;
    const bikeTypes = req.query.bikeTypes?.split(",").map(Number);

    if (limit > 200) return res.code(400).send({ error: "Limit cannot exceed 200" });

    const routesQuery = await db.execute(sql`
        WITH route_counts AS (
            SELECT 
                LEAST(start_name, end_name) AS route_start,
                GREATEST(start_name, end_name) AS route_end,
                start_name,
                end_name
            FROM ${rentalTable}
            WHERE start_name != end_name
            ${bikeTypes ? sql`AND bike_type IN ${bikeTypes}` : sql``}
        )

        SELECT 
            route_start,
            route_end,
            COUNT(*) AS total_rides,
            SUM(CASE WHEN start_name = route_start THEN 1 ELSE 0 END) AS forward_rides,
            SUM(CASE WHEN start_name = route_end THEN 1 ELSE 0 END) AS backward_rides
        FROM route_counts
        GROUP BY route_start, route_end
        ORDER BY total_rides DESC
        LIMIT ${limit}
    `);

    return routesQuery.rows.map((row) => ({
        start: row.route_start,
        end: row.route_end,
        totalRides: row.total_rides,
        forwardRides: row.forward_rides,
        backwardRides: row.backward_rides,
    }));
};

export default getMostPopularRoutes;
