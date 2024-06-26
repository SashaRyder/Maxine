import { ActivityType, Client } from "discord.js";
import { pluralise } from "../utils";

const { NICKNAME, STATUS } = process.env;

export const clientReady = (client: Client) => {
	console.log(
		`${NICKNAME} is online in ${client.guilds.cache.size} ${pluralise(
			"guild",
			client.guilds.cache.size !== 1,
		)}!`,
	);
	client.guilds.cache.forEach((guild) =>
		guild.members.cache
			.find((guildMemb) => guildMemb.id === client.user.id)
			.setNickname(NICKNAME),
	);
	if (STATUS) {
		const renderedStatus = STATUS.replaceAll(
			"{guildsCount}",
			client.guilds.cache.size.toString(),
		);
		client.user.setActivity(renderedStatus, {
			type: ActivityType.Playing,
		});
	}
};
