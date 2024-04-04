import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import axios from "axios";
import { WEB_USER_AGENT } from "../consts";
import * as cheerio from "cheerio";

const data = new SlashCommandBuilder()
	.setName("time")
	.setDescription("Check the time for a location")
	.addStringOption((option) =>
		option
			.setName("location")
			.setDescription("Location of where you want to search")
			.setRequired(true),
	);

const execute = async (interaction: CommandInteraction) => {
	const location = interaction.options.get("location")?.value;
	await interaction.deferReply();

	const $ = await axios
		.get<string>(`https://www.bing.com/search?q=time+in+${location}`, {
			headers: { "User-Agent": WEB_USER_AGENT },
		})
		.then((response) => cheerio.load(response.data));

	const text = $(".baselClock .b_focusLabel").text();
	const time = $("#digit_time").text();

	await interaction.followUp(`${text} is ${time}`);
};

export { data, execute };
