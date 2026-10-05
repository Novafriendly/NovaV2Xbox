# Shared Nova backend

Deploy this updated code to https://novaoffical.vercel.app first, then deploy copies with the API functions included. Copies without FIREBASE_SERVICE_ACCOUNT_JSON automatically forward account login, owner controls, staff directory, voice and remote requests to the primary site. No private environment variables need to be copied. The primary still needs its existing secrets.

Authentication and role checks run on the primary API. Copies share its Firebase project, accounts and service costs. Setting an independent service account disables forwarding. Only deploy copies you trust: a site handling sign-in can access its signed-in users' tokens.

For temporary TURN credentials configure NOVA_TURN_URL and NOVA_TURN_SECRET on the primary using a provider that supports REST/HMAC credentials. Existing NOVA_TURN_USERNAME and NOVA_TURN_CREDENTIAL remain supported but are static credentials delivered to WebRTC clients. This feature does not make them temporary.

Shared login now allows new HTTPS copy origins after the signed-in user explicitly approves the exact website on the primary. Approval is remembered per user and website in that browser. Only the primary performs password login; copies redeem single-use, destination-bound codes and sign in with custom tokens. Set NOVA_LOGIN_USER_APPROVAL=false to require the old administrator allowlist instead. Search proxy transport, AI provider configuration and static-only hosting are outside this shared Firebase backend setup.

Only fixed endpoints forward to the fixed HTTPS primary. Requests have a size limit and timeout, redirects are disabled, and a hop marker prevents loops. There is no endpoint that returns the service account or owner setup code.

If the primary browser address is blocked, copies stay on their own sign-in page after a short reachability check. Email and username/password requests use the copy server to reach the shared backend; existing Firebase sessions restore locally. Each new domain still needs one sign-in. The primary server must remain reachable from the copy server, and Firebase services must be reachable from the browser. Use /account.html?local-login=1 to bypass the browser handoff explicitly.
