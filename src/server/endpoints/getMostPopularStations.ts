import { rentalTable, useDB } from "@/db";
import { desc, sql } from "drizzle-orm";
import { RouteHandlerMethod } from "fastify";

const db = useDB();

const getMostPopularStations: RouteHandlerMethod = async (req, res) => {
    const bikeTypes = req.query.bikeTypes?.split(",").map(Number);
    const limit = +req.query.limit || 20;

    if (limit > 100) return res.code(400).send({ error: "Limit cannot exceed 100" });

    const results = await db.execute(sql`
        WITH station_stats AS (
            SELECT 
                start_name as station_name,
                COUNT(*) as rentals,
                0 as returns
            FROM ${rentalTable}
            ${bikeTypes ? sql`WHERE bike_type IN ${bikeTypes}` : sql``}
            GROUP BY start_name
            
            UNION ALL
            
            SELECT 
                end_name as station_name,
                0 as rentals,
                COUNT(*) as returns
            FROM ${rentalTable}
            ${bikeTypes ? sql`WHERE bike_type IN ${bikeTypes}` : sql``}
            GROUP BY end_name
        )
        SELECT 
            station_name,
            SUM(rentals) as total_rentals,
            SUM(returns) as total_returns,
            SUM(rentals) + SUM(returns) as total_operations
        FROM station_stats
        GROUP BY station_name
        ORDER BY total_operations DESC
        LIMIT ${limit}
    `);

    return results.rows.map((station) => ({
        name: station.station_name,
        rentals: station.total_rentals,
        returns: station.total_returns,
        totalOperations: station.total_operations,
    }));
};

export default getMostPopularStations;
