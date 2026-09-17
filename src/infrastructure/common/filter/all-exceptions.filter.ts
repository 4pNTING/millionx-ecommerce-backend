import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GraphQLError } from 'graphql';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // === ตรวจสอบว่าเป็น GraphQL หรือไม่ ===
    if (host.getType().toString() === 'graphql') {
      // แกะข้อความ Error ออกมาทำความสะอาด
      let message = 'Internal server error';
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let retryAfterSeconds: number | undefined;
      if (exception instanceof HttpException) {
        statusCode = exception.getStatus();
        const resBody = exception.getResponse();
        if (typeof resBody === 'string') message = resBody;
        else if (typeof resBody === 'object' && resBody !== null) {
          const rawMessage = (resBody as any).message || JSON.stringify(resBody);
          message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
          retryAfterSeconds = (resBody as any).retryAfterSeconds;
        }
      } else if (exception instanceof Error) {
        message = exception.message;
      } else if (typeof exception === 'string') {
        message = exception;
      }

      // GraphQL transport ຍັງໃຊ້ HTTP 200; status ຂອງ HttpException ຢູ່ໃນ extensions.
      if (exception instanceof HttpException) {
        return new GraphQLError(message, {
          extensions: {
            code:
              statusCode === HttpStatus.TOO_MANY_REQUESTS ? 'TOO_MANY_REQUESTS' : 'HTTP_EXCEPTION',
            statusCode,
            ...(retryAfterSeconds ? { retryAfterSeconds } : {}),
          },
        });
      }

      return new Error(message);
    }

    // === โค้ดเดิมสำหรับ REST API (เก็บไว้เหมือนเดิมได้เลย) ===
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let retryAfterSeconds: number | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resBody = exception.getResponse();
      if (typeof resBody === 'string') {
        message = resBody;
      } else if (typeof resBody === 'object' && resBody !== null) {
        const rawMessage = (resBody as any).message || JSON.stringify(resBody);
        message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
        retryAfterSeconds = (resBody as any).retryAfterSeconds;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      const msgLower = message.toLowerCase();
      if (msgLower.includes('already exists')) {
        status = HttpStatus.CONFLICT;
      } else if (
        msgLower.includes('is required') ||
        msgLower.includes('invalid') ||
        msgLower.includes('failed to build') ||
        msgLower.includes('failed to persist')
      ) {
        status = HttpStatus.BAD_REQUEST;
      } else if (msgLower.includes('not found')) {
        status = HttpStatus.NOT_FOUND;
      } else {
        status = HttpStatus.BAD_REQUEST;
      }
    } else if (typeof exception === 'string') {
      message = exception;
    }

    if (status === HttpStatus.TOO_MANY_REQUESTS && retryAfterSeconds) {
      response.setHeader('Retry-After', String(retryAfterSeconds));
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(retryAfterSeconds ? { retryAfterSeconds } : {}),
    });
  }
}
