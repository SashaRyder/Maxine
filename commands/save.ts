import fs from "fs";
import { exec } from "child_process";
import util from "util";
import moment from "moment";
import tmp from "tmp";
import { CommandInterface } from "./CommandInterface";
import { uploadFile } from "../storage";
import { downloadVideo } from "../downloader";
import {
  AttachmentBuilder,
  CommandInteraction,
  RESTJSONErrorCodes,
  SlashCommandBuilder,
} from "discord.js";

const { NICKNAME } = process.env;

const execute = async (interaction: CommandInteraction) => {
  const execAsync = util.promisify(exec);
  await interaction.deferReply();
  const url = interaction.options.get("url").value as string;
  const clip_start = interaction.options.get("clip_start")?.value as string;
  const clip_end = interaction.options.get("clip_end")?.value as string;

  const isClip = !!clip_start && !!clip_end;

  let filePath = "";
  try {
    filePath = await downloadVideo(url, false, isClip);
  } catch (error) {
    await interaction.followUp(error.toString());
  }

  const firstFilePath = filePath;
  const ext = filePath.split(".").slice(-1)[0];
  const secondaryTempFile = tmp.tmpNameSync({
    dir: "/tmp",
    prefix: NICKNAME,
  });
  if (isClip) {
    const startTime = formatTime(clip_start);
    const endTime = formatTime(clip_end);
    const duration = calculateDuration(startTime, endTime);
    const ffmpegCommand = `-ss ${startTime} -i "${filePath}" -to ${duration} "${secondaryTempFile}.${ext}"`;
    filePath = `${secondaryTempFile}.${ext}`;
    const command = `ffmpeg ${ffmpegCommand}`;
    const ffmpegProcess = await execAsync(command);
    if (ffmpegProcess.stderr) console.error(ffmpegProcess.stderr);
  }
  try {
    const sentMessage = await interaction.followUp({ content: "Here you go ^_^", files: [new AttachmentBuilder(filePath)] });
    sentMessage.edit(
      sentMessage.content +
        `\r\n\r\nCopyable Link: <${sentMessage.attachments.first().url}>`
    );
  } catch (error) {
    if (error.code === RESTJSONErrorCodes.RequestEntityTooLarge) {
      const azureUrl = await uploadFile(filePath);
      await interaction.followUp({ content: `Here you go ^_^ \r\n\r\n ${azureUrl}`});
    } else {
      await interaction.followUp(
        `We got an oopsie :( Error code is ${error.code}; ${error.message}`
      );
    }
  }
  fs.existsSync(filePath) && fs.unlinkSync(filePath);
  fs.existsSync(firstFilePath) && fs.unlinkSync(firstFilePath);
};

const formatTime = (time: string) => {
  let timeSplit = time.split(":");
  timeSplit = timeSplit.map((time) => time.padStart(2, "0"));
  if (timeSplit.length == 2) {
    timeSplit = ["00", ...timeSplit];
  }
  return timeSplit.join(":");
};

const calculateDuration = (from: string, to: string) => {
  const fromDuration = moment.duration(from).asSeconds();
  const toDuration = moment.duration(to).asSeconds();
  const diff = toDuration - fromDuration;
  const diffMoment = moment.duration(diff, "seconds");
  return formatTime(
    `${diffMoment.hours()}:${diffMoment.minutes()}:${diffMoment.seconds()}`
  );
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("save")
    .setDescription("Saves video from URL")
    .addStringOption((option) =>
      option.setName("url").setDescription("video url").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("clip_start").setDescription("start of clip")
    )
    .addStringOption((option) =>
      option.setName("clip_end").setDescription("end of clip")
    ),
  execute,
} as CommandInterface;
