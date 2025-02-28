import fastify from "fastify";

import getBikeHistory from "./endpoints/getBikeHistory";
import getFeatures from "./endpoints/getFeatures";

const app = fastify();

app.get("/getBikeHistory", getBikeHistory);
app.get("/getFeatures", getFeatures);

app.listen({ port: 7423 }).then(() => {
    console.log("Server is running on port 7423");
});

declare module "fastify" {
    interface RouteGenericInterface {
        Querystring: Record<string, string>;
    }
}
