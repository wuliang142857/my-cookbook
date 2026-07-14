const verificationFiles = {
  '/ByteDanceVerify.html': 's7VKpqSphzXoXfNAslZZ',
};

function verificationResponse(request, body) {
  const headers = {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'public, max-age=0, must-revalidate',
  };

  if (request.method === 'HEAD') {
    return new Response(null, { headers });
  }

  return new Response(body, { headers });
}

export default {
  fetch(request, env) {
    const { pathname } = new URL(request.url);
    const verificationBody = verificationFiles[pathname];

    if (verificationBody !== undefined) {
      return verificationResponse(request, verificationBody);
    }

    return env.ASSETS.fetch(request);
  },
};
