//This is a joke command.

import _ from "underscore";
import { CommandInterface } from "./CommandInterface";
import { CommandInteraction, GuildMember, SlashCommandBuilder } from "discord.js";
import { isAdmin } from "../isAdmin";


const execute = async (interaction: CommandInteraction) => {
    const user = interaction.options.get("user").user;
    if(!await isAdmin(interaction.member as GuildMember, interaction.guild)) {
        await interaction.reply("🤓☝️ You are not an admin. A warning has been filed with the admins of this guild.");
        return;
    }
    await interaction.reply(`${user} you have been warned 🤓☝️. Further warnings will have SEVERE!!!!11 punishments.`);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warns a user for misconduct!")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User you want to warn!")
        .setRequired(true)
    ),
  execute,
} as CommandInterface;
