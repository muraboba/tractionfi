// Minimal worker entry point for vitest-pool-workers test setup.
// Tests run inside this Worker context and can access D1 via cloudflare:test env.
export default {
  async fetch(): Promise<Response> {
    return new Response('test worker')
  },
}
