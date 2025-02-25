import "module-alias/register";

import updateBikes from "@/bikes/updateBikes";
import { CronJob } from "cron";

import "./server";

new CronJob("*/30 * * * * *", updateBikes, null, true);
