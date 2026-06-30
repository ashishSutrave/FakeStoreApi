import fs from 'fs';
import path from 'path';

type LogLevel = 'INFO' | 'DEBUG' | 'ERROR' | 'WARN';

class Logger {
  private readonly logDir: string;

  constructor() {
    this.logDir = path.resolve(process.cwd(), 'test-results', 'logs');
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const dataStr = data !== undefined ? `\n${JSON.stringify(data, null, 2)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  private writeToFile(level: LogLevel, message: string, data?: unknown): void {
    const logFile = path.join(this.logDir, `api-test-${new Date().toISOString().split('T')[0]}.log`);
    const formatted = this.formatMessage(level, message, data);
    fs.appendFileSync(logFile, `${formatted}\n`);
  }

  info(message: string, data?: unknown): void {
    const formatted = this.formatMessage('INFO', message, data);
    console.log(formatted);
    this.writeToFile('INFO', message, data);
  }

  debug(message: string, data?: unknown): void {
    const formatted = this.formatMessage('DEBUG', message, data);
    console.debug(formatted);
    this.writeToFile('DEBUG', message, data);
  }

  warn(message: string, data?: unknown): void {
    const formatted = this.formatMessage('WARN', message, data);
    console.warn(formatted);
    this.writeToFile('WARN', message, data);
  }

  error(message: string, data?: unknown): void {
    const formatted = this.formatMessage('ERROR', message, data);
    console.error(formatted);
    this.writeToFile('ERROR', message, data);
  }

  logRequest(method: string, url: string, headers?: Record<string, string>, payload?: unknown): void {
    this.info(`REQUEST [${method}] ${url}`, {
      headers: headers ?? {},
      payload: payload ?? null,
    });
  }

  logResponse(
    url: string,
    status: number,
    responseTimeMs: number,
    body: unknown,
    headers?: Record<string, string>
  ): void {
    this.info(`RESPONSE [${status}] ${url} (${responseTimeMs}ms)`, {
      status,
      responseTimeMs,
      headers: headers ?? {},
      body,
    });
  }
}

export const logger = new Logger();
