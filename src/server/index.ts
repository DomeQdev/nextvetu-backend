import fastify from "fastify";
import fastifyCors from "@fastify/cors";

import getBikeHistory from "./endpoints/getBikeHistory";
import getFeatures from "./endpoints/getFeatures";
import getLastRentals from "./endpoints/getLastRentals";
import getMostPopularBikes from "./endpoints/getMostPopularBikes";
import getMostPopularRoutes from "./endpoints/getMostPopularRoutes";
import getMostPopularStations from "./endpoints/getMostPopularStations";
import getRouteRentals from "./endpoints/getRouteRentals";
import getStation from "./endpoints/getStation";
import getStationHistory from "./endpoints/getStationHistory";

import getGbfsIndex from "./endpoints/gbfs/index";
import getSystemInformation from "./endpoints/gbfs/systemInformation";
import getStationInformation from "./endpoints/gbfs/stationInformation";
import getStationStatus from "./endpoints/gbfs/stationStatus";
import getFreeBikeStatus from "./endpoints/gbfs/freeBikeStatus";

const app = fastify();

app.get("/getBikeHistory", getBikeHistory);
app.get("/getFeatures", getFeatures);
app.get("/getLastRentals", getLastRentals);
app.get("/getMostPopularBikes", getMostPopularBikes);
app.get("/getMostPopularRoutes", getMostPopularRoutes);
app.get("/getMostPopularStations", getMostPopularStations);
app.get("/getRouteRentals", getRouteRentals);
app.get("/getStation", getStation);
app.get("/getStationHistory", getStationHistory);

app.get("/gbfs/gbfs.json", getGbfsIndex);
app.get("/gbfs/system_information.json", getSystemInformation);
app.get("/gbfs/station_information.json", getStationInformation);
app.get("/gbfs/station_status.json", getStationStatus);
app.get("/gbfs/free_bike_status.json", getFreeBikeStatus);

app.register(fastifyCors, { origin: "*" });

app.listen({ port: 7423 }).then(() => {
    console.log("Server is running on port 7423");
});

declare module "fastify" {
    interface RouteGenericInterface {
        Querystring: Record<string, string>;
    }
}
