/* Normalize legacy display labels, including catalog records saved before V112.
   Resource URLs, identifiers, stored records and editable user drafts are untouched. */
(()=>{
 const excluded='script,style,noscript,textarea,input,[contenteditable]:not([contenteditable="false"])';
 const label=value=>value.replace(/https?:\/\/(?:www\.)?regaged\.com[^\s<>"']*/gi,'Tengaged Reborn').replace(/\bregaged\b/gi,'Tengaged Reborn');
 function text(node){if(node.parentElement?.closest(excluded))return;const next=label(node.nodeValue||'');if(next!==node.nodeValue)node.nodeValue=next;}
 function attributes(node){if(node.matches(excluded))return;for(const key of ['title','alt','aria-label','placeholder'])if(node.hasAttribute(key)){const old=node.getAttribute(key),next=label(old);if(old!==next)node.setAttribute(key,next);}}
 function scan(node){if(node.nodeType===3){text(node);return;}if(node.nodeType!==1&&node.nodeType!==9)return;if(node.nodeType===1&&node.closest(excluded))return;if(node.nodeType===1)attributes(node);const walker=document.createTreeWalker(node,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);while(walker.nextNode()){const current=walker.currentNode;if(current.nodeType===3)text(current);else attributes(current);}}
 scan(document);
 new MutationObserver(records=>{for(const record of records){if(record.type==='characterData')text(record.target);else if(record.type==='attributes')attributes(record.target);else for(const node of record.addedNodes)scan(node);}}).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','alt','aria-label','placeholder']});
})();
