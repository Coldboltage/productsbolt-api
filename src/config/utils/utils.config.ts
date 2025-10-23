import { registerAs } from '@nestjs/config';

export default registerAs('utils', () => ({
  enableJobs: process.env.ENABLE_JOBS,
  laptopIp: process.env.LAPTOP_IP,
  discordAlerts: process.env.DISCORD_ALERTST,
  // identification
  serviceName: process.env.SERVICE_NAME,
  serviceVersion: process.env.SERVICE_VERSION,
  deploymentEnv: process.env.NODE_ENV,
  grafanaPassword: process.env.GRAFANA_PASSWORD,
}));
