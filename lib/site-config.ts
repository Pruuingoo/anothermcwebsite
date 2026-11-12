export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SERVER_NAME || "Your Server",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
  serverDomain: process.env.NEXT_PUBLIC_SERVER_DOMAIN || "example.com",
  javaAddress: process.env.NEXT_PUBLIC_JAVA_ADDRESS || "play.example.com",
  bedrockAddress: process.env.NEXT_PUBLIC_BEDROCK_ADDRESS || process.env.NEXT_PUBLIC_JAVA_ADDRESS || "play.example.com",
  bedrockPort: process.env.NEXT_PUBLIC_BEDROCK_PORT || "19132",
  minecraftVersion: process.env.NEXT_PUBLIC_MINECRAFT_VERSION || "{{MINECRAFT_VERSION}}",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com",
  discordInvite: process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg/your-invite",
  supportUrl: process.env.NEXT_PUBLIC_SUPPORT_URL || "https://example.com/support",
  paymentSupportUrl: process.env.NEXT_PUBLIC_PAYMENT_SUPPORT_URL || "https://example.com/payment-support",
  resourceUrl: process.env.NEXT_PUBLIC_RESOURCE_URL || "https://example.com/resource",
  serverRegion: process.env.NEXT_PUBLIC_SERVER_REGION || "{{SERVER_REGION}}",
  playerCount: process.env.NEXT_PUBLIC_PLAYER_COUNT || "{{PLAYER_COUNT}}",
  uptime: process.env.NEXT_PUBLIC_SERVER_UPTIME || "{{SERVER_UPTIME}}",
  rating: process.env.NEXT_PUBLIC_SERVER_RATING || "{{SERVER_RATING}}",
  launchDate: process.env.NEXT_PUBLIC_LAUNCH_DATE || "{{LAUNCH_DATE}}",
  ownerName: process.env.NEXT_PUBLIC_OWNER_NAME || "{{OWNER_NAME}}",
  adminName: process.env.NEXT_PUBLIC_ADMIN_NAME || "{{ADMIN_NAME}}",
  developerName: process.env.NEXT_PUBLIC_DEVELOPER_NAME || "{{DEVELOPER_NAME}}",
  moderatorName: process.env.NEXT_PUBLIC_MODERATOR_NAME || "{{MODERATOR_NAME}}",
  announcementTitle: process.env.NEXT_PUBLIC_ANNOUNCEMENT_TITLE || "{{ANNOUNCEMENT_TITLE}}",
  announcementDate: process.env.NEXT_PUBLIC_ANNOUNCEMENT_DATE || "{{ANNOUNCEMENT_DATE}}",
  announcementContent: process.env.NEXT_PUBLIC_ANNOUNCEMENT_CONTENT || "{{ANNOUNCEMENT_CONTENT}}",
};

export function expandTemplateTokens(value: string) {
  return value
    .replaceAll("{{SERVER_NAME}}", siteConfig.name)
    .replaceAll("{{WEBSITE_URL}}", siteConfig.siteUrl)
    .replaceAll("{{SERVER_DOMAIN}}", siteConfig.serverDomain)
    .replaceAll("{{WEBSITE_DOMAIN}}", siteConfig.serverDomain)
    .replaceAll("{{JAVA_ADDRESS}}", siteConfig.javaAddress)
    .replaceAll("{{BEDROCK_ADDRESS}}", siteConfig.bedrockAddress)
    .replaceAll("{{BEDROCK_PORT}}", siteConfig.bedrockPort)
    .replaceAll("{{MINECRAFT_VERSION}}", siteConfig.minecraftVersion)
    .replaceAll("{{SUPPORT_EMAIL}}", siteConfig.supportEmail)
    .replaceAll("{{DISCORD_INVITE_URL}}", siteConfig.discordInvite)
    .replaceAll("{{SUPPORT_URL}}", siteConfig.supportUrl)
    .replaceAll("{{PAYMENT_SUPPORT_URL}}", siteConfig.paymentSupportUrl)
    .replaceAll("{{RESOURCE_URL}}", siteConfig.resourceUrl)
    .replaceAll("{{VOTE_SITE_1_URL}}", process.env.NEXT_PUBLIC_VOTE_SITE_1_URL || "https://example.com/vote-1")
    .replaceAll("{{VOTE_SITE_2_URL}}", process.env.NEXT_PUBLIC_VOTE_SITE_2_URL || "https://example.com/vote-2")
    .replaceAll("{{VOTE_SITE_3_URL}}", process.env.NEXT_PUBLIC_VOTE_SITE_3_URL || "https://example.com/vote-3")
    .replaceAll("{{VOTE_SITE_4_URL}}", process.env.NEXT_PUBLIC_VOTE_SITE_4_URL || "https://example.com/vote-4")
    .replaceAll("{{SERVER_REGION}}", siteConfig.serverRegion)
    .replaceAll("{{PLAYER_COUNT}}", siteConfig.playerCount)
    .replaceAll("{{SERVER_UPTIME}}", siteConfig.uptime)
    .replaceAll("{{SERVER_RATING}}", siteConfig.rating)
    .replaceAll("{{LAUNCH_DATE}}", siteConfig.launchDate)
    .replaceAll("{{OWNER_NAME}}", siteConfig.ownerName)
    .replaceAll("{{ADMIN_NAME}}", siteConfig.adminName)
    .replaceAll("{{DEVELOPER_NAME}}", siteConfig.developerName)
    .replaceAll("{{MODERATOR_NAME}}", siteConfig.moderatorName)
    .replaceAll("{{ANNOUNCEMENT_TITLE}}", siteConfig.announcementTitle)
    .replaceAll("{{ANNOUNCEMENT_DATE}}", siteConfig.announcementDate)
    .replaceAll("{{ANNOUNCEMENT_CONTENT}}", siteConfig.announcementContent)
    .replaceAll("{{LEADERBOARD_EMPTY_MESSAGE}}", "Connect your store data source to show supporter rankings.");
}
