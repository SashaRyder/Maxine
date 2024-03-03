import tmp from "tmp";
import { CommandInterface } from "./CommandInterface";
import Jimp from "jimp";
import { AttachmentBuilder, CommandInteraction, SlashCommandBuilder } from "discord.js";

const { NICKNAME } = process.env;

const execute = async (interaction: CommandInteraction) => {
    await interaction.deferReply();
    const url = interaction.options.get("url");
    const attachment = interaction.options.get("attachment");
    const xTimes = interaction.options.get("xTimes").value as number;

    const link = url?.value as string || attachment?.attachment?.url as string;

    const fileExt = link.split(".").slice(-1)[0];
    const tmpFileName = tmp.tmpNameSync({ dir: "/tmp", prefix: `${NICKNAME}-img`, postfix: `.${fileExt}` });

    const jimpImg = await Jimp.read(link);

    const currSize = { width: jimpImg.getWidth(), height: jimpImg.getHeight() };
    const newSize = {
        width: xTimes > 0 ? currSize.width * xTimes : currSize.width / xTimes,
        height: xTimes > 0 ? currSize.height * xTimes : currSize.height / xTimes 
    };

    jimpImg.resize(newSize.width, newSize.height, async (_, jimp) => {
        await jimp.writeAsync(tmpFileName);
        interaction.followUp({ content: "Here you go ^_^", files: [new AttachmentBuilder(tmpFileName)] });
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("resize")
        .setDescription("resizes images by X times")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("url")
                .setDescription("Image URL to resize")
                .addStringOption((option) =>
                    option.setName("url").setDescription("image URL").setRequired(true)
                )
                .addNumberOption((option) =>
                    option.setName("xTimes")
                        .setDescription("times to resize, -x or x (-2, 2) for double in size or shrink by half")
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("attachment")
                .setDescription("Attachment to resize")
                .addAttachmentOption((option) =>
                    option
                        .setName("attachment")
                        .setDescription("image attachment")
                        .setRequired(true)
                )
                .addNumberOption((option) =>
                    option.setName("xTimes")
                        .setDescription("times to resize, -x or x (-2, 2) for double in size or shrink by half")
                        .setRequired(true)
                )
        ),
    execute,
} as CommandInterface;