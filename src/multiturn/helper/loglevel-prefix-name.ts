import * as logger from 'loglevel';

export default function prefixName(log: logger.Logger) {
  const factory = log.methodFactory;
  // Cast to any to overwrite read-only property
  (log as any).methodFactory = (methodName: string, level: 0 | 1 | 2 | 3 | 4 | 5,
    loggerName: string) => {

    const raw = factory(methodName, level, loggerName);

    const func = (...message: any[]) => {
      raw(`[${loggerName}]`, ...message);
    };
    return func;
  };
  // Reset level for method factory to take effect
  log.setLevel(log.getLevel());
}

// prefixName(logger);
