import { NextResponse } from "next/server";
import { generateTraceId } from "./trace";
export function apiSuccess(data, meta = {}, status = 200) {
  const traceId = meta.trace_id || generateTraceId();
  return NextResponse.json({
    success: true,
    data,
    error: null,
    meta: {
      trace_id: traceId,
      ...meta
    }
  }, {
    status
  });
}
export function apiError(code, message, status = 400, details = {}, traceId = generateTraceId()) {
  return NextResponse.json({
    success: false,
    data: null,
    error: {
      code,
      message,
      details
    },
    meta: {
      trace_id: traceId
    }
  }, {
    status
  });
}