import { Guild, GuildMember } from "discord.js"

export const isAdmin = async (user: GuildMember, guild: Guild): Promise<boolean> => {
    if((await guild.fetchOwner()).id === user.id) {
        return true;
    }
    const me = guild.members.me;
    const myHighestPermission = me.roles.highest.position;
    const guildRoles = guild.roles.cache.filter((role) => role.position <= myHighestPermission);
    for (var role of guildRoles) {
        if (user.roles.cache.has(role[0])) {
            return true;
        }
    }
    return false;
}