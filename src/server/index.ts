import fastify from "fastify";

import getBikeHistory from "./endpoints/getBikeHistory";
import getLiveBikes from "./endpoints/getLiveBikes";
import getStations from "./endpoints/getStations";

const app = fastify();

app.get("/getBikeHistory", getBikeHistory);
app.get("/getLiveBikes", getLiveBikes);
app.get("/getStations", getStations);

app.listen({ port: 7423 }).then(() => {
    console.log("Server is running on port 7423");
});

declare module "fastify" {
    interface RouteGenericInterface {
        Querystring: Record<string, string>;
    }
}
