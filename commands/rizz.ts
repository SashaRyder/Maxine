import { CommandInterface } from "./CommandInterface";
import { CommandInteraction, SlashCommandBuilder } from "discord.js";


const execute = async (interaction: CommandInteraction) => {
    const userToRizz = interaction.options.get("user").user;
    await interaction.reply(`Hi ${userToRizz}
I am wobot
Beep book beep
:robot:
Beep beep
Friends uwu`);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rizz")
    .addUserOption((user) => user.setName("user").setDescription("User you want to rizz").setRequired(true))
    .setDescription("Rizz command. Nuff said."),
  execute,
} as CommandInterface;
