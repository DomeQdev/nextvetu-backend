import { RouteHandlerMethod } from "fastify";

const getSystemInformation: RouteHandlerMethod = async () => {
    return {
        last_updated: Math.floor(Date.now() / 1000),
        ttl: 60 * 60,
        data: {
            system_id: "nextbike",
            language: "pl",
            name: "Nextbike",
            operator: "-",
            url: "https://nextbike.pl",
            phone_number: "00482219115",
            email: "info@nextbike.pl",
            timezone: "Europe/Warsaw",
            license_url: "https://spdx.org/licenses/CC0-1.0.html",
        },
    };
};

export default getSystemInformation;
