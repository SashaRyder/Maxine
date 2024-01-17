import { CommandInterface } from "./CommandInterface";
import {
  Client,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import _ from "underscore";
import fs from "fs/promises";
import moment from "moment";
import { getRedditPost } from "../getRedditPost";
import { Task } from "../task";

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

const submitPostsForChannel = async (
  client: Client,
  group: Task[]
) => {
  const { guildId, channelId } = group[0];
  const postsPromise = group.map(generatePost);
  const posts = await Promise.all(postsPromise);

  const embeds = posts.filter((post) => post instanceof EmbedBuilder) as EmbedBuilder[];
  const urls = posts.filter((post) => typeof post === "string") as string[];

  const channel = client.guilds.cache
    .find((guild) => guild.id === guildId)
    .channels.cache.find((channel) => channel.id === channelId) as TextChannel;

  await channel.send({ content: urls.join("\r\n"), embeds: embeds });

};

const generatePost = async (task: Task): Promise<string | EmbedBuilder> => {
  const { channelId, interval, lastRan, posted, subreddit } = task;
  const lastRanMoment = moment(lastRan);
  if (lastRan && lastRanMoment.add(interval, "hours").isAfter(new Date())) {
    return;
  }
  const post = await getRedditPost(subreddit, posted);
  if (!post) return;
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
  const file = await fs.readFile("/data/schedule.json", { encoding: "utf8" });
  let scheduleFile: Task[] = JSON.parse(file);
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
  return embed ?? post.url;
}

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
  submitPostsForChannel,
} as CommandInterface & { submitPostsForChannel: typeof submitPostsForChannel };

export { submitPostsForChannel };
