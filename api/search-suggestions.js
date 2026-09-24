// Same-origin autocomplete endpoint; no browsing history is sent upstream.
export default async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({suggestions:[]})}
  const q=String(req.query?.q||'').trim().slice(0,120);
  if(q.length<2||/^https?:|[/:@]/i.test(q))return res.status(200).json({suggestions:[]});
  try{
    const response=await fetch('https://suggestqueries.google.com/complete/search?client=firefox&q='+encodeURIComponent(q),{signal:AbortSignal.timeout(2500)});
    if(!response.ok)throw Error('Unavailable');const data=await response.json();
    res.setHeader('Cache-Control','private, max-age=60');return res.status(200).json({suggestions:Array.isArray(data[1])?data[1].filter(v=>typeof v==='string').slice(0,7):[]});
  }catch{return res.status(200).json({suggestions:[]})}
}
