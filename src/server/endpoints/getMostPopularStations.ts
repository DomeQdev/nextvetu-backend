import { dbSelect } from "@/db";
import { RouteHandlerMethod } from "fastify";

const getMostPopularStations: RouteHandlerMethod = async (req, res) => {
    const bikeTypes = req.query.bikeTypes?.split(",").map(Number);
    const limit = +req.query.limit || 20;

    if (limit > 100) return res.code(400).send({ error: "Limit cannot exceed 100" });

    return dbSelect(
        `WITH StationActivity AS (
            SELECT
                start_name AS station_name,
                1 AS rental_event,
                0 AS return_event
            FROM rentals
            WHERE 
                start_name IS NOT NULL AND start_name != '' AND
                end_name IS NOT NULL AND end_name != '' AND
                start_name != end_name 
                ${bikeTypes ? "AND bike_type IN {bikeTypes:UInt32}" : ""}
            
            UNION ALL
            
            SELECT
                end_name AS station_name,
                0 AS rental_event,
                1 AS return_event
            FROM rentals
            WHERE 
                start_name IS NOT NULL AND start_name != '' AND
                end_name IS NOT NULL AND end_name != '' AND
                start_name != end_name
                ${bikeTypes ? "AND bike_type IN {bikeTypes:UInt32}" : ""}
        )

        SELECT
            station_name AS name,
            SUM(rental_event) AS rentals,
            SUM(return_event) AS returns,
            SUM(rental_event + return_event) AS totalOperations
        FROM StationActivity
        WHERE station_name IS NOT NULL AND station_name != ''
        GROUP BY station_name
        ORDER BY totalOperations DESC
        LIMIT {limit:UInt32}`,
        { bikeTypes, limit }
    );
};

export default getMostPopularStations;
