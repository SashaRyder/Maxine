import { CommandInteraction, SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
	.setName("rizz")
	.addUserOption((user) =>
		user
			.setName("user")
			.setDescription("User you want to rizz")
			.setRequired(true),
	)
	.setDescription("Rizz command. Nuff said.");

const execute = async (interaction: CommandInteraction) => {
	const userToRizz = interaction.options.get("user").user;
	await interaction.reply(`Hi ${userToRizz}
I am wobot
Beep book beep
:robot:
Beep beep
Friends uwu`);
};

export { data, execute };
