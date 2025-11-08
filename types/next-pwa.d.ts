declare module 'next-pwa' {
  interface WithPWAOptions {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    buildExcludes?: string[];
    swcMinify?: boolean;
    runtimeCaching?: any[];
    fallbacks?: Record<string, string>;
    cacheOnFrontEndNav?: boolean;
    reloadOnOnline?: boolean;
    [key: string]: any;
  }

  function withPWA(options?: WithPWAOptions): (config: any) => any;
  export = withPWA;
}