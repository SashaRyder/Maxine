import _ from "underscore";
import { CommandInteraction, SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
.setName("8ball")
.setDescription("8ball answers any question!")
.addStringOption((option) =>
  option
    .setName("question")
    .setDescription("The question to ask the magic 8ball")
    .setRequired(true)
);

const execute = async (interaction: CommandInteraction) => {
  const opts = [
    "It is certain",
    "Without a doubt",
    "Definitely",
    "Most likely",
    "Outlook good",
    "Yes!",
    "Try again",
    "Reply hazy",
    "Can't predict",
    "No!",
    "Unlikely",
    "Sources say no",
    "Very doubtful",
  ];

  await interaction.reply(_.sample(opts));
};

export { data, execute };