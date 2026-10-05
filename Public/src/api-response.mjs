export async function apiResponse(response) {
 const text=await response.text();let body;
 try{body=JSON.parse(text)}catch{
  const error=Error(response.status===402||/^\s*Payment required/i.test(text)?'Nova’s server is unavailable because Vercel has restricted the deployment. The site owner needs to check Vercel usage and billing.':'Nova’s server returned an unavailable response. Please try again shortly.');
  error.status=response.status;throw error;
 }
 if(!body||typeof body!=='object'||Array.isArray(body)){const error=Error('Nova’s server returned an invalid response. Please try again shortly.');error.status=response.status;throw error}
 return body;
}
