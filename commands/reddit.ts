import { CommandInterface } from "./CommandInterface";
import {
  Client,
  CommandInteraction,
  EmbedBuilder,
  InteractionType,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import _ from "underscore";
import moment from "moment";
import { getRedditPost } from "../getRedditPost";
import { Reddit, Sequelize as SequelizeModel } from "../models";
import { Sequelize } from "sequelize";

const execute = async (interaction: CommandInteraction) => {
  if (interaction.type !== InteractionType.ApplicationCommand || !interaction.isChatInputCommand()) {
    return;
  }
  const sequelize = new Sequelize(SequelizeModel.configuration);
  const reddit = Reddit.init(Reddit.configuration, { sequelize });
  if (interaction.options.getSubcommand() === 'add') {
    const subreddit = interaction.options.get("subreddit").value as string;
    if(subreddit.includes("/")) {
      interaction.reply({ content: `${subreddit} is poorly formatted I think, I need the subreddit name only.`, ephemeral: true });
      return;
    }
    const interval = interaction.options.get("interval").value as number;
    const guildId = interaction.guildId;
    const channelId = interaction.channelId;
    const exists = await reddit.findOne({where: { subreddit, guildId, channelId }});
    if(exists) {
      interaction.reply({ content: `${subreddit} already exists!`, ephemeral: true });
      return;
    }
    await reddit.create({
      subreddit, interval, guildId, channelId,
      posted: JSON.stringify([]), lastRan: moment().seconds(0).milliseconds(0).toDate()
    });
    console.log("Schedule Write Success");
    interaction.reply({ content: "Schedule set!", ephemeral: true });
  }
  else if (interaction.options.getSubcommand() === 'remove') {
    const subreddit = interaction.options.get("subreddit").value as string;
    const guildId = interaction.guildId;
    const channelId = interaction.channelId;
    await reddit.destroy({
      where: {
        subreddit, channelId, guildId
      }
    });
    console.log("Schedule Delete Success");
    interaction.reply({ content: "Schedule deleted!", ephemeral: true });
  }
  else if (interaction.options.getSubcommand() === 'list') {
    const guildId = interaction.guildId;
    const channelId = interaction.channelId;
    const thisChannel = await reddit.findAll({ where: { channelId, guildId } });
    const content = "The following subreddits are active in this channel:\r\n" +
    `${thisChannel.map((reddit) => `/r/${reddit.subreddit} every ${reddit.interval} hour(s)`).join("\r\n")}`;
    await interaction.reply({ content });
  }
  else if (interaction.options.getSubcommand() === 'force') {
    await interaction.deferReply();
    const guildId = interaction.guildId;
    const tasks: Reddit[] = await reddit.findAll({ where: { guildId } });
    const groups = _.groupBy(tasks, x => x.channelId);
    for (const channel of Object.keys(groups)) {
      const grp = groups[channel];
      await submitPostsForChannel(
        interaction.client,
        grp,
        true
      );
    }
    interaction.reply("Force pull complete :)");
  }
};

const submitPostsForChannel = async (
  client: Client,
  group: Reddit[],
  force: boolean = false
) => {
  const { guildId, channelId } = group[0];
  const postsPromise = group.map((task) => generatePost(task, force));
  const posts = await Promise.all(postsPromise);

  const embeds = posts.filter((post) => post instanceof EmbedBuilder) as EmbedBuilder[];
  const urls = posts.filter((post) => typeof post === "string") as string[];

  const channel = client.guilds.cache
    .find((guild) => guild.id === guildId)
    .channels.cache.find((channel) => channel.id === channelId) as TextChannel;

  for (const embed of embeds) {
    await channel.send({ embeds: [embed] }); //Allows deleting of single embeds
  }
  for (const url of urls) {
    await channel.send(url); //make integration work properly
  }

};

const generatePost = async (task: Reddit, force: boolean): Promise<string | EmbedBuilder> => {
  const { interval, lastRan, posted, subreddit } = task;
  const postedArr = JSON.parse(posted) as string[];
  const lastRanMoment = moment(lastRan);
  if (!force && lastRan && lastRanMoment.add(interval, "hours").isAfter(new Date())) {
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
    .setDescription('Control reddit posts')
    .addSubcommand(subcommand => (
      subcommand
        .setName("add")
        .setDescription("Adds a subreddit to the auto post schedule")
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
        )
    ))
    .addSubcommand(subcommand => (
      subcommand
        .setName("remove")
        .setDescription("Removes a subreddit from the auto post schedule")
        .addStringOption((option) =>
          option
            .setName("subreddit")
            .setDescription("The subreddit to pull from")
            .setRequired(true)
        )
    ))
    .addSubcommand(subcommand => (
      subcommand
        .setName("list")
        .setDescription("Lists the subreddits and their intervals for the current channel")
    ))
    .addSubcommand(subcommand => (
      subcommand
        .setName("force")
        .setDescription("Force push reddit posts to channels")
    ))
  ,
  execute,
  submitPostsForChannel,
} as CommandInterface & { submitPostsForChannel: typeof submitPostsForChannel };

export { submitPostsForChannel };
