import { dbSelect, dateToString, Rental, stringToDate } from "@/db";
import { RouteHandlerMethod } from "fastify";

const LAT_BUFFER_DEGREES = 0.045; // ~5km
const LNG_BUFFER_DEGREES = 0.075; // ~5km

const getBikeMovements: RouteHandlerMethod = async (req, res) => {
    const { from, to, bounds } = req.query;
    if (!from || !to || !bounds) {
        return res.code(400).send({ error: "Missing from, to, or bounds query parameters" });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (fromDate.getTime() > toDate.getTime()) {
        return res.code(400).send({ error: "Invalid date range" });
    }

    if (toDate.getTime() - fromDate.getTime() > 24 * 60 * 60 * 1000) {
        return res.code(400).send({ error: "Date range exceeds 24 hours" });
    }

    const boundsParts = (bounds as string).split(",").map(Number);
    if (boundsParts.length !== 4) {
        return res.code(400).send({ error: "Invalid bounds format. Expected minLng,minLat,maxLng,maxLat" });
    }

    const [minLng, minLat, maxLng, maxLat] = boundsParts;

    const rentals = await dbSelect<Rental>(
        `SELECT
            bike_number,
            start_location,
            end_location,
            start_time,
            end_time,
        FROM rentals
        WHERE
            start_time <= {toDate:DateTime64(3, 'UTC')} AND
            end_time >= {fromDate:DateTime64(3, 'UTC')} AND
            (
                (start_location.1 >= {expandedMinLng:Float64} AND start_location.1 <= {expandedMaxLng:Float64} AND
                 start_location.2 >= {expandedMinLat:Float64} AND start_location.2 <= {expandedMaxLat:Float64})
                OR
                (end_location.1 >= {expandedMinLng:Float64} AND end_location.1 <= {expandedMaxLng:Float64} AND
                 end_location.2 >= {expandedMinLat:Float64} AND end_location.2 <= {expandedMaxLat:Float64})
            )
        ORDER BY start_time DESC
        LIMIT 20000`,
        {
            fromDate: dateToString(fromDate),
            toDate: dateToString(toDate),
            expandedMinLng: minLng - LNG_BUFFER_DEGREES,
            expandedMinLat: minLat - LAT_BUFFER_DEGREES,
            expandedMaxLng: maxLng + LNG_BUFFER_DEGREES,
            expandedMaxLat: maxLat + LAT_BUFFER_DEGREES,
        }
    );

    return rentals.map((rental) => [
        rental.bike_number,
        rental.start_location,
        rental.end_location,
        stringToDate(rental.start_time).getTime(),
        stringToDate(rental.end_time).getTime(),
    ]);
};

export default getBikeMovements;
