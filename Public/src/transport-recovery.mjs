/* A failed upstream file must not replace the connection used by active videos. */
export function shouldReconnectTransport(error){
 const message=String(error);
 // TLS and incomplete HTTP responses belong to the requested server or file.
 // Retry the read on the existing client; reconnecting cancels unrelated streams.
 if(/code 18|code 35|code 92|partial file|HTTP\/2|SSL|TLS|certificate/i.test(message))return false;
 return /socket|closed|reset|connect|network|timeout/i.test(message);
}
