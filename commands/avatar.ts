import axios from "axios";
import { CommandInterface } from "./CommandInterface";
import { CommandInteraction, SlashCommandBuilder, EmbedBuilder, ColorResolvable } from "discord.js";
import getColors from 'get-image-colors';

const data = new SlashCommandBuilder()
  .setName("avatar")
  .setDescription("Retrieves avatar for yourself or a user!")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("User you want to see the avatar for")
  );

const execute = async (interaction: CommandInteraction) => {
  await interaction.deferReply();
  const user = interaction.options.get("user")?.user || interaction.user;
  const avatar = user.displayAvatarURL({ size: 2048 }).replace(".webp?", ".png?"); //Ensures we don't replace gifs
  const imgBuffer = await axios.get(avatar, { responseType: 'arraybuffer' }).then((val) => Buffer.from(val.data, "base64"));
  const color = await getColors(imgBuffer);
  const avatarEmbed = new EmbedBuilder()
    .setColor(color[0].hex() as ColorResolvable)
    .setTitle(`Avatar for ${user.username}`)
    .setImage(avatar)
    .setTimestamp(new Date())
  interaction.followUp({ embeds: [avatarEmbed] });
};

export { data, execute };