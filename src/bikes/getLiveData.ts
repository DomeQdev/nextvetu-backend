const domains = [
    "ap", // System Rowerów Miejskich w Pszczynie Poland
    "bm", // Nextbike Polska
    "bp", // BIKER Białystok Poland
    "cw", // Chełmski Rower
    "dp", // Piotrkowski Rower Miejski Poland
    "fp", // Wolsztyński Rower Miejski
    "gp", // GRM Grodzisk Poland
    "jp", // Częstochowski Rower Miejski Poland
    "jr", // Veloyou - Józefowski Rower Miejski
    "km", // OK Bike Poland
    "kr", // Kołobrzeski Rower Miejski Poland
    "lp", // Łódzki Rower Publiczny
    "mk", // Koło Marek Poland
    "np", // Nextbike Poland
    "oa", // ŁoKeR - Łomża
    "ob", // Opole Bike Poland
    "or", // Pruszkowski Rower Miejski Poland
    "os", // Otwocki Rower Miejski Poland
    "pd", // Ciechanowski Rower Miejski Poland
    "pg", // System Roweru Gminnego Poland
    "pi", // Piaseczyński Rower Miejski Poland
    "pj", // JasKółka
    "pl", // WRM nextbike Poland
    "pn", // Koniński Rower Miejski Poland
    "po", // Rower Miejski w Ostrowie Wielkopolskim Poland
    "ps", // Koszaliński Rower Miejski Poland
    "pu", // Pobiedziski Rower Gminny Poland
    "pw", // Rowerowe Łódzkie
    "py", // Tychowski Rower Miejski Poland
    "rm", // Rower Miejski Szamotuły
    "rq", // Rower Powiatowy Sokołów Podlaski
    "sm", // Siedlecki Rower Miejski Poland
    "tn", // Tarnowski Rower Miejski Poland
    "vw", // VETURILO 3.0
    "zp", // Zgierski Rower Miejski Poland
    "zy", // Żyrardowski Rower Miejski Poland
    "zz", // METROROWER
];
const liveDataEndpoint = `https://api.nextbike.net/maps/nextbike-live.flatjson?domains=${domains.join(",")}`;

export type LiveData = {
    bikes: Bike[];
    places: Place[];
};

type Bike = {
    number: string;
    bike_type: number;
    boardcomputer: number;
    pedelec_battery: number | null;
    place_id: number;
};

type Place = {
    uid: number;
    lat: number;
    lng: number;
    bike: boolean;
    name: string;
    number: number;
};

export default async () => {
    return fetch(liveDataEndpoint)
        .then((res) => res.json() as Promise<LiveData>)
        .catch(() => null);
};
