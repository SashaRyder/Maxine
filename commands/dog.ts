import { CommandInterface } from "./CommandInterface";
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import axios from "axios";


const execute = async (interaction: CommandInteraction) => {
  const { data } = await axios.get(
    "https://dog.ceo/api/breeds/image/random"
  );

  await interaction.reply(data.message);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dog")
    .setDescription("Returns a picture of a dog"),
  execute,
} as CommandInterface;
