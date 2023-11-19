import { Client, TextChannel } from "discord.js";
import express from "express";

export const startInspector = (client: Client) => {
  const app = express();
  app.get("/", async function (req, res) {
    const data = client.guilds.cache.map((guild) => ({
      id: guild.id,
      name: guild.name,
    }));
    res.send(`
    <ul>
    ${data.map(
      (data) => `<a href='/guild/${data.id}'><li>${data.name}</li></a>`
    )}
    </ul>
    `);
  });

  app.get("/guild/:id", (req, res) => {
    const id = req.params.id;
    const data = client.guilds.cache
      .find((guild) => guild.id === id)
      .channels.cache.filter((channel) => channel.isTextBased())
      .map((channel) => ({
        id: channel.id,
        name: channel.name,
      }));
    res.send(`
  <ul>
  ${data.map(
    (data) => `<a href='/guild/${id}/${data.id}'><li>${data.name}</li></a>`
  )}
  </ul>
  `);
  });

  app.get("/guild/:guildId/:channelId/:before?", async (req, res) => {
    const guildid = req.params.guildId;
    const channelid = req.params.channelId;
    const before = req.params.before || null;
    if (!guildid || !channelid) {
      return res.send("No..");
    }
    const channel = client.guilds.cache
      .find((guild) => guild.id === guildid)
      .channels.cache.find(
        (channel) => channel.id === channelid
      ) as TextChannel;
    const messages = await channel.messages.fetch({ limit: 25, before });
    res.send(`
  <ul>
  ${messages.map(
    (data) =>
      `<li><p>${data.author.username} - ${data.createdAt.toISOString()}</p><p>${
        data.content
      }</p></li>`
  )}
  </ul>
  <a href='/guild/${guildid}/${channelid}/${messages.last().id}'>Next Page</a>
  `);
  });

  app.listen(8075);
};
