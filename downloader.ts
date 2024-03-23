import tmp from "tmp";

const { NICKNAME } = process.env;


export const downloadVideo = async (url: string, showWarnings: boolean, isClip: boolean): Promise<string> => {
    const randomFileName = tmp.tmpNameSync({ dir: "./", prefix: NICKNAME });
    let cmd = `yt-dlp "${url}"`;
    if (!showWarnings) {
        cmd += " --no-warnings";
    }
    cmd += " --user-agent facebookexternalhit/1.1 --no-check-certificate -f 'bv*[ext=mp4][vcodec=h264]+ba[ext=m4a]/b[ext=mp4][vcodec=h264]/bv[vcodec=h264]+ba/bv+ba/b' --merge-output-format mp4";
    if (!isClip) {
        cmd += " --max-filesize 100m";
    }
    cmd += ` -o "${randomFileName}.%(ext)s"`;
    const {stdout, exited} = Bun.spawn({cmd: cmd.split(" ")});
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
        if (!Bun.file(filePath).exists()) {
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
        return filePath;
    }
}