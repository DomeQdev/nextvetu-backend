import db, { Bike, dateToString, dbSelect, Place, Rental, stringToDate } from "@/db";
import { RouteHandlerMethod } from "fastify";

const getStation: RouteHandlerMethod = async (req, res) => {
    const number = req.query.number;
    if (!number) return res.code(400).send({ error: "Missing number query parameter" });

    const station = await dbSelect<Place>(
        `SELECT id, name, place_number, location
        FROM places FINAL
        WHERE place_number = {number:UInt32}
        LIMIT 1`,
        { number: +number }
    ).then((res) => res[0]);
    if (!station) return res.code(404).send({ error: "Station not found" });

    const bikes = await dbSelect<Bike>(
        `SELECT bike_number, type, battery
        FROM bikes FINAL
        WHERE place_id = {station:UInt32} AND last_seen > {twoMinutesAgo:DateTime64(3, 'UTC')}`,
        { station: station.id, twoMinutesAgo: dateToString(new Date(Date.now() - 2 * 60 * 1000)) }
    );

    const bikeRentals = new Map<string, Rental[]>();

    if (bikes.length > 0) {
        const rentals = await dbSelect<Rental>(
            `SELECT
                bike_number,
                start_time,
                start_name,
                battery_start,
                end_time,
                end_name,
                battery_end
            FROM rentals
            WHERE
                bike_number IN {bikes:Array(String)} AND
                start_time > {yesterday:DateTime64(3, 'UTC')}`,
            {
                bikes: bikes.map((bike) => bike.bike_number),
                yesterday: dateToString(new Date(Date.now() - 24 * 60 * 60 * 1000)),
            }
        );

        for (const rental of rentals) {
            if (!bikeRentals.has(rental.bike_number)) bikeRentals.set(rental.bike_number, []);
            bikeRentals.get(rental.bike_number)!.push(rental);
        }
    }

    return {
        name: station.name,
        number: station.place_number,
        location: station.location,
        bikes: bikes.map((bike) => ({
            number: bike.bike_number,
            battery: bike.battery ?? undefined,
            type: bike.type,
            rentals: (bikeRentals.get(bike.bike_number) || []).map((rental) => ({
                start_time: stringToDate(rental.start_time).getTime(),
                start_name: rental.start_name,
                battery_start: rental.battery_start ?? undefined,
                end_time: stringToDate(rental.end_time).getTime(),
                end_name: rental.end_name,
                battery_end: rental.battery_end ?? undefined,
            })),
        })),
    };
};

export default getStation;
