const slt=document.querySelector("#social-link-transition");document.querySelectorAll(".social-button").forEach((t=>{t.addEventListener("click",(t=>{slt.style.left=t.pageX+"px",slt.style.top=t.pageY+"px",slt.classList.add(t.target.classList[1],"show")}))})),window.addEventListener("pageshow",(()=>{slt.classList.remove("show")}));
//# sourceMappingURL=index.29438342.js.map
