export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    const redirectUri = `${url.origin}/api/auth`;
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user`;
    return Response.redirect(authUrl, 302);
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: code,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    return new Response(
      `<html><body><script>
        if (window.opener) {
          window.opener.postMessage(
            'authorization:github:error:${JSON.stringify({ message: tokenData.error_description || tokenData.error })}',
            window.location.origin
          );
          window.close();
        }
      </script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const content = JSON.stringify({ token: tokenData.access_token, provider: "github" });

  return new Response(
    `<html><body><script>
      (function() {
        function receiveMessage(e) {
          console.log("receiveMessage", e);
          window.opener.postMessage(
            'authorization:github:success:${content}',
            e.origin
          );
          window.removeEventListener("message", receiveMessage, false);
        }
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:github", "*");
      })();
    </script></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
