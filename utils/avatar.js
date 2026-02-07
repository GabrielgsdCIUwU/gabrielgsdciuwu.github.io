import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import axios from "axios";
import sharp from "sharp"
import { CronJob } from "cron";

const avatarUrl = "https://avatars.githubusercontent.com/u/104272301";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const avatarPath = path.join(__dirname, "../resources/img", "avatar_lq.jpg");

async function downloadAndCompressAvatar() {
    const response = await axios.get(avatarUrl, {responseType: "arraybuffer"});
    const buffer = Buffer.from(response.data);
    const compressed = await sharp(buffer)
                                .resize(200)
                                .jpeg({quality: 40})
                                .toBuffer();
    
    fs.writeFileSync(avatarPath, compressed);
}

if (!fs.existsSync(avatarPath)) {
    await downloadAndCompressAvatar();
}

CronJob.from({
    cronTime: "0 0 1 */6 *",
    onTick: await downloadAndCompressAvatar(),
    start: true
});