import type { Context } from "hono";

export class ApiResponse {
  statusCode: number;
  data: any;
  message: string;
  success: boolean;

  constructor(statusCode: number, data: any, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  static success(c: Context, data: any, message = "Success", statusCode: any = 200) {
    return c.json(new ApiResponse(statusCode, data, message), statusCode);
  }

  static created(c: Context, data: any, message = "Resource created successfully") {
    return c.json(new ApiResponse(201, data, message), 201);
  }

  static noContent(c: Context) {
    return c.body(null, 204);
  }
}
