import _ from "underscore";
import { CommandInterface } from "./CommandInterface";
import { CommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getColorFromURL } from "color-thief-node";

const execute = async (interaction: CommandInteraction) => {
    const user = interaction.options.get("user")?.user || interaction.user;
    const avatar = user.displayAvatarURL({size: 2048 }).replace(".webp?", ".png?"); //Ensures we don't replace gifs
    const color = await getColorFromURL(avatar);
    const avatarEmbed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`Avatar for ${user.username}`)
        .setImage(avatar)
        .setTimestamp(new Date())
    interaction.reply({embeds: [avatarEmbed]});
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Retrieves avatar for yourself or a user!")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User you want to see the avatar for")
    ),
  execute,
} as CommandInterface;
