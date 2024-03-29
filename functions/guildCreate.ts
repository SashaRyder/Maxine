import { ActivityType, Client, Guild, TextChannel } from "discord.js";
import { pluralise } from "../utils";

const { NICKNAME, STATUS } = process.env;

export const guildCreate = (guild: Guild, client: Client) => {
	console.log(
		`Joined guild: ${guild.name}. We're now in ${
			client.guilds.cache.size
		} ${pluralise("guild", client.guilds.cache.size !== 1)}!`,
	);
	guild.members.cache
		.find((guildMemb) => guildMemb.id === client.user.id)
		.setNickname(NICKNAME);
	const channel = guild.channels.cache.find(
		(channel) => channel.name.toLowerCase() === "general",
	) as TextChannel;
	if (channel) {
		channel.send(`Hi, I'm ${NICKNAME} :) Thanks for inviting me!`);
	}

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
