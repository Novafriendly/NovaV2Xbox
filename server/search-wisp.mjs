import {createServer} from 'node:http';
import {server as wisp,logging} from '@mercuryworkshop/wisp-js/server';
logging.set_level(logging.NONE);
Object.assign(wisp.options,{allow_udp_streams:false,allow_private_ips:false,allow_loopback_ips:false,allow_direct_ip:false,port_whitelist:[80,443],stream_limit_per_host:32,stream_limit_total:128});
const origins=new Set((process.env.NOVA_ALLOWED_ORIGINS||'http://127.0.0.1:8780,http://localhost:8780').split(','));
const server=createServer((req,res)=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({service:'Nova transport'}))});
server.on('upgrade',(req,socket,head)=>{if(!origins.has(req.headers.origin)){socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');return}req.url='/';wisp.routeRequest(req,socket,head)});
server.listen(Number(process.env.WISP_PORT||8781),process.env.WISP_HOST||'127.0.0.1');