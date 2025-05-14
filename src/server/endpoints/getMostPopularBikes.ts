import { dbSelect } from "@/db";
import { RouteHandlerMethod } from "fastify";

const getMostPopularBikes: RouteHandlerMethod = async (req, res) => {
    const bikeTypes = req.query.bikeTypes?.split(",").map(Number);
    const limit = +req.query.limit || 20;

    if (limit > 200) return res.code(400).send({ error: "Limit cannot exceed 200" });

    return dbSelect(
        `SELECT
            bike_number as bike,
            bike_type as type,
            COUNT(*) AS rentals
        FROM rentals
        ${bikeTypes ? "WHERE bike_type IN {bikeTypes:UInt32}" : ""}
        GROUP BY
            bike_number,
            bike_type
        ORDER BY
            rentals DESC
        LIMIT {limit:UInt32}`,
        { bikeTypes, limit }
    );
};

export default getMostPopularBikes;
