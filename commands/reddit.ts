import { CommandInterface } from "./CommandInterface";
import {
  Client,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import _ from "underscore";
import moment from "moment";
import { getRedditPost } from "../getRedditPost";
import { Reddit, Sequelize as SequelizeModel } from "../models";
import { Sequelize } from "sequelize";

const execute = async (interaction: CommandInteraction) => {
  const sequelize = new Sequelize(SequelizeModel.configuration);
  const reddit = Reddit.init(Reddit.configuration, { sequelize });
  
  const subreddit = interaction.options.get("subreddit").value as string;
  const interval = interaction.options.get("interval").value as number;
  const guildId = interaction.guildId;
  const channelId = interaction.channelId;
  await reddit.create({
    subreddit, interval, guildId, channelId, 
    posted: JSON.stringify([]), lastRan: moment().seconds(0).milliseconds(0).toDate()
  });
  console.log("Schedule Write Success");
  interaction.reply({ content: "Schedule set!", ephemeral: true });
};

const submitPostsForChannel = async (
  client: Client,
  group: Reddit[],
  reddit: typeof Reddit
) => {
  const { guildId, channelId } = group[0];
  const postsPromise = group.map(generatePost);
  const posts = await Promise.all(postsPromise);

  const embeds = posts.filter((post) => post instanceof EmbedBuilder) as EmbedBuilder[];
  const urls = posts.filter((post) => typeof post === "string") as string[];

  const channel = client.guilds.cache
    .find((guild) => guild.id === guildId)
    .channels.cache.find((channel) => channel.id === channelId) as TextChannel;

  await channel.send({ embeds });
  for (const url of urls) {
    await channel.send(url); //make integration work properly
  }

};

const generatePost = async (task: Reddit): Promise<string | EmbedBuilder> => {
  const { interval, lastRan, posted, subreddit } = task;
  const postedArr = JSON.parse(posted) as string[];
  const lastRanMoment = moment(lastRan);
  if (lastRan && lastRanMoment.add(interval, "hours").isAfter(new Date())) {
    return;
  }
  const post = await getRedditPost(subreddit, postedArr);
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
  task.posted = JSON.stringify([...postedArr, post.id]);
  task.lastRan = moment().seconds(0).milliseconds(0).toDate();
  await task.save();
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
