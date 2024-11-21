type LogLevel = "info" | "error" | "warn" | "debug";

class Logger {
  private log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = {
      timestamp,
      level,
      message,
      ...(meta && { meta }),
    };
    console[level](JSON.stringify(logMessage));
  }

  info(message: string, meta?: any) {
    this.log("info", message, meta);
  }

  error(message: string, meta?: any) {
    this.log("error", message, meta);
  }

  warn(message: string, meta?: any) {
    this.log("warn", message, meta);
  }

  debug(message: string, meta?: any) {
    this.log("debug", message, meta);
  }
}

export const logger = new Logger();
