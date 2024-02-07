import { Guild, GuildMember } from "discord.js"

export const isAdmin = async (user: GuildMember, guild: Guild): Promise<boolean> => {
    if((await guild.fetchOwner()).id === user.id) {
        return true;
    }
    const me = guild.members.me;
    const myHighestPermission = me.roles.highest.position;
    const usersHighestPermission = user.roles.highest.position;
    return usersHighestPermission >= myHighestPermission;
}