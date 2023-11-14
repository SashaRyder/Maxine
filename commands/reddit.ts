import { CommandInterface } from "./CommandInterface";
import {
  Client,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import axios from "axios";
import _ from "underscore";
import fs from "fs/promises";

const template = `https://www.reddit.com/r/{0}/hot/.json`;

const execute = async (interaction: CommandInteraction) => {
  const subreddit = interaction.options.get("subreddit").value as string;
  const interval = interaction.options.get("interval").value as number;
  const guildId = interaction.guildId;
  const channelId = interaction.channelId;
  const client = interaction.client;
  const file = await fs.readFile("/data/schedule.json", { encoding: "utf8" });
  let scheduleFile = JSON.parse(file);
  scheduleFile = [
    ...scheduleFile,
    {
      subreddit,
      interval,
      guildId,
      channelId,
    },
  ];
  await fs.writeFile(
    "/data/schedule.json",
    JSON.stringify(scheduleFile, null, 4)
  );
  console.log("Schedule Write Success");
  startSchedule(client, subreddit, interval, guildId, channelId, true);
  interaction.reply({ content: "Schedule set!", ephemeral: true });
};

const startSchedule = (
  client: Client,
  subreddit: string,
  interval: number,
  guildId: string,
  channelId: string,
  postNow?: boolean
) => {
  const generatePost = async () => {
    const url = template.replace("{0}", subreddit);
    const { data } = await axios.get(url);
    //TODO: Sort out gallery embeds.
    const post = _.sample(
      data.data.children.filter(
        (post: { data: { domain: string } }) =>
          post.data.domain !== "reddit.com"
      )
    ).data;
    let postContentUrl: string = post.url;
    let contentUrl = "";
    let embed = new EmbedBuilder()
      .setAuthor({
        name: post.author,
        url: `https://reddit.com/u/${post.author}`,
      })
      .setColor("#FF5700")
      .setTitle(post.title)
      .setTimestamp(new Date());
    if (post.domain === "i.redd.it") {
      embed = embed
        .setImage(postContentUrl)
        .setURL(`https://reddit.com${post.permalink}`);
    } else {
      contentUrl = postContentUrl;
    }

    const channelToSend = client.guilds.cache
      .find((guild) => guild.id === guildId)
      .channels.cache.find((channel) => channel.id === channelId);
    if (channelToSend && channelToSend.isTextBased()) {
      if (contentUrl) {
        channelToSend.send(contentUrl);
      } else {
        channelToSend.send({ embeds: [embed] });
      }
    }
  };
  setInterval(generatePost, interval * 60 * 60 * 1000);
  if (postNow) {
    generatePost();
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reddit")
    .setDescription("Polls reddit hot and posts a random post periodically")
    .addStringOption((option) =>
      option
        .setName("subreddit")
        .setDescription("The subreddit to pull from")
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option
        .setName("interval")
        .setDescription("Hours between poll")
        .setRequired(true)
    ),
  execute,
  startSchedule,
} as CommandInterface & { startSchedule: typeof startSchedule };

export { startSchedule };
