import { renderToStream } from '@builder.io/qwik/server'
import { manifest } from '@qwik-client-manifest'
import Root from './root'

export default async function (request: Request) {
  const stream = await renderToStream(<Root />, {
    manifest,
    url: new URL(request.url),
    request,
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}