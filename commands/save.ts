import tmp from "tmp";
import { uploadFile } from "../storage";
import { downloadVideo } from "../downloader";
import {
  AttachmentBuilder,
  CommandInteraction,
  RESTJSONErrorCodes,
  SlashCommandBuilder,
} from "discord.js";
import { unlink } from "node:fs/promises"
import { timestampToSeconds } from "../timestampToSeconds";
import { secondsToTimestamp } from "../secondsToTimestamp";

const { NICKNAME } = process.env;

const data = new SlashCommandBuilder()
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
  );

const execute = async (interaction: CommandInteraction) => {
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
    const startTime = timestampToSeconds(clip_start);
    const endTime = timestampToSeconds(clip_end);
    const duration = secondsToTimestamp(endTime - startTime)
    const ffmpegCommand = `-ss ${secondsToTimestamp(startTime)} -i "${filePath}" -to ${duration} "${secondaryTempFile}.${ext}"`;
    filePath = `${secondaryTempFile}.${ext}`;
    const command = `ffmpeg ${ffmpegCommand}`;
    const { stderr } = Bun.spawn(command.split(" "));
    const stderrStr = await new Response(stderr).text();
    if (stderrStr) console.error(stderrStr);
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
      await interaction.followUp({ content: `Here you go ^_^ \r\n\r\n ${azureUrl}` });
    } else {
      await interaction.followUp(
        `We got an oopsie :( Error code is ${error.code}; ${error.message}`
      );
    }
  }
  Bun.file(filePath).exists() && unlink(filePath);
  Bun.file(firstFilePath).exists() && unlink(firstFilePath);
};

export { data, execute };