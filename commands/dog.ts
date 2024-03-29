import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import axios from "axios";

const data = new SlashCommandBuilder()
	.setName("dog")
	.setDescription("Returns a picture of a dog");

const execute = async (interaction: CommandInteraction) => {
	const { data } = await axios.get("https://dog.ceo/api/breeds/image/random");

	await interaction.reply(data.message);
};

export { data, execute };
