import { RouteHandlerMethod } from "fastify";
import { placeTable, useDB } from "@/db";
import { createHash } from "crypto";
import { ne } from "drizzle-orm";

const db = useDB();

const getStations: RouteHandlerMethod = async (req, res) => {
    const clientHash = req.query.hash;

    const stations = await db.query.placeTable.findMany({
        where: ne(placeTable.number, 0),
        columns: {
            id: true,
            name: true,
            number: true,
            location: true,
        },
        orderBy: placeTable.id,
    });

    const hash = createHash("md5").update(JSON.stringify(stations)).digest("hex");
    if (clientHash === hash) return res.status(304).send();

    return {
        stations,
        hash,
    };
};

export default getStations;
