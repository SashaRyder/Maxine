import tmp from "tmp";
import {chmod} from "node:fs/promises";

const { NICKNAME } = process.env;

export const downloadVideo = async (url: string, showWarnings: boolean, isClip: boolean): Promise<string> => {
    const randomFileName = tmp.tmpNameSync({ prefix: NICKNAME });
    const { stdout, exited } = Bun.spawn({
        cmd: [
            `yt-dlp`,
            !showWarnings ? '--no-warnings' : '',
            "--add-header", "User-Agent:facebookexternalhit/1.1",
            "--no-check-certificate", 
            "-f", 'bv*[ext=mp4][vcodec=h264]+ba[ext=m4a]/b[ext=mp4][vcodec=h264]/bv[vcodec=h264]+ba/bv+ba/b',
            !isClip ? '--max-filesize 100m' : '',
            `-o`, `${randomFileName}.%(ext)s`,
            "--merge-output-format", "mp4",
            url
        ]
    });
    const exitCode = await exited
    const stdoutstr = await new Response(stdout).text();
    if (!exitCode) {
        const extArr = RegExp(`${randomFileName}.(.*)`)
            .exec(stdoutstr)[0]
            .split(".")
            .splice(-1, 1)
            .filter((x) => x !== "");
        const isMerger = RegExp("Merging formats into").exec(stdoutstr);
        const ext = extArr.length > 0 && !isMerger ? extArr[0] : "mp4";
        const filePath = `${randomFileName}.${ext}`;
        if (!await Bun.file(filePath).exists()) {
            const possibleError = RegExp("File is larger than max-filesize").exec(
                stdoutstr
            );
            if (possibleError) {
                throw new Error("Can't find a small enough file");
            }
            else {
                throw new Error("Unknown Error");
            }
        }
        await chmod(filePath, 0o777); //Dirty fix for bun docker image
        return filePath;
    }
}