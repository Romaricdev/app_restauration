import { emitDashboardRequestEnd, emitDashboardRequestStart } from './activity'

export async function trackedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  emitDashboardRequestStart()
  try {
    return await fetch(input, init)
  } finally {
    emitDashboardRequestEnd()
  }
}
