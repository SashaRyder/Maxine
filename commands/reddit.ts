import { CommandInterface } from "./CommandInterface";
import {
  Client,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import _ from "underscore";
import fs from "fs/promises";
import moment from "moment";
import { getRedditPost } from "../getRedditPost";

const execute = async (interaction: CommandInteraction) => {
  const subreddit = interaction.options.get("subreddit").value as string;
  const interval = interaction.options.get("interval").value as number;
  const guildId = interaction.guildId;
  const channelId = interaction.channelId;
  const file = await fs.readFile("/data/schedule.json", { encoding: "utf8" });
  let scheduleFile = JSON.parse(file);
  scheduleFile = [
    ...scheduleFile,
    {
      subreddit,
      interval,
      guildId,
      channelId,
      posted: [],
      lastRan: moment().subtract("1", "day")
    },
  ];
  await fs.writeFile(
    "/data/schedule.json",
    JSON.stringify(scheduleFile, null, 4)
  );
  console.log("Schedule Write Success");
  interaction.reply({ content: "Schedule set!", ephemeral: true });
};

const submitPost = async (
  client: Client,
  subreddit: string,
  interval: number,
  guildId: string,
  channelId: string,
  posted: string[],
  lastRan: Date,
) => {
  const lastRanMoment = moment(lastRan);
  if(lastRan && lastRanMoment.add(interval, "hours").isAfter(new Date())) {
    return;
  }
  const post = await getRedditPost(subreddit, posted);
  if(!post) return;
  let embed: EmbedBuilder = null;
  if (post.domain === "i.redd.it") {
    embed = new EmbedBuilder()
      .setAuthor({
        name: post.author,
        url: post.authorUrl,
      })
      .setColor("#FF5700")
      .setTitle(post.title)
      .setTimestamp(new Date())
      .setImage(post.url)
      .setURL(post.permalink);
  }
  const channelToSend = client.guilds.cache
    .find((guild) => guild.id === guildId)
    .channels.cache.find((channel) => channel.id === channelId);
  if (channelToSend && channelToSend.isTextBased()) {
    if (embed) {
      await channelToSend.send({ embeds: [embed] });
    } else {
      await channelToSend.send(post.url);
    }
  }
  const file = await fs.readFile("/data/schedule.json", { encoding: "utf8" });
  let scheduleFile: {
    subreddit: string;
    interval: number;
    guildId: string;
    channelId: string;
    posted: string[];
    lastRan: Date;
  }[] = JSON.parse(file);
  let thisSchedule = scheduleFile.findIndex(
    (task) => task.channelId === channelId && task.subreddit === subreddit
  );
  scheduleFile[thisSchedule].posted = [
    ...(scheduleFile[thisSchedule].posted || []),
    post.id,
  ];
  scheduleFile[thisSchedule].lastRan = new Date();
  await fs.writeFile(
    "/data/schedule.json",
    JSON.stringify(scheduleFile, null, 4)
  );
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
  submitPost,
} as CommandInterface & { submitPost: typeof submitPost };

export { submitPost };
