exports.shouldEndSession=(value,observed,current)=>!value.device.enabled||!!(current&&current===observed&&(!value.session||value.session.id!==current||value.session.status!=='active'));
