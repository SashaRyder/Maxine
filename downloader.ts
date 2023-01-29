import { exec } from "child_process";
import tmp from "tmp";
import util from "util";
import fs from "fs";

const { NICKNAME } = process.env;

const execAsync = util.promisify(exec);

export const downloadVideo = async (url: string, showWarnings: boolean, isClip: boolean): Promise<string> => {
    const randomFileName = tmp.tmpNameSync({ dir: "./", prefix: NICKNAME });
    let cmd = `yt-dlp "${url}"`;
    if (!showWarnings) {
        cmd += " --no-warnings";
    }
    cmd += " --user-agent facebookexternalhit/1.1 -f 'bv*[ext=mp4][vcodec=h264]+ba[ext=m4a]/b[ext=mp4][vcodec=h264]/bv[vcodec=h264]+ba/bv+ba/b' --merge-output-format mp4";
    if (!isClip) {
        cmd += " --max-filesize 100m";
    }
    cmd += ` -o "${randomFileName}.%(ext)s"`;
    const process = await execAsync(cmd);
    if (!process.stderr) {
        const extArr = RegExp(`${randomFileName}.(.*)`)
            .exec(process.stdout)[0]
            .split(".")
            .splice(-1, 1)
            .filter((x) => x !== "");
        const isMerger = RegExp("Merging formats into").exec(process.stdout);
        const ext = extArr.length > 0 && !isMerger ? extArr[0] : "mp4";
        const filePath = `${randomFileName}.${ext}`;
        if (!fs.existsSync(filePath)) {
            const possibleError = RegExp("File is larger than max-filesize").exec(
                process.stdout
            );
            if (possibleError) {
                throw new Error("Can't find a small enough file");
            }
            else {
                throw new Error("Unknown Error");
            }
        }
        return filePath;
    }
}