import fs, { link } from "fs";
import * as hbjs from "handbrake-js";
import { downloadVideo } from "../downloader";
import tmp from "tmp";
import { CommandInterface } from "./CommandInterface";
import { uploadFile } from "../storage";
import { AttachmentBuilder, CommandInteraction, Message, RESTJSONErrorCodes, SlashCommandBuilder } from "discord.js";

const { NICKNAME } = process.env;

const execute = async (interaction: CommandInteraction) => {
  const link = interaction.options.get("url");
  const attachment = interaction.options.get("attachment");

  const url = link?.value as string || attachment?.attachment?.url as string;
  const randomFileName = tmp.tmpNameSync({ dir: "/tmp", prefix: NICKNAME });
  const tmpNewFilename = `${randomFileName}.mp4`;
  await interaction.reply("Starting conversion!");
  try {
    const file = await downloadVideo(url, false, false);
    let progressText = "";
    let progressMsg: Message = null;
    const interval = setInterval(async () => {
      if (progressText) {
        if (progressMsg) {
          progressMsg = await progressMsg.edit(progressText);
        } else {
          progressMsg = await interaction.channel.send(progressText);
        }
      }
    }, 5000);
    hbjs
      .spawn({
        input: file,
        output: tmpNewFilename,
      })
      .on("progress", (progress) => {
        progressText = `${progress.percentComplete}% complete, ETA: ${progress.eta}`;
      })
      .on("complete", async () => {
        clearInterval(interval);
        if (progressMsg) {
          progressMsg.delete();
        }
        try {
          const interactionReply = await interaction
          .followUp({
            content: "Here you go!",
            files: [new AttachmentBuilder(tmpNewFilename)],
          });
          interactionReply.edit(
            interactionReply.content +
              `\r\n\r\nCopyable Link: <${
                interactionReply.attachments.first().url
              }>`
          );
        }
        catch(error) {
          if (
            error.code === RESTJSONErrorCodes.RequestEntityTooLarge
          ) {
            const azureUrl = await uploadFile(tmpNewFilename);
            await interaction.followUp({
              content: `Here you go! \r\n\r\n ${azureUrl}`,
            });
          } else {
            console.log(error);
            interaction.followUp(`Sorry babe, there was an error :( ${error.code}`);
          }
        }
        fs.unlinkSync(file);
        fs.unlinkSync(tmpNewFilename);
      });
  } catch (error) {
    console.log(error);
    interaction.followUp(`Sorry babe, there was an error :( ${error}`);
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("convert")
    .setDescription("Convert/Optimise video")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("url")
        .setDescription("Video URL to convert/optimise")
        .addStringOption((option) =>
          option.setName("url").setDescription("video URL").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("attachment")
        .setDescription("Attachment to convert/optimise")
        .addAttachmentOption((option) =>
          option
            .setName("attachment")
            .setDescription("video attachment")
            .setRequired(true)
        )
    ),
  execute,
} as CommandInterface;
