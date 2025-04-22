import { bikeTable, placeTable, rentalTable, useDB } from "@/db";
import { and, eq, gte, inArray } from "drizzle-orm";
import { RouteHandlerMethod } from "fastify";

const db = useDB();

const getStation: RouteHandlerMethod = async (req, res) => {
    const number = req.query.number;
    if (!number) return res.code(400).send({ error: "Missing number query parameter" });

    const station = await db.query.placeTable.findFirst({
        where: eq(placeTable.number, +number),
        columns: {
            name: true,
            number: true,
            location: true,
        },
        with: {
            bikes: {
                where: gte(bikeTable.last_seen, new Date(Date.now() - 2 * 60 * 1000)),
                columns: {
                    number: true,
                    battery: true,
                    type: true,
                },
            },
        },
    });
    if (!station) return res.code(404).send({ error: "Station not found" });

    const rentals = await db.query.rentalTable.findMany({
        where: and(
            inArray(
                rentalTable.bike,
                station.bikes.map((bike) => bike.number)
            ),
            gte(rentalTable.start, new Date(Date.now() - 24 * 60 * 60 * 1000))
        ),
        columns: {
            bike: true,
            start: true,
            start_name: true,
            battery_start: true,
            end: true,
            end_name: true,
            battery_end: true,
        },
    });

    const bikeRentals = new Map<string, typeof rentals>();
    for (const rental of rentals) {
        if (!bikeRentals.has(rental.bike)) bikeRentals.set(rental.bike, []);
        bikeRentals.get(rental.bike)?.push(rental);
    }

    return {
        name: station.name,
        number: station.number,
        location: station.location,
        bikes: station.bikes.map((bike) => ({
            number: bike.number,
            battery: bike.battery ?? undefined,
            type: bike.type,
            rentals: (bikeRentals.get(bike.number) || []).map((rental) => ({
                start: rental.start.getTime(),
                start_name: rental.start_name,
                battery_start: rental.battery_start ?? undefined,
                end: rental.end.getTime(),
                end_name: rental.end_name,
                battery_end: rental.battery_end ?? undefined,
            })),
        })),
    };
};

export default getStation;
