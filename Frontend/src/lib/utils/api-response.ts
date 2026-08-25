import { NextResponse } from "next/server";
import { ApiResponse, ErrorCode, PaginationMeta } from "../types/domain";
import { generateTraceId } from "./trace";

export function apiSuccess<T>(
  data: T,
  meta: { trace_id?: string; pagination?: PaginationMeta; [key: string]: any } = {},
  status = 200
): NextResponse<ApiResponse<T>> {
  const traceId = meta.trace_id || generateTraceId();
  return NextResponse.json(
    {
      success: true,
      data,
      error: null,
      meta: {
        trace_id: traceId,
        ...meta,
      },
    },
    { status }
  );
}

export function apiError(
  code: ErrorCode | string,
  message: string,
  status = 400,
  details: Record<string, any> = {},
  traceId = generateTraceId()
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code,
        message,
        details,
      },
      meta: {
        trace_id: traceId,
      },
    },
    { status }
  );
}
