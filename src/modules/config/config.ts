let config: {
  SMTP_HOST: string
  SMTP_USER: string
  SMTP_PASS: string
  SMTP_FROM: string
  MONGO_URL: string
  JWT_SECRET: string
} | null = null

export const setConfig = (c: typeof config) => { config = c }
export const getConfig = () => {
  if (!config) throw new Error('Config not initialized')
  return config!
}
