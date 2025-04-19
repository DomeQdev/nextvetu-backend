import { RouteHandlerMethod } from "fastify";

const baseUrl = `https://nextvetu.zbiorkom.live/gbfs`;

const getGbfsIndex: RouteHandlerMethod = async () => {
    return {
        last_updated: Math.floor(Date.now() / 1000),
        ttl: 60,
        data: {
            pl: {
                feeds: [
                    {
                        name: "system_information",
                        url: `${baseUrl}/system_information.json`,
                    },
                    {
                        name: "station_information",
                        url: `${baseUrl}/station_information.json`,
                    },
                    {
                        name: "station_status",
                        url: `${baseUrl}/station_status.json`,
                    },
                    {
                        name: "free_bike_status",
                        url: `${baseUrl}/free_bike_status.json`,
                    },
                ],
            },
        },
    };
};

export default getGbfsIndex;
