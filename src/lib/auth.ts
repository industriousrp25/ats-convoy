import NextAuth from 'next-auth'
import Discord from 'next-auth/providers/discord'
import { createServiceClient } from './supabase/server'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'discord') return false
      const supabase = createServiceClient()
      const discordProfile = profile as { id: string; username: string; avatar: string | null }
      const avatarUrl = discordProfile.avatar
        ? `https://cdn.discordapp.com/avatars/${discordProfile.id}/${discordProfile.avatar}.png`
        : null

      const { error } = await supabase.from('users').upsert(
        {
          discord_id: discordProfile.id,
          username: discordProfile.username,
          avatar_url: avatarUrl,
        },
        { onConflict: 'discord_id' }
      )
      if (error) console.error('upsert user failed:', error)
      return true
    },

    async jwt({ token, account, profile }) {
      if (account?.provider === 'discord' && profile) {
        const discordProfile = profile as { id: string }
        token.discordId = discordProfile.id

        const supabase = createServiceClient()
        const { data } = await supabase
          .from('users')
          .select('id')
          .eq('discord_id', discordProfile.id)
          .single()
        if (data) token.supabaseUserId = data.id
      }
      return token
    },

    async session({ session, token }) {
      session.user.discordId = token.discordId as string
      session.user.supabaseUserId = token.supabaseUserId as string
      return session
    },
  },
})

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      discordId: string
      supabaseUserId: string
    }
  }
}
