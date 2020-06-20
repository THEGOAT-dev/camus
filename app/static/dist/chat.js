!function(e){var t={};function n(o){if(t[o])return t[o].exports;var i=t[o]={i:o,l:!1,exports:{}};return e[o].call(i.exports,i,i.exports,n),i.l=!0,i.exports}n.m=e,n.c=t,n.d=function(e,t,o){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:o})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(n.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)n.d(o,i,function(t){return e[t]}.bind(null,i));return o},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=0)}([function(e,t,n){"use strict";n.r(t);class o{constructor(){this.events=new Map}on(e,t){this.events.has(e)||this.events.set(e,[]),this.events.get(e).push(t)}emit(e,...t){if(this.events.has(e)){this.events.get(e).forEach(e=>{e(...t)})}}}class i extends o{constructor(e,t,n){super(),this.client_id=e.id,this.username=e.username,this.groundControl=t,this.polite=n,this.connection=null,this.makingOffer=!1}async createPeerConnection(){let e={sdpSemantics:"unified-plan",iceServers:[{urls:["stun:stun.l.google.com:19302"]}]};this.connection=new RTCPeerConnection(e),this.connection.ontrack=({track:e,streams:t})=>{console.log("".concat(e.kind," track ").concat(e.id," received from client ").concat(this.client_id)),this.emit("track",e,t)},this.connection.onconnectionstatechange=e=>{this.emit("connectionstatechange",this.connection.connectionState)},this.connection.oniceconnectionstatechange=()=>{console.log("Ice connection state: ".concat(this.connection.iceConnectionState," (Client: ").concat(this.client_id,")")),"failed"===this.connection.iceConnectionState&&this.connection.restartIce(),this.emit("iceconnectionstatechange",this.connection.iceConnectionState)},this.connection.onnegotiationneeded=async()=>{console.log("onnegotiationneeded");try{this.makingOffer=!0,await this.connection.setLocalDescription();const e=this.connection.localDescription.toJSON();await this.groundControl.sendMessage({receiver:this.client_id,type:e.type,data:e})}catch(e){console.error(e)}finally{this.makingOffer=!1}},this.connection.onicecandidate=async({candidate:e})=>{e&&await this.groundControl.sendMessage({receiver:this.client_id,type:"icecandidate",data:e.toJSON()})}}connectionState(){return this.connection.connectionState}iceConnectionState(){return this.connection.iceConnectionState}iceGatheringState(){return this.connection.iceGatheringState}signalingState(){return this.connection.signalingState}remoteDescription(){let e=this.connection.remoteDescription;return e?e.sdp:null}async onOffer(e){if(console.log("Processing offer: ",e),"offer"!==e.type)throw new Error("type mismatch");try{const t=this.makingOffer||"stable"!=this.connection.signalingState;if(console.log("? Polite: ",this.polite),t){if(!this.polite)return;await Promise.all([this.connection.setLocalDescription({type:"rollback"}),this.connection.setRemoteDescription(e)]);const t=await this.connection.createAnswer();await this.connection.setLocalDescription(t);const n=this.connection.localDescription.toJSON();console.log("Respond to offer: ",this.connection.localDescription),await this.groundControl.sendMessage({receiver:this.client_id,type:n.type,data:n})}else await this.connection.setRemoteDescription(e)}catch(e){console.error(e)}}async onAnswer(e){console.log("Processing answer: ",e);try{await this.connection.setRemoteDescription(e)}catch(e){console.error(e)}}async onIceCandidate(e){try{await this.connection.addIceCandidate(e)}catch(e){console.error(e)}}setTrack(e,t=null){let n=this.connection.getSenders().find(t=>t.track&&t.track.kind===e.kind);n?(console.log("Replacing track on sender ",n),n.track.stop(),n.replaceTrack(e)):this.connection.addTrack(e,t)}async restartIce(){this.connection.restartIce()}async shutdown(){null!==this.connection&&(this.connection.getReceivers().forEach(e=>{e.track.stop()}),this.connection.close(),this.connection=null);const e=(new Date).getTime(),t={receiver:this.client_id,type:"bye",data:e};await this.groundControl.sendMessage(t),this.emit("shutdown"),console.log("Shutdown connection with peer "+this.client_id)}}class a{constructor(){this.connection=null,this.datachannel=null,this.createConnection()}createConnection(){let e={sdpSemantics:"unified-plan",iceServers:[{urls:["stun:stun.l.google.com:19302"]}]};this.connection=new RTCPeerConnection(e),this.connection.addEventListener("iceconnectionstatechange",()=>{console.log("Ice connection state:",this.connection.iceConnectionState),"failed"===this.connection.iceConnectionState&&this.connection.restartIce()}),this.datachannel=this.connection.createDataChannel("data"),this.datachannel.onopen=e=>{this.greeting()},console.log("Connection for Ground Control created")}connectionState(){return this.connection.iceConnectionState}async offer(){console.log("In groundControl.offer()");const e=await this.connection.createOffer();for(console.log("created offer",e),await this.connection.setLocalDescription(e),console.log("set local description",this.connection.localDescription);"complete"!=this.connection.iceGatheringState;)await new Promise(e=>setTimeout(e,100));console.log("ice gathering complete"),console.log("Posting offer to "+document.URL+"/offer");const t=await fetch(document.URL+"/offer",{body:JSON.stringify({sdp:this.connection.localDescription.sdp,type:this.connection.localDescription.type}),headers:{"Content-Type":"application/json"},method:"POST"}),n=await t.json();await this.connection.setRemoteDescription(n)}async sendMessage(e){this.datachannel.send(JSON.stringify(e)),"offer"!==e.type&&"answer"!==e.type&&"icecandidate"!==e.type||console.log(">> Sent ".concat(e.type,": "),e)}async sendReceiveMessage(e,t){return new Promise((n,o)=>{let i=this.datachannel;this.datachannel.addEventListener("message",(function e(o){let a=JSON.parse(o.data);(function(e){for(const n in t)if(!e.hasOwnProperty(n)||e[n]!==t[n])return!1;return!0})(a)&&(console.log("Response matched: ",t),i.removeEventListener("message",e),n(a))})),this.sendMessage(e)})}async greeting(){this.sendMessage({receiver:"ground control",type:"greeting",data:"This is Major Tom to Ground Control: I'm stepping through the door. And the stars look very different today."})}async shutdown(){this.connection.getReceivers().forEach(e=>{e.track.stop()});const e={receiver:"ground control",type:"bye",data:(new Date).getTime()};await this.sendMessage(e),this.connection.close(),this.connection=null,this.datachannel=null,console.log("Shutdown connection with Ground Control ")}}class s{constructor(e,t){this.manager=e,this.signaler=t,this.messageListeners=[],this.handlers={ping:this.ping,pong:this.pong,text:this.text,"get-room-info":this.getRoomInfo,"room-info":this.roomInfo,profile:this.profile,offer:this.offer,answer:this.answer,icecandidate:this.iceCandidate,greeting:this.greeting,bye:this.bye}}addMessageListener(e,t){this.messageListeners.push([e,t])}async handleMessage(e){await this.handlers[e.type].call(this,e),this.messageListeners.forEach(([t,n])=>{this.match(e,t)&&(console.log("Calling listener for message: ",e),n(e))})}async ping(e){console.log("<< Received ping: ",e);let t=this.emptyMessage();t.receiver=e.sender,t.type="pong",t.data=e.data,await this.signaler.sendMessage(t)}async pong(e){console.log("<< Received pong: ",e)}async text(e){console.log("<< Received text: ",e),this.manager.textMessages.push(e.data)}async getRoomInfo(e){console.log("<< Received get-room-info: ",e)}async roomInfo(e){console.log("<< Received room-info: ",e),await this.manager.updatePeers(e.data)}async profile(e){console.log("<< Received profile: ",e)}async offer(e){console.log("<< Received offer: ",e);const t=await this.manager.getOrCreateVideoPeer({id:e.sender,username:"Major Tom"}),n=new RTCSessionDescription(e.data);if(e.type!==e.data.type)throw new Error("! Type mismatch in offer");await t.onOffer(n)}async answer(e){console.log("<< Received answer: ",e);const t=await this.manager.getOrCreateVideoPeer({id:e.sender,username:"Major Tom"}),n=new RTCSessionDescription(e.data);if(e.type!==e.data.type)throw new Error("! Type mismatch in answer");await t.onAnswer(n)}async iceCandidate(e){console.log("<< Received icecandidate: ",e);const t=await this.manager.getOrCreateVideoPeer({id:e.sender,username:"Major Tom"}),n=new RTCIceCandidate(e.data);await t.onIceCandidate(n)}async greeting(e){console.log("<< Received greeting: ",e)}async bye(e){console.log("<< Received bye: ",e);let t=e.sender;this.manager.videoPeers.has(t)&&(await this.manager.videoPeers.get(t).shutdown(),this.manager.videoPeers.delete(t))}emptyMessage(){return{sender:"",receiver:"",type:"",data:""}}match(e,t){for(const n in t)if(!e.hasOwnProperty(n)||e[n]!==t[n])return!1;return!0}}window.addEventListener("unhandledrejection",(function(e){console.log("An unhandled error occurred"),console.log(e.promise),console.log(e.reason)})),window.addEventListener("load",(function(){document.querySelector("#user-profile-modal form").addEventListener("submit",e=>{e.preventDefault(),c.saveUserProfile()});document.querySelector("#message-bar form").addEventListener("submit",e=>{e.preventDefault(),c.sendMessage()})})),window.addEventListener("beforeunload",(async function(e){await r.shutdown()}));var r=new class extends o{constructor(){super(),this.username="Major Tom",this.groundControl=new a,this.videoPeers=new Map,this.localVideoStream=null,this.videoTrack=null,this.audioTrack=null,this.textMessages=[],this.messageHandler=new s(this,this.groundControl),this.outbox=[],this.id=null}async setUsername(e){this.username=e;const t={receiver:"ground control",type:"profile",data:{username:this.username}};await this.groundControl.sendMessage(t),console.log("Set username in manager: ",this.username)}setAudioTrack(e){this.setTrack(e),this.audioTrack=e}setVideoTrack(e){this.setTrack(e),this.videoTrack=e}setTrack(e){this.videoPeers.forEach((t,n)=>{console.log("Replace "+e.kind+" track for peer "+n),t.setTrack(e,this.localVideoStream)})}toggleAudio(){this.audioTrack&&(this.audioTrack.enabled=!this.audioTrack.enabled,console.log(this.audioTrack.kind+" enabled: "+this.audioTrack.enabled))}audioEnabled(){return this.audioTrack&&this.audioTrack.enabled}async establishGroundControl(){return await this.groundControl.offer(),this.groundControl}async createVideoPeer(e){let t=new i(e,this.groundControl,this.id<e.id);return this.videoPeers.set(e.id,t),await t.createPeerConnection(),this.localVideoStream&&this.videoTrack&&t.setTrack(this.videoTrack,this.localVideoStream),this.localVideoStream&&this.audioTrack&&t.setTrack(this.audioTrack,this.localVideoStream),console.log("Created video peer ",t.client_id),this.emit("videopeer",t),t}async getOrCreateVideoPeer(e){return this.videoPeers.has(e.id)?this.videoPeers.get(e.id):await this.createVideoPeer(e)}async findPeers(){let e=await this.get_room_info();await this.updatePeers(e)}async updatePeers(e){let t=e.clients.map(({id:e,username:t})=>e);Array.from(this.videoPeers.keys()).filter(e=>!t.includes(e)).forEach(async e=>{let t=this.videoPeers.get(e);await t.shutdown(),this.videoPeers.delete(e),console.log("Removed client ",e)}),e.clients.forEach(async e=>{e.id!==this.id&&await this.getOrCreateVideoPeer(e)}),this.videoPeers.forEach((t,n)=>{let o=t.username,i=e.clients.find(e=>e.id===n);i&&(t.username=i.username,console.log("Set peer username from "+o+" to "+t.username))})}addMessageListener(e,t){this.messageHandler.addMessageListener(e,t)}async shutdownVideoPeers(){this.videoPeers.forEach((async function(e,t){await e.shutdown()})),this.videoPeers.clear()}async get_self_id(){const e=(new Date).getTime();let t={receiver:"ground control",type:"ping",data:e},n={sender:"ground control",type:"pong",data:e};return(await this.groundControl.sendReceiveMessage(t,n)).receiver}async get_room_info(){return(await this.groundControl.sendReceiveMessage({receiver:"ground control",type:"get-room-info"},{sender:"ground control",type:"room-info"})).data}async shutdown(){await this.shutdownVideoPeers(),await this.groundControl.shutdown()}async start(){for(await this.establishGroundControl(),this.groundControl.datachannel.addEventListener("message",e=>{this.messageHandler.handleMessage(JSON.parse(e.data))});"open"!=this.groundControl.datachannel.readyState;)await new Promise(e=>setTimeout(e,100));this.id=await this.get_self_id();await this.findPeers()}},c=new class{constructor(e){this.manager=e,this.videoMode="camera"}attachVideoElement(e,t){document.getElementById("video-"+e).srcObject=t}createVideoElement(e,t){if(document.querySelector("#video-box-"+e))return;let n=document.createElement("p");n.className="video-tag",n.innerHTML=t;let o=document.createElement("video");o.id="video-"+e,o.autoplay="true",o.style.width="100%",o.playsinline="true","local"===e&&(o.muted="true");let i=document.getElementById("video-thumbs"),a=document.createElement("div");a.className="video-box",a.id="video-box-"+e,a.draggable="true",a.ondragstart=e=>{!function(e){console.log("dragVideo"),e.dataTransfer.setData("id",e.target.id)}(e)},a.ondrop=e=>{!function(e,t){console.log("dropVideo"),e.preventDefault();let n=e.dataTransfer.getData("id"),o=document.getElementById(t),i=document.getElementById(n);(function(e,t){let n=e.parentNode,o=t.parentNode,i=document.createElement("span"),a=document.createElement("span");n.insertBefore(i,e),o.insertBefore(a,t),n.insertBefore(t,i),o.insertBefore(e,a),n.removeChild(i),o.removeChild(a)})(o,i),console.log("Drop "+i.id+" on me!!!")}(e,a.id)},a.ondragover=e=>{!function(e){e.preventDefault()}(e)},a.addEventListener("click",e=>{console.log("Click on videoBox",a);let t=document.getElementById("video-stage"),n=document.getElementById("video-thumbs"),o=t.firstElementChild;null!=o&&n.append(o),a!==o&&t.append(a)}),o.addEventListener("mouseover",t=>{if("local"===e)return void(n.innerHTML=this.manager.username);const o=this.manager.videoPeers.get(e);n.innerHTML=o.username}),a.appendChild(n),a.appendChild(o),i.appendChild(a)}removeVideoElement(e){const t=document.getElementById("video-box-"+e);t&&t.remove()}async toggleVideo(){if("camera"==this.videoMode){this.manager.localVideoStream.getTracks().find(e=>"video"===e.kind).stop(),document.getElementById("toggle-video-icon").innerHTML="videocam_off",this.videoMode="off"}else await this.streamVideo()}async toggleDisplay(){if("display"==this.videoMode){this.manager.localVideoStream.getTracks().find(e=>"video"===e.kind).stop(),document.getElementById("toggle-display-icon").innerHTML="stop_screen_share",this.videoMode="off"}else await this.streamDisplay()}toggleAudio(){console.log("Toggle audio",this.manager.audioTrack),this.manager.toggleAudio();let e=document.getElementById("toggle-audio-icon");this.manager.audioEnabled()?e.innerHTML="mic":e.innerHTML="mic_off"}async streamVideo(){if(this.manager.localVideoStream){const e=this.manager.localVideoStream.getTracks().find(e=>"video"===e.kind);e&&e.stop()}const e=await navigator.mediaDevices.getUserMedia({audio:!0,video:!0}),t=e.getTracks().find(e=>"video"===e.kind),n=e.getTracks().find(e=>"audio"===e.kind);this.createVideoElement("local",this.manager.username),this.attachVideoElement("local",e),this.manager.localVideoStream=e,this.manager.setVideoTrack(t),this.manager.setAudioTrack(n),document.getElementById("toggle-video-icon").innerHTML="videocam",document.getElementById("toggle-display-icon").innerHTML="stop_screen_share",this.videoMode="camera"}async streamDisplay(){let e=await navigator.mediaDevices.getDisplayMedia({video:{cursor:"always",displaySurface:"application"},audio:!1});this.manager.localVideoStream.getTracks().find(e=>"video"===e.kind).stop();let t=e.getTracks().find(e=>"video"===e.kind);document.getElementById("video-local").srcObject=e,this.manager.localVideoStream=e,this.manager.setVideoTrack(t),document.getElementById("toggle-video-icon").innerHTML="videocam_off",document.getElementById("toggle-display-icon").innerHTML="screen_share",this.videoMode="display"}async sendMessage(){document.getElementById("message-log");let e=document.getElementById("message-input"),t=e.value;if(!t)return;const n=(new Date).getTime(),o={receiver:"room",type:"text",data:{from:this.manager.username,time:n,text:t}};await this.manager.groundControl.sendMessage(o),e.value="",console.log("Sent message: ",t)}updateMessageBar(e){let t=document.createElement("p");t.setAttribute("class","message-time"),t.innerHTML=new Date(e.data.time).toLocaleTimeString("en-US");let n=document.createElement("p");n.setAttribute("class","message-from"),n.innerHTML=e.data.from;let o=document.createElement("p");o.setAttribute("class","message-text"),o.innerHTML=e.data.text;let i=document.getElementById("message-log");i.appendChild(n),i.appendChild(t),i.appendChild(o)}promptUserName(){$("#user-profile-modal").modal("show")}async saveUserProfile(){const e=document.querySelector("#username-input").value;await this.manager.setUsername(e),$("#user-profile-modal").modal("hide")}restartIce(){this.manager.videoPeers.forEach((e,t)=>{e.restartIce()})}mediaInfo(){let e=this.manager.videoTrack.getSettings();console.log("Device ID: ",e.deviceId),console.log("Framerate: ",e.frameRate),console.log("Height: ",e.height),console.log("Width: ",e.width)}updateTechnical(){let e=document.querySelector("#technical-bar");e.textContent="",this.manager.videoPeers.forEach((t,n)=>{console.log("Update technical for client "+n);let o=function(e){let t=document.querySelector("#connection-info-template").content.cloneNode(!0);t.querySelector("div").id="connection-info-"+e.client_id;let n=t.querySelector("button");n.dataset.target="#connection-info-collapse-"+e.client_id,n.innerHTML=e.username;let o=t.querySelector("div.collapse");return o.id="connection-info-collapse-"+e.client_id,o.querySelector(".info-username").innerHTML=e.username,o.querySelector(".info-client-id").innerHTML=e.client_id,o.querySelector(".info-connection-state").innerHTML=e.connectionState(),o.querySelector(".info-ice-connection-state").innerHTML=e.iceConnectionState(),o.querySelector(".info-ice-gathering-state").innerHTML=e.iceGatheringState(),o.querySelector(".info-signaling-state").innerHTML=e.signalingState(),t}(t);e.appendChild(o)})}async start(){await new Promise(e=>setTimeout(e,200)),await this.streamVideo();this.manager.addMessageListener({type:"text"},this.updateMessageBar),this.manager.on("videopeer",e=>{e.on("track",(t,n)=>{"video"===t.kind&&(t.onunmute=()=>{this.createVideoElement(e.client_id,e.username),this.attachVideoElement(e.client_id,n[0])})}),e.on("shutdown",()=>{this.removeVideoElement(e.client_id)}),e.on("connectionstatechange",t=>{switch(t){case"disconnected":case"failed":case"closed":this.removeVideoElement(e.client_id)}})}),document.querySelector("#toggle-video").addEventListener("click",()=>{this.toggleVideo()}),document.querySelector("#toggle-audio").addEventListener("click",()=>{this.toggleAudio()}),document.querySelector("#toggle-display").addEventListener("click",()=>{this.toggleDisplay()}),document.querySelector("#technical-button").addEventListener("click",()=>{this.updateTechnical()}),this.promptUserName()}shutdown(){this.manager.shutdown()}}(r);!async function(){await c.start(),await r.start()}()}]);