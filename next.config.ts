const nextConfig = {
  devIndicators: {
    appIsrStatus: process.env.HIDE_DEV_TOOLS !== 'true',
    buildActivity: process.env.HIDE_DEV_TOOLS !== 'true',
  },
  experimental: {
    turbo: {
      root: __dirname,
    },
    devOverlay: process.env.HIDE_DEV_TOOLS !== 'true',
  }
};

export default nextConfig;
