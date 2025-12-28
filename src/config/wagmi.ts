import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, arbitrum } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Relay Bridge Clone',
  projectId: 'YOUR_PROJECT_ID', // You can leave this as placeholder for dev
  chains: [base, arbitrum],
  ssr: true,
});