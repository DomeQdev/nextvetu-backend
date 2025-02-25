import { RouteHandlerMethod } from "fastify";
import { placeTable, useDB } from "@/db";
import { gt, sql } from "drizzle-orm";

const db = useDB();

const getLiveBikes: RouteHandlerMethod = async (req, res) => {
    if (!req.query.bounds) return res.code(400).send({ error: "Missing bounds query parameter" });
    const bounds = req.query.bounds.split(",");

    const places = await db.query.placeTable.findMany({
        where: sql`${placeTable.location} @ ST_MakeEnvelope(${bounds[0]}, ${bounds[1]}, ${bounds[2]}, ${bounds[3]}, 4326)`,
        columns: {
            id: true,
            number: true,
            location: true,
        },
        with: {
            bikes: {
                where: gt(placeTable.last_seen, new Date(Date.now() - 40 * 1000)),
                columns: {
                    id: true,
                    number: true,
                    type: true,
                    battery: true,
                },
            },
        },
    });

    const stations = [];
    const freestandingBikes = [];

    for (const place of places) {
        if (!place.bikes.length) continue;

        const isFreestanding = place.number === 0;

        if (isFreestanding) {
            const bike = place.bikes[0];

            freestandingBikes.push([+bike.id, bike.number, bike.type, bike.battery, place.location]);
        } else {
            stations.push([
                place.id,
                place.bikes.map((bike) => [+bike.id, bike.number, bike.type, bike.battery]),
            ]);
        }
    }

    return {
        stations,
        freestandingBikes,
    };
};

export default getLiveBikes;
